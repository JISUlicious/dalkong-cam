import type { FastifyInstance } from "fastify";
import { and, asc, eq, inArray } from "drizzle-orm";

import { db, schema } from "../db/index.js";
import { requireVerifiedAuth } from "../auth/middleware.js";
import {
  pairRequestSchema,
  registerDeviceRequestSchema,
  updateFcmTokenRequestSchema,
} from "@dalkong/shared";
import {
  generateOpaqueToken,
  sha256Hex,
} from "../auth/tokens.js";
import { hashPassword } from "../auth/passwords.js";
import { presenceTracker } from "../ws/presence.js";

export async function deviceRoutes(app: FastifyInstance): Promise<void> {
  app.post("/devices", {
    preHandler: requireVerifiedAuth,
    config: { rateLimit: { max: 30, timeWindow: "15 minutes" } },
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const parsed = registerDeviceRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request" });
      }
      const deviceSecret = generateOpaqueToken(32);
      const deviceSecretHash = await hashPassword(deviceSecret);
      const [device] = await db
        .insert(schema.devices)
        .values({
          userId: req.auth.sub,
          role: parsed.data.role,
          name: parsed.data.name,
          deviceSecretHash,
        })
        .returning();
      if (!device) return reply.code(500).send({ error: "create_failed" });
      return reply.code(201).send({
        id: device.id,
        role: device.role,
        name: device.name,
        deviceSecret,
      });
    },
  });

  app.get("/devices", {
    preHandler: requireVerifiedAuth,
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const rows = await db
        .select({
          id: schema.devices.id,
          role: schema.devices.role,
          name: schema.devices.name,
          isRecording: schema.devices.isRecording,
          lastSeenAt: schema.devices.lastSeenAt,
        })
        .from(schema.devices)
        .where(eq(schema.devices.userId, req.auth.sub))
        .orderBy(asc(schema.devices.createdAt));
      return reply.send({
        devices: rows.map((d) => ({
          ...d,
          isOnline: presenceTracker.isOnline(d.id),
          lastSeenAt: d.lastSeenAt.toISOString(),
        })),
      });
    },
  });

  app.delete("/devices/:id", {
    preHandler: requireVerifiedAuth,
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const { id } = req.params as { id: string };
      const result = await db
        .delete(schema.devices)
        .where(and(eq(schema.devices.id, id), eq(schema.devices.userId, req.auth.sub)))
        .returning({ id: schema.devices.id });
      if (result.length === 0) return reply.code(404).send({ error: "not_found" });
      return reply.send({ ok: true });
    },
  });

  app.post("/devices/:id/push-token", {
    preHandler: requireVerifiedAuth,
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const { id } = req.params as { id: string };
      const parsed = updateFcmTokenRequestSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_request" });
      const result = await db
        .update(schema.devices)
        .set({ fcmToken: parsed.data.fcmToken, lastSeenAt: new Date() })
        .where(and(eq(schema.devices.id, id), eq(schema.devices.userId, req.auth.sub)))
        .returning({ id: schema.devices.id });
      if (result.length === 0) return reply.code(404).send({ error: "not_found" });
      return reply.send({ ok: true });
    },
  });

  app.post("/devices/pair", {
    preHandler: requireVerifiedAuth,
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const parsed = pairRequestSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_request" });
      const { cameraId, viewerId } = parsed.data;

      const owned = await db
        .select({ id: schema.devices.id, role: schema.devices.role })
        .from(schema.devices)
        .where(
          and(
            eq(schema.devices.userId, req.auth.sub),
            inArray(schema.devices.id, [cameraId, viewerId]),
          ),
        );
      if (owned.length !== 2) {
        return reply.code(403).send({ error: "not_owner" });
      }
      const camera = owned.find((d) => d.id === cameraId);
      const viewer = owned.find((d) => d.id === viewerId);
      if (!camera || camera.role !== "camera" || !viewer || viewer.role !== "viewer") {
        return reply.code(400).send({ error: "role_mismatch" });
      }

      await db
        .insert(schema.cameraViewerPairs)
        .values({ userId: req.auth.sub, cameraId, viewerId })
        .onConflictDoNothing();

      return reply.send({ ok: true });
    },
  });
}
