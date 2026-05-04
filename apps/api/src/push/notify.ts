import { and, eq, ne } from "drizzle-orm";

import { db, schema } from "../db/index.js";
import { config } from "../config.js";

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
    if (target.fcmToken && config.FCM_SERVICE_ACCOUNT_JSON) {
      await sendFcm(target.fcmToken, payload).catch(() => {});
    }
    if (target.apnsToken && config.APNS_KEY_ID) {
      await sendApns(target.apnsToken, payload).catch(() => {});
    }
  }
}

// Phase 6 will replace these stubs with real FCM HTTP v1 + APNs HTTP/2 senders.
async function sendFcm(_token: string, _payload: MotionPushPayload): Promise<void> {
  return;
}

async function sendApns(_token: string, _payload: MotionPushPayload): Promise<void> {
  return;
}
