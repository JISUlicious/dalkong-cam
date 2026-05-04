import { Platform } from "react-native";

import notifee, { AndroidImportance } from "@notifee/react-native";

const CHANNEL_ID = "dalkong-camera-fg";

let started = false;

export async function startCameraForegroundService(opts?: {
  deviceName?: string;
}): Promise<void> {
  if (Platform.OS !== "android" || started) return;

  await notifee.createChannel({
    id: CHANNEL_ID,
    name: "Camera (background recording)",
    importance: AndroidImportance.LOW,
  });

  notifee.registerForegroundService(() => new Promise(() => undefined));

  await notifee.displayNotification({
    title: "Dalkong Cam is recording",
    body: opts?.deviceName ? `Camera: ${opts.deviceName}` : "Streaming live and recording on motion.",
    android: {
      channelId: CHANNEL_ID,
      asForegroundService: true,
      foregroundServiceTypes: ["camera", "microphone"],
      ongoing: true,
      pressAction: { id: "default" },
      smallIcon: "ic_notification",
    },
  });

  started = true;
}

export async function stopCameraForegroundService(): Promise<void> {
  if (Platform.OS !== "android" || !started) return;
  await notifee.stopForegroundService();
  started = false;
}
