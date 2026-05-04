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

## Known follow-ups

1. **Native motion-detection frame processor.** The current
   `useMotionDetection` hook owns the recording-window state machine but is
   triggered manually (debug button) or by a future Vision Camera frame
   processor. Two options:
   - Pure-JS worklet at 2–5 fps using `frame.toArrayBuffer()` (fastest to ship,
     ~10 % CPU on midrange Android). Mirrors the legacy web algorithm:
     downsample to 64×48, count pixels with RGB-delta ≥ 3, fire on > 50.
   - Native Vision Camera frame processor plugin (Swift `CMSampleBuffer` +
     Kotlin `ImageProxy`) for ~1 % CPU. Highest quality, more setup.

2. **APNs direct sender.** FCM with the `apns:` config field handles iOS as
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
