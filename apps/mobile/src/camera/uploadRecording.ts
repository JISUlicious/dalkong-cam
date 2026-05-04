import { videosApi } from "@/api/videos";

export interface RecordedClip {
  uri: string;
  sizeBytes: number;
  durationMs: number | null;
  recordedAt: Date;
  deviceId: string;
}

export async function uploadRecording(clip: RecordedClip): Promise<string> {
  const presigned = await videosApi.requestUploadUrl({
    deviceId: clip.deviceId,
    recordedAt: clip.recordedAt.toISOString(),
    durationMs: clip.durationMs ?? undefined,
    sizeBytes: clip.sizeBytes,
    contentType: "video/mp4",
  });

  const fileBlob = await fetch(clip.uri).then((r) => r.blob());
  const putResp = await fetch(presigned.uploadUrl, {
    method: "PUT",
    body: fileBlob,
    headers: presigned.uploadHeaders,
  });
  if (!putResp.ok) {
    throw new Error(`upload failed: ${putResp.status}`);
  }
  await videosApi.complete(presigned.videoId);
  return presigned.videoId;
}
