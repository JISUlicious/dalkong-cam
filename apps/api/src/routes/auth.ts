import type { FastifyInstance } from "fastify";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";

import { db, schema } from "../db/index.js";
import {
  loginRequestSchema,
  refreshRequestSchema,
  signupRequestSchema,
  verifyEmailRequestSchema,
} from "@dalkong/shared";
import { config } from "../config.js";
import {
  checkPasswordPolicy,
  hashPassword,
  verifyPassword,
} from "../auth/passwords.js";
import {
  hashRefreshToken,
  issueAccessToken,
  issueEmailVerificationToken,
  issueRefreshToken,
  verifyEmailVerificationToken,
  verifyRefreshToken,
} from "../auth/tokens.js";
import { sendEmailVerification } from "../email/sender.js";
import { requireAuth } from "../auth/middleware.js";

const MAX_FAILED_LOGINS = 8;
const LOCKOUT_MINUTES = 15;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/signup", {
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    handler: async (req, reply) => {
      const parsed = signupRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", details: parsed.error.flatten() });
      }
      const { email, password } = parsed.data;
      const policy = checkPasswordPolicy(password, [email]);
      if (!policy.ok) {
        return reply.code(400).send({ error: "weak_password", message: policy.reason });
      }

      const existing = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(sql`lower(${schema.users.email}) = lower(${email})`)
        .limit(1);

      if (existing.length > 0) {
        return reply.code(200).send({ ok: true });
      }

      const passwordHash = await hashPassword(password);
      const [user] = await db
        .insert(schema.users)
        .values({
          email,
          passwordHash,
          emailVerificationSentAt: new Date(),
        })
        .returning();
      if (!user) {
        return reply.code(500).send({ error: "signup_failed" });
      }

      const verifyToken = issueEmailVerificationToken(user.id);
      const verifyUrl = `${config.PUBLIC_BASE_URL}/auth/verify-email?token=${encodeURIComponent(verifyToken)}`;
      try {
        await sendEmailVerification({ to: user.email, verifyUrl });
      } catch (err) {
        req.log.error({ err }, "failed to send verification email");
      }
      return reply.code(201).send({ ok: true });
    },
  });

  app.post("/auth/verify-email", {
    config: { rateLimit: { max: 20, timeWindow: "15 minutes" } },
    handler: async (req, reply) => {
      const parsed = verifyEmailRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request" });
      }
      try {
        const { sub } = verifyEmailVerificationToken(parsed.data.token);
        await db
          .update(schema.users)
          .set({ emailVerified: true, updatedAt: new Date() })
          .where(eq(schema.users.id, sub));
        return reply.send({ ok: true });
      } catch {
        return reply.code(400).send({ error: "invalid_or_expired_token" });
      }
    },
  });

  app.post("/auth/login", {
    config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
    handler: async (req, reply) => {
      const parsed = loginRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request" });
      }
      const { email, password, deviceLabel } = parsed.data;

      const [user] = await db
        .select()
        .from(schema.users)
        .where(sql`lower(${schema.users.email}) = lower(${email})`)
        .limit(1);

      const genericFail = () =>
        reply.code(401).send({ error: "invalid_credentials" });

      if (!user) {
        await hashPassword("dummy-password-for-timing");
        return genericFail();
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return reply.code(429).send({ error: "account_locked" });
      }

      const ok = await verifyPassword(user.passwordHash, password);
      if (!ok) {
        const nextCount = user.failedLoginCount + 1;
        const lockedUntil =
          nextCount >= MAX_FAILED_LOGINS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            : null;
        await db
          .update(schema.users)
          .set({
            failedLoginCount: nextCount,
            lockedUntil,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, user.id));
        return genericFail();
      }

      await db
        .update(schema.users)
        .set({ failedLoginCount: 0, lockedUntil: null, updatedAt: new Date() })
        .where(eq(schema.users.id, user.id));

      const accessToken = issueAccessToken({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      });
      const refresh = issueRefreshToken(user.id);
      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash: refresh.tokenHash,
        deviceLabel: deviceLabel ?? null,
        expiresAt: refresh.expiresAt,
      });

      return reply.send({
        accessToken,
        refreshToken: refresh.token,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      });
    },
  });

  app.post("/auth/refresh", {
    config: { rateLimit: { max: 60, timeWindow: "15 minutes" } },
    handler: async (req, reply) => {
      const parsed = refreshRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request" });
      }
      let claims;
      try {
        claims = verifyRefreshToken(parsed.data.refreshToken);
      } catch {
        return reply.code(401).send({ error: "invalid_refresh" });
      }
      const tokenHash = hashRefreshToken(parsed.data.refreshToken);
      const [row] = await db
        .select()
        .from(schema.refreshTokens)
        .where(
          and(
            eq(schema.refreshTokens.tokenHash, tokenHash),
            eq(schema.refreshTokens.userId, claims.sub),
            isNull(schema.refreshTokens.revokedAt),
            gt(schema.refreshTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);
      if (!row) {
        await db
          .update(schema.refreshTokens)
          .set({ revokedAt: new Date() })
          .where(eq(schema.refreshTokens.userId, claims.sub));
        return reply.code(401).send({ error: "refresh_revoked" });
      }
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, claims.sub))
        .limit(1);
      if (!user) {
        return reply.code(401).send({ error: "user_missing" });
      }

      await db
        .update(schema.refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(schema.refreshTokens.id, row.id));

      const accessToken = issueAccessToken({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      });
      const next = issueRefreshToken(user.id);
      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash: next.tokenHash,
        deviceLabel: row.deviceLabel,
        expiresAt: next.expiresAt,
      });
      return reply.send({
        accessToken,
        refreshToken: next.token,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      });
    },
  });

  app.post("/auth/logout", {
    preHandler: requireAuth,
    handler: async (req, reply) => {
      const body = (req.body ?? {}) as { refreshToken?: string };
      if (body.refreshToken && req.auth) {
        const tokenHash = hashRefreshToken(body.refreshToken);
        await db
          .update(schema.refreshTokens)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(schema.refreshTokens.tokenHash, tokenHash),
              eq(schema.refreshTokens.userId, req.auth.sub),
            ),
          );
      }
      return reply.send({ ok: true });
    },
  });

  app.get("/auth/me", {
    preHandler: requireAuth,
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const [user] = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          emailVerified: schema.users.emailVerified,
        })
        .from(schema.users)
        .where(eq(schema.users.id, req.auth.sub))
        .limit(1);
      if (!user) return reply.code(404).send({ error: "not_found" });
      return reply.send({ user });
    },
  });

  app.get("/auth/sessions/cleanup", async () => {
    const deleted = await db
      .delete(schema.refreshTokens)
      .where(lt(schema.refreshTokens.expiresAt, new Date()))
      .returning({ id: schema.refreshTokens.id });
    return { deleted: deleted.length };
  });
}
