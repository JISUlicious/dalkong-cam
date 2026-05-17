# Handoff — next session

## Project in one paragraph

`dalkong-cam` is a self-hosted home-camera app being migrated off Firebase
onto a Fastify + Postgres + MinIO + coturn backend with WebRTC signaling.
Mobile client is Expo SDK 55 + RN 0.83.2 (was a CRA web app on `main`;
that legacy code is still in place and is removed at cutover, not before).

**Branch:** `claude/mobile-migration-security-PkZd7` — NOT merged to `main` yet.
**Repo:** `/Users/jisu/data/workspace/dalkong-cam` (dev Mac).

## State at handoff time

| Layer | State |
|---|---|
| Backend (api, postgres, minio, coturn) | ✅ deployed on **prod Mac** at `https://dalkong.jhong.n-e.kr`, smoke-tested end-to-end (health, signup, login, /api/turn-credentials, WS auth gate, /media proxy). |
| TLS / DNS | ✅ multi-SAN Let's Encrypt cert at `live/jhong.n-e.kr/` covers `jhong.n-e.kr`, `cloud.jhong.n-e.kr`, `n8n.jhong.n-e.kr`, `dalkong.jhong.n-e.kr`. Renewals work via certbot-in-Docker. |
| Mobile dep install | ✅ npm install --legacy-peer-deps green on dev Mac; node_modules has RN 0.83.2, Expo 55.0.23, vision-camera 5.0.9, webrtc 124.0.7, reanimated 4.3.1. |
| Mobile native build | 🟡 **not yet attempted**. User about to run `npx expo prebuild` then `npx expo run:ios` (or `run:android`) from `apps/mobile/`. |
| End-to-end real-device run | ⛔ untested. |
| Cutover (delete legacy Firebase code) | ⛔ deferred per `CUTOVER.md` — only after mobile is verified. |

## Immediate next step

From the dev Mac, in `apps/mobile/`:

```sh
cd /Users/jisu/data/workspace/dalkong-cam/apps/mobile

# Create the env file the mobile app reads at build time
echo "DALKONG_API_BASE_URL=https://dalkong.jhong.n-e.kr" > .env

# Generate ios/ and android/ projects (runs all config plugins).
npx expo prebuild

# Build + install on a connected device.
npx expo run:ios     # or run:android
```

`expo run:ios` is the heavy step (~5–10 min first time). High-risk failure modes,
in order of probability:

1. CocoaPods version mismatch (RN 0.83 wants ≥1.16).
2. `event-target-shim` resolution error during metro startup (known RN+webrtc clash;
   `MIGRATION_STATUS.md` notes a metro resolver fix).
3. vision-camera-mlkit + react-native-webrtc Google ML Kit / Firebase pod version
   conflict. May need a Podfile post-install hook.
4. Hermes engine error at app start when vision-camera frame processor + webrtc
   load together.

If the build succeeds, the auth screen → signup → cam/mic permissions → role
selection (Camera/Viewer) flow is the smoke test.

## What's already in place — don't redo

- `apps/api/`, `apps/mobile/`, `packages/shared/`, `infra/` directories — full code
  for the new self-hosted stack and mobile app.
- `packages/shared` has a proper build step (`tsc → dist/`). `apps/api`'s
  `build` script invokes `npm run build:shared` first. Don't reintroduce
  raw `.ts` in `main`/`exports`.
