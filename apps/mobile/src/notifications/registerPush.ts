import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { devicesApi } from "@/api/devices";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushTokenForDevice(
  deviceId: string,
): Promise<string | null> {
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("motion", {
      name: "Motion alerts",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const tokenResp = await Notifications.getDevicePushTokenAsync();
  const tokenStr = typeof tokenResp.data === "string" ? tokenResp.data : null;
  if (!tokenStr) return null;
  await devicesApi.setPushToken(deviceId, tokenStr).catch(() => {});
  return tokenStr;
}
