import Constants from "expo-constants";

const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;

export const apiBaseUrl =
  fromExtra && fromExtra.length > 0 ? fromExtra : "https://your.domain";

export const wsBaseUrl = apiBaseUrl
  .replace(/^http:/, "ws:")
  .replace(/^https:/, "wss:");
