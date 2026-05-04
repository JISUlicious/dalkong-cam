import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import websocket from "@fastify/websocket";
import Fastify, { type FastifyInstance } from "fastify";

import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { deviceRoutes } from "./routes/devices.js";
import { healthRoutes } from "./routes/health.js";
import { turnRoutes } from "./routes/turn.js";
import { videoRoutes } from "./routes/videos.js";
import { signalingWs } from "./ws/signaling.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.isProd
      ? { level: "info" }
      : {
          level: "debug",
          transport: { target: "pino-pretty", options: { colorize: true } },
        },
    bodyLimit: 1 * 1024 * 1024,
    trustProxy: true,
    disableRequestLogging: config.isProd,
  });

  await app.register(sensible);
  await app.register(cookie);
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.CORS_ORIGIN_LIST.length === 0) return cb(null, true);
      if (config.CORS_ORIGIN_LIST.includes(origin)) return cb(null, true);
      cb(new Error("Origin not allowed"), false);
    },
    credentials: true,
  });
  await app.register(rateLimit, {
    global: false,
    max: 300,
    timeWindow: "1 minute",
  });
  await app.register(websocket, {
    options: {
      maxPayload: 64 * 1024,
    },
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(deviceRoutes);
  await app.register(turnRoutes);
  await app.register(videoRoutes);
  await app.register(signalingWs);

  app.setErrorHandler((err, req, reply) => {
    req.log.error({ err }, "request error");
    if (reply.sent) return;
    if ((err as { statusCode?: number }).statusCode) {
      reply.code((err as { statusCode: number }).statusCode).send({
        error: err.name,
        message: err.message,
      });
      return;
    }
    reply.code(500).send({ error: "internal_error" });
  });

  return app;
}
