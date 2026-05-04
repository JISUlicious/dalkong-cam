import { Client } from "minio";

import { config } from "../config.js";

export const minioClient = new Client({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: config.MINIO_USE_SSL,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});

let bucketEnsured = false;
export async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  const exists = await minioClient.bucketExists(config.MINIO_BUCKET).catch(() => false);
  if (!exists) {
    await minioClient.makeBucket(config.MINIO_BUCKET);
  }
  bucketEnsured = true;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  expiresAt: Date;
}

const UPLOAD_TTL_SECONDS = 5 * 60;
const DOWNLOAD_TTL_SECONDS = 10 * 60;

export async function presignedUpload(opts: {
  key: string;
  contentType: string;
  contentLength: number;
}): Promise<PresignedUploadResult> {
  await ensureBucket();
  const url = await minioClient.presignedPutObject(
    config.MINIO_BUCKET,
    opts.key,
    UPLOAD_TTL_SECONDS,
  );
  return {
    uploadUrl: url,
    uploadHeaders: {
      "Content-Type": opts.contentType,
      "Content-Length": String(opts.contentLength),
    },
    expiresAt: new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000),
  };
}

export async function presignedDownload(key: string): Promise<string> {
  return minioClient.presignedGetObject(
    config.MINIO_BUCKET,
    key,
    DOWNLOAD_TTL_SECONDS,
  );
}

export async function statObject(key: string) {
  return minioClient.statObject(config.MINIO_BUCKET, key);
}

export async function removeObject(key: string): Promise<void> {
  await minioClient.removeObject(config.MINIO_BUCKET, key);
}

export function buildVideoKey(opts: {
  userId: string;
  deviceId: string;
  videoId: string;
}): string {
  return `users/${opts.userId}/cameras/${opts.deviceId}/${opts.videoId}.mp4`;
}
