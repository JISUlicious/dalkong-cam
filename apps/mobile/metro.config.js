// Workaround for the known event-target-shim conflict between Expo SDK >50
// and react-native-webrtc. Forces both to use the v6 implementation.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  "event-target-shim": path.resolve(
    __dirname,
    "node_modules/event-target-shim",
  ),
};

config.resolver.unstable_enablePackageExports = true;

module.exports = config;
