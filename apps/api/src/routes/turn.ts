import { createHmac } from "node:crypto";

import type { FastifyInstance } from "fastify";

import { config } from "../config.js";
import { requireVerifiedAuth } from "../auth/middleware.js";

interface TurnCredentialResponse {
  username: string;
  credential: string;
  ttl: number;
  expiresAt: string;
  iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
}

export async function turnRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/turn-credentials", {
    preHandler: requireVerifiedAuth,
    config: { rateLimit: { max: 20, timeWindow: "5 minutes" } },
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const ttl = config.TURN_TTL_SECONDS;
      const expiry = Math.floor(Date.now() / 1000) + ttl;
      const username = `${expiry}:${req.auth.sub}`;
      const credential = createHmac("sha1", config.TURN_SHARED_SECRET)
        .update(username)
        .digest("base64");

      const iceServers: TurnCredentialResponse["iceServers"] = [];
      if (config.STUN_URL_LIST.length > 0) {
        iceServers.push({ urls: config.STUN_URL_LIST });
      }
      if (config.TURN_URL_LIST.length > 0) {
        iceServers.push({
          urls: config.TURN_URL_LIST,
          username,
          credential,
        });
      }

      const body: TurnCredentialResponse = {
        username,
        credential,
        ttl,
        expiresAt: new Date(expiry * 1000).toISOString(),
        iceServers,
      };
      return reply
        .header("cache-control", "no-store")
        .send(body);
    },
  });
}
