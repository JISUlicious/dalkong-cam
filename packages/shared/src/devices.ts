import { z } from "zod";

export const deviceRoleSchema = z.enum(["camera", "viewer"]);
export type DeviceRole = z.infer<typeof deviceRoleSchema>;

export const registerDeviceRequestSchema = z.object({
  role: deviceRoleSchema,
  name: z.string().min(1).max(120),
});
export type RegisterDeviceRequest = z.infer<typeof registerDeviceRequestSchema>;

export const registerDeviceResponseSchema = z.object({
  id: z.string().uuid(),
  role: deviceRoleSchema,
  name: z.string(),
  deviceSecret: z.string(),
});
export type RegisterDeviceResponse = z.infer<
  typeof registerDeviceResponseSchema
>;

export const updateFcmTokenRequestSchema = z.object({
  fcmToken: z.string().min(1).max(512),
});

export interface DeviceSummary {
  id: string;
  role: DeviceRole;
  name: string;
  isOnline: boolean;
  isRecording: boolean;
  lastSeenAt: string;
}

export const pairRequestSchema = z.object({
  cameraId: z.string().uuid(),
  viewerId: z.string().uuid(),
});
export type PairRequest = z.infer<typeof pairRequestSchema>;
