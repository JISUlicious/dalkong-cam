import type { FastifyInstance } from "fastify";
import { and, desc, eq, lt } from "drizzle-orm";
import { z } from "zod";

import { db, schema } from "../db/index.js";
import { requireVerifiedAuth } from "../auth/middleware.js";
import { requestUploadUrlSchema } from "@dalkong/shared";
import {
  buildVideoKey,
  presignedDownload,
  presignedUpload,
  removeObject,
  statObject,
} from "../storage/minio.js";
import { sendMotionPush } from "../push/notify.js";

const listQuerySchema = z.object({
  deviceId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().datetime().optional(),
});

export async function videoRoutes(app: FastifyInstance): Promise<void> {
  app.post("/videos/upload-url", {
    preHandler: requireVerifiedAuth,
    config: { rateLimit: { max: 120, timeWindow: "15 minutes" } },
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const parsed = requestUploadUrlSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request" });
      }
      const { deviceId, recordedAt, durationMs, sizeBytes, contentType } =
        parsed.data;

      const [device] = await db
        .select()
        .from(schema.devices)
        .where(
          and(
            eq(schema.devices.id, deviceId),
            eq(schema.devices.userId, req.auth.sub),
            eq(schema.devices.role, "camera"),
          ),
        )
        .limit(1);
      if (!device) return reply.code(404).send({ error: "camera_not_found" });

      const [row] = await db
        .insert(schema.savedVideos)
        .values({
          userId: req.auth.sub,
          deviceId,
          deviceName: device.name,
          storageKey: "pending",
          sizeBytes,
          durationMs: durationMs ?? null,
          contentType,
          recordedAt: new Date(recordedAt),
        })
        .returning();
      if (!row) return reply.code(500).send({ error: "create_failed" });

      const key = buildVideoKey({
        userId: req.auth.sub,
        deviceId,
        videoId: row.id,
      });
      await db
        .update(schema.savedVideos)
        .set({ storageKey: key })
        .where(eq(schema.savedVideos.id, row.id));

      const presigned = await presignedUpload({
        key,
        contentType,
        contentLength: sizeBytes,
      });
      return reply.send({
        videoId: row.id,
        uploadUrl: presigned.uploadUrl,
        uploadHeaders: presigned.uploadHeaders,
        expiresAt: presigned.expiresAt.toISOString(),
      });
    },
  });

  app.post("/videos/:id/complete", {
    preHandler: requireVerifiedAuth,
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const { id } = req.params as { id: string };
      const [row] = await db
        .select()
        .from(schema.savedVideos)
        .where(
          and(
            eq(schema.savedVideos.id, id),
            eq(schema.savedVideos.userId, req.auth.sub),
          ),
        )
        .limit(1);
      if (!row) return reply.code(404).send({ error: "not_found" });

      let actualSize: number;
      try {
        const stat = await statObject(row.storageKey);
        actualSize = stat.size;
      } catch {
        return reply.code(409).send({ error: "object_not_uploaded" });
      }
      if (Math.abs(actualSize - row.sizeBytes) > 1024) {
        return reply.code(409).send({ error: "size_mismatch" });
      }
      await db
        .update(schema.savedVideos)
        .set({ uploadCompleted: true, sizeBytes: actualSize })
        .where(eq(schema.savedVideos.id, row.id));

      sendMotionPush({ userId: req.auth.sub, videoId: row.id, deviceId: row.deviceId, deviceName: row.deviceName }).catch(
        (err) => req.log.warn({ err }, "push failed"),
      );

      return reply.send({ ok: true });
    },
  });

  app.get("/videos", {
    preHandler: requireVerifiedAuth,
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_query" });
      }
      const { deviceId, limit, before } = parsed.data;
      const conditions = [
        eq(schema.savedVideos.userId, req.auth.sub),
        eq(schema.savedVideos.uploadCompleted, true),
      ];
      if (deviceId) conditions.push(eq(schema.savedVideos.deviceId, deviceId));
      if (before)
        conditions.push(lt(schema.savedVideos.recordedAt, new Date(before)));

      const rows = await db
        .select()
        .from(schema.savedVideos)
        .where(and(...conditions))
        .orderBy(desc(schema.savedVideos.recordedAt))
        .limit(limit);

      const items = await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          deviceId: r.deviceId,
          deviceName: r.deviceName,
          recordedAt: r.recordedAt.toISOString(),
          sizeBytes: r.sizeBytes,
          durationMs: r.durationMs,
          downloadUrl: await presignedDownload(r.storageKey),
        })),
      );
      return reply.send({ videos: items });
    },
  });

  app.get("/videos/:id/download-url", {
    preHandler: requireVerifiedAuth,
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const { id } = req.params as { id: string };
      const [row] = await db
        .select()
        .from(schema.savedVideos)
        .where(
          and(
            eq(schema.savedVideos.id, id),
            eq(schema.savedVideos.userId, req.auth.sub),
            eq(schema.savedVideos.uploadCompleted, true),
          ),
        )
        .limit(1);
      if (!row) return reply.code(404).send({ error: "not_found" });
      const url = await presignedDownload(row.storageKey);
      return reply.send({ downloadUrl: url });
    },
  });

  app.delete("/videos/:id", {
    preHandler: requireVerifiedAuth,
    handler: async (req, reply) => {
      if (!req.auth) return reply.code(401).send({ error: "unauthorized" });
      const { id } = req.params as { id: string };
      const [row] = await db
        .select()
        .from(schema.savedVideos)
        .where(
          and(
            eq(schema.savedVideos.id, id),
            eq(schema.savedVideos.userId, req.auth.sub),
          ),
        )
        .limit(1);
      if (!row) return reply.code(404).send({ error: "not_found" });
      await removeObject(row.storageKey).catch(() => {
        /* object may not exist */
      });
      await db
        .delete(schema.savedVideos)
        .where(eq(schema.savedVideos.id, row.id));
      return reply.send({ ok: true });
    },
  });
}
