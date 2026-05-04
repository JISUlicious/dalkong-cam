# Migration Status

Tracking the eight phases from the plan in `/root/.claude/plans/this-repo-has-a-mighty-hinton.md`.

| Phase | Description | Status |
|---|---|---|
| 1 | Self-hosted backend (Fastify + Drizzle + Postgres) | ✅ Done — typechecks clean, migration generated, 10 unit tests pass |
| 2 | Expo SDK 55 mobile app skeleton (router, plugins, NativeWind, API/WS clients, AuthContext) | ✅ Done — needs `npm install` in `apps/mobile` to typecheck (heavy native deps) |
| 3 | WebRTC core ported from web (`rtcConnection.ts`, `ConnectionContext.tsx`) over self-hosted WS | ✅ Done |
| 4 | Camera role with Vision Camera + recording + signed-URL upload | ✅ Done — JS-side motion state machine in place; native frame-processor plugin (Swift+Kotlin) is a follow-up |
| 5 | Viewer role: multi-camera grid, audio talkback, history playback | ✅ Done |
| 6 | Push notifications: expo-notifications client + FCM HTTP v1 backend sender | ✅ Done — APNs via FCM; native APNs (apns2) is a follow-up |
| 7 | Security hardening + tests + threat model | ✅ Done — see [SECURITY.md](SECURITY.md), 10 unit tests pass; live cross-tenant script in SECURITY.md |
| 8 | Cutover: retire Firebase, remove legacy code | 🟡 Documented in [CUTOVER.md](CUTOVER.md) — not executed (preserves rollback) |

## On-device motion detection (landed)

`src/camera/motionFrameProcessor.ts` runs on the Vision Camera worklet
runtime at 4 fps. Two strategies, picked at runtime:

1. **ML Kit object detector** (preferred) via
   [`react-native-vision-camera-mlkit`](https://github.com/pedrol2b/react-native-vision-camera-mlkit).
   Tracks objects across frames; fires when a tracked bounding box centre
   moves more than ~12 px between samples. Lowest false-positive rate.
2. **Pixel-delta worklet** (fallback) — mirrors the legacy web algorithm:
   downsample to 64×48, count pixels with RGB-delta ≥ 3, fire on > 50.
   Used when ML Kit isn't available (e.g. an Android build without GMS).

Result is wired into `useMotionDetection.reportMotion()` via
`Worklets.createRunOnJS(...)`, which keeps the camera thread isolated from
React state.

## Background recording on Android (landed)

`src/camera/foregroundService.ts` uses `@notifee/react-native` to start a
foreground service with `foregroundServiceTypes: ["camera", "microphone"]`,
plus an ongoing low-priority notification, when the camera screen mounts.
Required permissions (`FOREGROUND_SERVICE_CAMERA`,
`FOREGROUND_SERVICE_MICROPHONE`) are already declared in `app.config.ts`.

iOS keeps the WS + audio talkback alive in background through the
`UIBackgroundModes: ["audio","voip"]` declaration; continuous **video**
capture in background still requires CallKit / VoIP UX, which is a
deliberate tradeoff to defer.

## Known follow-ups

1. **APNs direct sender.** FCM with the `apns:` config field handles iOS as
   long as your Apple developer credentials are configured in the Firebase
   console. If you want to skip Firebase entirely on iOS, swap the `sendFcmV1`
   call for an `apns2` HTTP/2 sender using a `.p8` key (ES256 JWT).

3. **Background recording on iOS.** `UIBackgroundModes: ["audio","voip"]` is
   set so audio + signaling stay alive in background, but iOS will not allow
   continuous video capture without surfacing a CallKit / VoIP UI. Verify
   the user-experience tradeoff during the in-device pass.

4. **Pairing UX.** The API supports `POST /devices/pair` but the mobile UI
   does not yet expose a "scan QR / enter pair code" flow. Add a paired-
   devices screen that calls `devicesApi.pair`.

5. **Email transport.** `SMTP_URL` is required at boot; nothing is sent if
   SMTP is misconfigured (signup will succeed but the user won't get a
   verification link). Consider adding a Postmark / SES adapter.

## Verification commands

```sh
# Backend typecheck
cd apps/api && npm install && npx tsc --noEmit

# Backend unit tests
cd apps/api && npm test

# Generate / inspect SQL migration
cd apps/api && npx drizzle-kit generate

# Mobile typecheck (heavy)
cd apps/mobile && npm install && npx expo prebuild && npx tsc --noEmit
```
