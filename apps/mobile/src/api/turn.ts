import { api } from "./client";

export interface TurnCredentials {
  username: string;
  credential: string;
  ttl: number;
  expiresAt: string;
  iceServers: RTCIceServer[];
}

export const turnApi = {
  get: () => api<TurnCredentials>(`/api/turn-credentials`),
};

let cached: { data: TurnCredentials; refreshAt: number } | null = null;

export async function getCachedTurnCredentials(): Promise<TurnCredentials> {
  const now = Date.now();
  if (cached && cached.refreshAt > now) return cached.data;
  const data = await turnApi.get();
  const refreshAt =
    new Date(data.expiresAt).getTime() - 5 * 60 * 1000;
  cached = { data, refreshAt };
  return data;
}

export function clearTurnCache(): void {
  cached = null;
}
