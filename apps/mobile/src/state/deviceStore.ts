import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { devicesApi } from "@/api/devices";

const ID_KEY_BY_ROLE = (role: "camera" | "viewer") => `dalkong.device.${role}.id`;
const SECRET_KEY = (id: string) => `dalkong.device.secret.${id}`;

export interface LocalDevice {
  id: string;
  secret: string;
  role: "camera" | "viewer";
  name: string;
}

export async function ensureLocalDevice(opts: {
  role: "camera" | "viewer";
  name: string;
}): Promise<LocalDevice> {
  const cachedId = await AsyncStorage.getItem(ID_KEY_BY_ROLE(opts.role));
  if (cachedId) {
    const secret = await SecureStore.getItemAsync(SECRET_KEY(cachedId));
    if (secret) {
      return { id: cachedId, secret, role: opts.role, name: opts.name };
    }
  }
  const created = await devicesApi.register({ role: opts.role, name: opts.name });
  await SecureStore.setItemAsync(SECRET_KEY(created.id), created.deviceSecret);
  await AsyncStorage.setItem(ID_KEY_BY_ROLE(opts.role), created.id);
  return {
    id: created.id,
    secret: created.deviceSecret,
    role: opts.role,
    name: created.name,
  };
}

export async function forgetLocalDevice(role: "camera" | "viewer"): Promise<void> {
  const id = await AsyncStorage.getItem(ID_KEY_BY_ROLE(role));
  if (id) {
    await SecureStore.deleteItemAsync(SECRET_KEY(id)).catch(() => {});
  }
  await AsyncStorage.removeItem(ID_KEY_BY_ROLE(role));
}

export function newSessionId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}
