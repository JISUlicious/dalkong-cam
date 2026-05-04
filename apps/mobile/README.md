# Dalkong Cam Mobile

React Native (Expo SDK 55, New Architecture) home-camera client. Talks to the
self-hosted backend in `apps/api`. Two roles: **camera** and **viewer**, paired
per-user.

## Quickstart

```
cd apps/mobile
cp .env.example .env       # set DALKONG_API_BASE_URL=https://your.domain
npm install
npx expo prebuild           # generates ios/ and android/ — needed once
npx expo run:ios            # or run:android
```

## Notes

- Uses `react-native-webrtc` via `@config-plugins/react-native-webrtc`. Won't
  run inside Expo Go — must use a Dev Client (`expo-dev-client`).
- `metro.config.js` aliases `event-target-shim` to v6 to satisfy
  react-native-webrtc on Expo SDK >50.
- Vision Camera does the recording natively (MP4) and runs frame processors
  on a separate camera thread for motion detection — no `MediaRecorder`,
  no Canvas, no ffmpeg.wasm.
- TURN credentials are fetched at runtime from the API and rotated.
- Tokens: refresh tokens live in `expo-secure-store`; access tokens in
  in-memory state only.

## Layout

```
app/                # expo-router file-based routes
src/
  api/              # REST + WS clients for self-hosted backend
  auth/             # AuthContext, SignIn/SignUp logic
  camera/           # Camera role (Vision Camera, motion processor)
  viewer/           # Viewer role (multi-camera grid, talkback)
  history/          # Saved video playback
  state/            # Reducers + middlewares (ported from web app)
  webrtc/           # RTCPeerConnection wrapper, signaling client
  ui/               # Shared NativeWind components
  lib/              # Helpers
```