- All Compose overrides are in `infra/`:
  - `docker-compose.yml` — base (Caddy-fronted, Linux-tuned).
  - `docker-compose.mac.yml` — required when host is a Mac (Docker Desktop). Coturn
    bridge networking + explicit ports + `COTURN_EXTERNAL_IP`.
  - `docker-compose.dev.yml` — local dev override; disables Caddy via
    `profiles: ["never"]`, binds api on host 3001.
  - `docker-compose.nginx.yml` — production with **existing external nginx**
    (user's case). Caddy disabled; api+minio attach to an external `proxy`
    network (`PROXY_NETWORK` env var picks the actual name).
- Prod Mac runs the `.yml + .mac.yml + .nginx.yml` combination. The user's
  separate nginx Compose stack proxies via the shared `proxy` Docker network.

## Critical gotchas (real ones that bit us)

1. **`@dalkong/shared` resolution.** Dockerfile must build `packages/shared`
   before `apps/api` so Node can load it at runtime (`main` points at
   `./dist/index.js`). If you see `Cannot find module 'zod'` during the API
   image build, that's the symptom.
2. **Empty `.env` lines on optional URL/email fields.** Zod's `.optional()`
   doesn't short-circuit `""`. Fixed via an `optional()` helper in
   `apps/api/src/config.ts` that preprocesses empty strings to `undefined`.
   Affects `EMAIL_FROM`, `SMTP_URL`, `MINIO_PUBLIC_BASE_URL`.
3. **nginx in Docker + container DNS.** `proxy_pass http://api:3001` only works
   if nginx and api are on the same Docker network. User's setup uses a shared
   external `proxy` network — see `infra/PROD.md` "Already running nginx?".
4. **Let's Encrypt `live/<name>/` must hold symlinks**, not regular files. The
   user had a half-broken cert from an older backup-restore where files were
   `cp`d instead of preserved as symlinks. Renewal config skipped the cert
   with `expected /etc/letsencrypt/live/<name>/cert.pem to be a symlink`.
5. **Multi-SAN cert.** When re-issuing the apex cert, include EVERY existing
   SAN in the `-d` flags — single `-d jhong.n-e.kr` drops the other subdomains
   and breaks them.
6. **Mobile npm install requires `--legacy-peer-deps`.** RN ecosystem
   over-constrains peer ranges (vision-camera, reanimated, worklets-core all
   declare narrow RN ranges).
7. **`network_mode: host` on coturn doesn't work in Docker Desktop on Mac**
   (host is the Linux VM, not the Mac). That's why `docker-compose.mac.yml`
   exists — bridges coturn, binds explicit ports, sets `--external-ip` to the
   home public IP.

## Production config (currently live)

- DOMAIN: `dalkong.jhong.n-e.kr`
- nginx (in user's separate Docker compose) terminates TLS, proxies via the
  external `proxy` Docker network to `api:3001` / `minio:9000`.
- `EMAIL_VERIFICATION_REQUIRED=false` (option A — no SMTP configured).
- `infra/.env` and `apps/api/.env` exist locally on the prod Mac, gitignored.
  The user generated secrets; values are NOT in this repo.
- `infra/nginx/cam.example.conf` is the template only. The user's actual
  nginx server block lives in their nginx Docker mount, not in this repo
  (intentionally — preserves clean placeholders in the template).

## Open follow-ups (after mobile is green)

1. `npx expo run:android` if user wants the camera role on an Android device.
2. Apply migrations on prod if needed: `docker compose ... exec api node dist/db/migrate.js`
   (already shipped in image).
3. Cutover per `CUTOVER.md` — disable SPA, lock Firebase rules to deny-all,
   soak, then `git rm` the legacy `src/`, `functions/`, Firebase config files.
4. The 152 GitHub Dependabot alerts on `main` are almost entirely in the
   legacy code (root SPA + functions). They disappear after the cutover. The
   `apps/api/` audit is clean of critical/high after the recent upgrades.

## Useful commands cheat sheet

```sh
# Prod-mac status (run on the prod Mac)
docker compose -f infra/docker-compose.yml \
               -f infra/docker-compose.mac.yml \
               -f infra/docker-compose.nginx.yml \
               ps

# Tail api logs
docker compose ... logs -f api

# certbot status (prod Mac, inside user's nginx-certbot container)
docker exec nginx-certbot-1 certbot certificates
docker exec nginx-certbot-1 certbot renew --dry-run

# Mobile dev (dev Mac)
cd apps/mobile && npm install --legacy-peer-deps
npx expo prebuild && npx expo run:ios
```

## How to greet the user

Skip the "I see you're working on X" preamble. They've been working on this
non-stop and want to keep moving. Read this doc + the relevant infra file
referenced, then ask one specific question or take one specific action.
