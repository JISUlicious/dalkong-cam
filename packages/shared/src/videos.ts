import { z } from "zod";

export const requestUploadUrlSchema = z.object({
  deviceId: z.string().uuid(),
  recordedAt: z.string().datetime(),
  durationMs: z.number().int().nonnegative().max(10 * 60 * 1000).optional(),
  sizeBytes: z.number().int().positive().max(500 * 1024 * 1024),
  contentType: z.literal("video/mp4"),
});
export type RequestUploadUrlRequest = z.infer<typeof requestUploadUrlSchema>;

export interface RequestUploadUrlResponse {
  videoId: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  expiresAt: string;
}

export interface SavedVideoSummary {
  id: string;
  deviceId: string;
  deviceName: string;
  recordedAt: string;
  sizeBytes: number;
  durationMs: number | null;
  downloadUrl: string;
}
