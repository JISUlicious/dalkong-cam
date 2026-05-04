import type { FastifyInstance } from "fastify";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";

import { db, schema } from "../db/index.js";
import {
  clientMessageSchema,
  type ServerMessage,
} from "@dalkong/shared";
import { verifyAccessToken } from "../auth/tokens.js";
import { verifyPassword } from "../auth/passwords.js";
import { presenceTracker } from "./presence.js";

const HELLO_TIMEOUT_MS = 5_000;
const MAX_MESSAGE_BYTES = 32 * 1024;

const helloSchema = z.object({
  type: z.literal("hello"),
  deviceId: z.string().uuid(),
  deviceSecret: z.string().min(1).max(256),
  sessionId: z.string().min(1).max(120),
});

export async function signalingWs(app: FastifyInstance): Promise<void> {
  app.get("/signaling", { websocket: true }, (socket, req) => {
    const sendError = (code: string, message: string) => {
      const payload: ServerMessage = { type: "error", code, message };
      try {
        socket.send(JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    };
    const send = (msg: ServerMessage) => {
      try {
        socket.send(JSON.stringify(msg));
      } catch {
        /* ignore */
      }
    };

    const authHeader = req.headers.authorization;
    let userId: string;
    try {
      if (!authHeader?.startsWith("Bearer ")) throw new Error("no auth");
      const claims = verifyAccessToken(authHeader.slice(7).trim());
      if (!claims.emailVerified) throw new Error("email not verified");
      userId = claims.sub;
    } catch {
      sendError("unauthorized", "missing or invalid access token");
      socket.close(4401, "unauthorized");
      return;
    }

    let authenticated: { deviceId: string; role: "camera" | "viewer"; sessionId: string } | null = null;

    const helloTimeout = setTimeout(() => {
      if (!authenticated) {
        sendError("hello_timeout", "did not receive hello in time");
        socket.close(4408, "hello_timeout");
      }
    }, HELLO_TIMEOUT_MS);

    socket.on("close", () => {
      clearTimeout(helloTimeout);
      if (authenticated) {
        const peers = peersAllowedFor(userId, authenticated.deviceId, authenticated.role).then((ids) => {
          for (const peerId of ids) {
            const peer = presenceTracker.get(peerId);
            if (peer) {
              const offlineMsg: ServerMessage = {
                type: "peer-offline",
                deviceId: authenticated!.deviceId,
              };
              try {
                peer.socket.send(JSON.stringify(offlineMsg));
              } catch {
                /* ignore */
              }
            }
          }
        });
        peers.catch(() => {});
        presenceTracker.remove(authenticated.deviceId, socket);
        db.update(schema.devices)
          .set({ lastSeenAt: new Date() })
          .where(eq(schema.devices.id, authenticated.deviceId))
          .catch(() => {});
      }
    });

    socket.on("message", async (raw: Buffer) => {
      const buf = raw;
      if (buf.byteLength > MAX_MESSAGE_BYTES) {
        sendError("message_too_large", "max 32KiB");
        socket.close(4413, "too_large");
        return;
      }
      let data: unknown;
      try {
        data = JSON.parse(buf.toString("utf8"));
      } catch {
        sendError("bad_json", "could not parse JSON");
        return;
      }

      if (!authenticated) {
        const helloParsed = helloSchema.safeParse(data);
        if (!helloParsed.success) {
          sendError("expected_hello", "first message must be hello");
          socket.close(4400, "expected_hello");
          return;
        }
        const { deviceId, deviceSecret, sessionId } = helloParsed.data;
        const [device] = await db
          .select()
          .from(schema.devices)
          .where(
            and(eq(schema.devices.id, deviceId), eq(schema.devices.userId, userId)),
          )
          .limit(1);
        if (!device) {
          sendError("device_not_found", "no such device for this user");
          socket.close(4404, "no_device");
          return;
        }
        const ok = await verifyPassword(device.deviceSecretHash, deviceSecret);
        if (!ok) {
          sendError("bad_device_secret", "device secret rejected");
          socket.close(4403, "bad_secret");
          return;
        }
        clearTimeout(helloTimeout);
        authenticated = { deviceId, role: device.role, sessionId };
        presenceTracker.set({
          socket,
          userId,
          deviceId,
          role: device.role,
          name: device.name,
          sessionId,
        });
        await db
          .update(schema.devices)
          .set({ sessionId, lastSeenAt: new Date() })
          .where(eq(schema.devices.id, deviceId));

        const peers = await peersAllowedFor(userId, deviceId, device.role);
        const onlinePeers = peers
          .map((id) => presenceTracker.get(id))
          .filter((p): p is NonNullable<typeof p> => !!p);

        send({ type: "ready" });

        for (const peer of onlinePeers) {
          send({
            type: "peer-online",
            deviceId: peer.deviceId,
            role: peer.role,
            name: peer.name,
          });
          const onlineMsg: ServerMessage = {
            type: "peer-online",
            deviceId,
            role: device.role,
            name: device.name,
          };
          try {
            peer.socket.send(JSON.stringify(onlineMsg));
          } catch {
            /* ignore */
          }
        }
        return;
      }

      const parsed = clientMessageSchema.safeParse(data);
      if (!parsed.success) {
        sendError("invalid_message", "schema validation failed");
        return;
      }
      const msg = parsed.data;

      if (msg.type === "hello") {
        sendError("already_authenticated", "hello already sent");
        return;
      }

      if (msg.type === "leave") {
        socket.close(1000, "leave");
        return;
      }

      if (msg.type === "recording-state") {
        await db
          .update(schema.devices)
          .set({ isRecording: msg.isRecording, lastSeenAt: new Date() })
          .where(eq(schema.devices.id, authenticated.deviceId));
        return;
      }

      const targetDeviceId = msg.toDeviceId;
      const allowed = await isPairAllowed(userId, authenticated.deviceId, targetDeviceId);
      if (!allowed) {
        sendError("not_paired", "no signaling permission to that device");
        return;
      }
      const target = presenceTracker.get(targetDeviceId);
      if (!target) {
        sendError("peer_offline", "target device is not connected");
        return;
      }

      const fwd: ServerMessage =
        msg.type === "offer"
          ? { type: "offer", fromDeviceId: authenticated.deviceId, sdp: msg.sdp }
          : msg.type === "answer"
            ? { type: "answer", fromDeviceId: authenticated.deviceId, sdp: msg.sdp }
            : { type: "candidate", fromDeviceId: authenticated.deviceId, candidate: msg.candidate };
      try {
        target.socket.send(JSON.stringify(fwd));
      } catch {
        /* ignore */
      }
    });
  });
}

async function peersAllowedFor(
  userId: string,
  deviceId: string,
  role: "camera" | "viewer",
): Promise<string[]> {
  if (role === "camera") {
    const rows = await db
      .select({ viewerId: schema.cameraViewerPairs.viewerId })
      .from(schema.cameraViewerPairs)
      .where(
        and(
          eq(schema.cameraViewerPairs.userId, userId),
          eq(schema.cameraViewerPairs.cameraId, deviceId),
        ),
      );
    return rows.map((r) => r.viewerId);
  }
  const rows = await db
    .select({ cameraId: schema.cameraViewerPairs.cameraId })
    .from(schema.cameraViewerPairs)
    .where(
      and(
        eq(schema.cameraViewerPairs.userId, userId),
        eq(schema.cameraViewerPairs.viewerId, deviceId),
      ),
    );
  return rows.map((r) => r.cameraId);
}

async function isPairAllowed(
  userId: string,
  selfDeviceId: string,
  otherDeviceId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: schema.cameraViewerPairs.id })
    .from(schema.cameraViewerPairs)
    .where(
      and(
        eq(schema.cameraViewerPairs.userId, userId),
        or(
          and(
            eq(schema.cameraViewerPairs.cameraId, selfDeviceId),
            eq(schema.cameraViewerPairs.viewerId, otherDeviceId),
          ),
          and(
            eq(schema.cameraViewerPairs.viewerId, selfDeviceId),
            eq(schema.cameraViewerPairs.cameraId, otherDeviceId),
          ),
        ),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
