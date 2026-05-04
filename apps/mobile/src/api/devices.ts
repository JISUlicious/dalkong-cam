import type {
  DeviceSummary,
  PairRequest,
  RegisterDeviceRequest,
  RegisterDeviceResponse,
} from "@dalkong/shared";

import { api } from "./client";

export const devicesApi = {
  list: () => api<{ devices: DeviceSummary[] }>(`/devices`),
  register: (req: RegisterDeviceRequest) =>
    api<RegisterDeviceResponse>(`/devices`, {
      method: "POST",
      body: req,
    }),
  remove: (id: string) =>
    api<{ ok: true }>(`/devices/${id}`, { method: "DELETE" }),
  setPushToken: (id: string, fcmToken: string) =>
    api<{ ok: true }>(`/devices/${id}/push-token`, {
      method: "POST",
      body: { fcmToken },
    }),
  pair: (req: PairRequest) =>
    api<{ ok: true }>(`/devices/pair`, { method: "POST", body: req }),
};
