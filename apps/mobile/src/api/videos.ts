import type {
  RequestUploadUrlRequest,
  RequestUploadUrlResponse,
  SavedVideoSummary,
} from "@dalkong/shared";

import { api } from "./client";

export const videosApi = {
  list: (params?: { deviceId?: string; before?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.deviceId) qs.set("deviceId", params.deviceId);
    if (params?.before) qs.set("before", params.before);
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString();
    return api<{ videos: SavedVideoSummary[] }>(
      `/videos${suffix ? `?${suffix}` : ""}`,
    );
  },
  requestUploadUrl: (req: RequestUploadUrlRequest) =>
    api<RequestUploadUrlResponse>(`/videos/upload-url`, {
      method: "POST",
      body: req,
    }),
  complete: (videoId: string) =>
    api<{ ok: true }>(`/videos/${videoId}/complete`, { method: "POST" }),
  downloadUrl: (videoId: string) =>
    api<{ downloadUrl: string }>(`/videos/${videoId}/download-url`),
  remove: (videoId: string) =>
    api<{ ok: true }>(`/videos/${videoId}`, { method: "DELETE" }),
};
