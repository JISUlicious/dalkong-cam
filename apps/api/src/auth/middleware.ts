import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyAccessToken } from "./tokens.js";
import type { AccessClaims } from "./tokens.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AccessClaims;
  }
}

export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "missing_token" });
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    req.auth = verifyAccessToken(token);
  } catch {
    return reply.code(401).send({ error: "invalid_token" });
  }
}

export async function requireVerifiedAuth(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireAuth(req, reply);
  if (reply.sent) return;
  if (!req.auth?.emailVerified) {
    return reply.code(403).send({ error: "email_not_verified" });
  }
}
