import { and, eq, ne } from "drizzle-orm";

import { db, schema } from "../db/index.js";
import { sendFcmV1 } from "./fcm.js";

interface MotionPushPayload {
  userId: string;
  videoId: string;
  deviceId: string;
  deviceName: string;
}

export async function sendMotionPush(payload: MotionPushPayload): Promise<void> {
  const targets = await db
    .select({
      id: schema.devices.id,
      fcmToken: schema.devices.fcmToken,
      apnsToken: schema.devices.apnsToken,
    })
    .from(schema.devices)
    .where(
      and(
        eq(schema.devices.userId, payload.userId),
        eq(schema.devices.role, "viewer"),
        ne(schema.devices.id, payload.deviceId),
      ),
    );

  for (const target of targets) {
    if (target.fcmToken) {
      await sendFcmV1({
        token: target.fcmToken,
        title: "Motion detected",
        body: `${payload.deviceName} detected motion.`,
        data: {
          type: "motion",
          videoId: payload.videoId,
          deviceId: payload.deviceId,
        },
      }).catch(() => false);
    }
    // APNs is sent via FCM (apns config above) when token is FCM-registered.
    // Native APNs (apns2 over HTTP/2 with .p8 key) lands in a follow-up if
    // direct APNs is required.
  }
}
