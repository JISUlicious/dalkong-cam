import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Dalkong Cam",
  slug: "dalkong-cam",
  scheme: "dalkongcam",
  version: "0.1.0",
  orientation: "default",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: "domain.your.dalkongcam",
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        "Dalkong Cam needs camera access to broadcast or monitor your home camera.",
      NSMicrophoneUsageDescription:
        "Dalkong Cam needs microphone access for two-way audio talkback.",
      NSPhotoLibraryAddUsageDescription:
        "Dalkong Cam saves motion-triggered recordings.",
      UIBackgroundModes: ["audio", "voip"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "domain.your.dalkongcam",
    permissions: [
      "CAMERA",
      "RECORD_AUDIO",
      "INTERNET",
      "WAKE_LOCK",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_CAMERA",
      "FOREGROUND_SERVICE_MICROPHONE",
      "POST_NOTIFICATIONS",
    ],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "react-native-vision-camera",
      {
        cameraPermissionText:
          "Dalkong Cam needs camera access to broadcast your home camera.",
        enableMicrophonePermission: true,
        microphonePermissionText:
          "Dalkong Cam needs microphone access for two-way audio talkback.",
        enableCodeScanner: false,
      },
    ],
    [
      "react-native-vision-camera-mlkit",
      { mlkit: { objectDetection: true } },
    ],
    "@config-plugins/react-native-webrtc",
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 26,
          compileSdkVersion: 35,
          targetSdkVersion: 35,
        },
        ios: {
          deploymentTarget: "15.1",
        },
      },
    ],
  ],
  extra: {
    apiBaseUrl:
      process.env.DALKONG_API_BASE_URL ?? "https://your.domain",
  },
};

export default config;
