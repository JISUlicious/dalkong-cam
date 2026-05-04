# Security Notes

The legacy web app at this repo's root (Firebase + WebRTC, ~2023) shipped with
several serious gaps. This document tracks the threat model for the current
migration to a self-hosted, cross-platform mobile app and what has been
mitigated where.

## Migration mitigations (Phase 1–7)

| # | Original issue | Status | Fix location |
|---|---|---|---|
| 1 | `firestore.rules`: `allow read, write: if true` lets any authenticated user read/write any user's documents | **Fixed (transitional)** | [firestore.rules](firestore.rules) restricts to `request.auth.uid == userId && request.auth.token.email_verified == true` until full cutover. After cutover Firestore is decommissioned. |
| 2 | Cloud Storage had no `storage.rules` (default is open) | **Fixed (transitional)** | [storage.rules](storage.rules) scopes `savedVideos/{uid}/**` to the owner. Replaced post-cutover by MinIO + presigned PUT URLs scoped to `users/{uid}/cameras/{deviceId}/{videoId}.mp4` |
| 3 | TURN credentials shipped in client bundle via `REACT_APP_TURN_SERVER` | **Fixed** | Self-hosted coturn with `use-auth-secret`. Clients call `GET /api/turn-credentials` ([apps/api/src/routes/turn.ts](apps/api/src/routes/turn.ts)) for HMAC-derived ephemeral creds (24h default TTL). |
| 4 | No email verification | **Fixed** | `POST /auth/signup` issues an unverified user; `requireVerifiedAuth` middleware blocks every device/video/turn endpoint until `email_verified === true`. ([apps/api/src/auth/middleware.ts](apps/api/src/auth/middleware.ts)) |
| 5 | No password strength rules | **Fixed** | argon2id hashing + zxcvbn ≥ 3 + 12-char minimum, server-enforced. ([apps/api/src/auth/passwords.ts](apps/api/src/auth/passwords.ts)) |
| 6 | WebRTC signaling unauthenticated; anyone with project ID could write SDP/ICE | **Fixed** | WS at `/signaling` requires JWT, then a per-device secret hello within 5s. Server enforces that the writer and the target device belong to the same user **and** are explicitly paired in `camera_viewer_pairs`. ([apps/api/src/ws/signaling.ts](apps/api/src/ws/signaling.ts)) |
| 7 | No device pairing secret | **Fixed** | `POST /devices` issues a per-device secret (argon2id-hashed at rest); the secret lives in `expo-secure-store` on the mobile device and is required to authenticate the signaling channel. |
| 8 | Logger middleware leaked SDP/ICE to console | **Fixed** | Pino logger at `info` in production, no SDP printed; pretty logs only in development. The legacy `logger` middleware was not ported. |
| 9 | Stale dependencies (firebase 9.x, react-scripts 5, ffmpeg.wasm 0.11) | **Fixed (post-cutover)** | New stack: Node 22, Fastify 4, Drizzle 0.32, Postgres 16, Expo 55, React Native 0.78. Firebase deps removed at Phase 8. |
| 10 | No input validation | **Fixed** | All HTTP request bodies parsed via zod (`@dalkong/shared` schemas) at the boundary; rejected with 400 on parse failure. WS messages parsed via `clientMessageSchema` discriminated union. |
| 11 | TLS / transport hygiene | **Fixed** | Caddy auto-TLS on `your.domain` with HSTS preload + `X-Content-Type-Options: nosniff` + `X-Frame-Options: DENY`. ([infra/caddy/Caddyfile](infra/caddy/Caddyfile)) |
| 12 | No rate limiting on auth | **Fixed** | `@fastify/rate-limit` on `/auth/signup` (5/15min), `/auth/login` (10/15min), `/auth/refresh` (60/15min), `/api/turn-credentials` (20/5min); brute-force lockout after 8 failed logins (15-min cooldown). |

## Defense-in-depth choices

- **Postgres and MinIO are not exposed publicly.** Only Caddy and coturn bind public ports; everything else stays on the Compose network.
- **Refresh-token rotation:** every `/auth/refresh` revokes the consumed token and issues a new one. Detection of replay (already-revoked token) revokes all of that user's refresh tokens.
- **Account lockout:** 8 failed logins lock the account for 15 minutes (`failed_login_count`, `locked_until`).
- **Constant-time login response:** when the email doesn't exist we still run an argon2id hash to keep timing flat.
- **Presigned upload URLs are 5-minute, content-length-bound, content-type-bound,** and the server verifies the actual object size on `POST /videos/:id/complete` (rejects on > 1KiB mismatch).
- **Presigned download URLs are 10-minute** and only issued after ownership check.
- **Signaling messages are size-capped** at 32 KiB; oversized payloads close the socket.
- **Hello timeout:** the WS closes if no `hello` arrives within 5 seconds.
- **Push tokens are scoped per device** (`devices.fcm_token`); a viewer device only sees motion alerts for its own user's cameras.

## Verification

### Run unit tests (no external services)

```sh
cd apps/api
npm install
npm test
```

### Live cross-tenant access checks

After deploying staging:

```sh
# 1. Sign up two users.
curl -X POST https://staging.your.domain/auth/signup \
  -H content-type:application/json \
  -d '{"email":"a@test","password":"violet-hexagon-driftwood-quartz"}'
curl -X POST https://staging.your.domain/auth/signup \
  -H content-type:application/json \
  -d '{"email":"b@test","password":"orchid-falcon-tundra-meridian"}'

# 2. (Out of band) verify both emails.

# 3. Log in as both, capture access tokens.
TOKEN_A=$(curl -s -X POST .../auth/login -d '{"email":"a@test","password":"..."}' | jq -r .accessToken)
TOKEN_B=$(curl -s -X POST .../auth/login -d '{"email":"b@test","password":"..."}' | jq -r .accessToken)

# 4. As A, register a camera. Capture A_CAM_ID and A_CAM_SECRET.
A_CAM=$(curl -s -X POST .../devices -H "authorization: Bearer $TOKEN_A" \
  -d '{"role":"camera","name":"A-cam"}')

# 5. As B, try to read A's device. MUST return 404 (B sees its own list only).
curl -H "authorization: Bearer $TOKEN_B" .../devices

# 6. As B, try to delete A's camera. MUST return 404.
curl -X DELETE -H "authorization: Bearer $TOKEN_B" \
  ".../devices/$(echo $A_CAM | jq -r .id)"

# 7. As B over WS, try to hello with A's camera id and a guessed secret.
#    MUST close with 4404 device_not_found (since we scope by user_id first).

# 8. As B, try to request a /videos/upload-url for A's deviceId.
#    MUST return 404 camera_not_found.
```

### Notes for the operator

- TURN credentials returned by `/api/turn-credentials` are valid for 24h by default; rotate `TURN_SHARED_SECRET` to invalidate all outstanding creds.
- Refresh tokens are stored hashed (sha256). The original token only ever leaves the client during the refresh request; the server re-derives the hash to look it up.
- If a device leaks its secret, deleting the device row (`DELETE /devices/:id`) immediately ends signaling for that device.
