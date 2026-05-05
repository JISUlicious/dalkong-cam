# Self-hosted Infrastructure

Five services on a single VPS, fronted by Caddy on the subdomain you configure
in `infra/.env`. The whole stack is reachable through one hostname (e.g.
`cam.example.com`) — coturn shares the host but uses different ports
(3478 / 5349), so no separate `turn.` subdomain is required.

| Service | Image | Public path | Notes |
|---|---|---|---|
| `api` | built from `apps/api/Dockerfile` | `/auth/*`, `/api/*`, `/devices*`, `/videos*`, `/signaling`, `/health` | Fastify + Drizzle + Postgres + MinIO clients |
| `postgres` | `postgres:16-alpine` | internal only | data volume `pg_data` |
| `minio` | `minio/minio:latest` | proxied via `/media/*` | object store for recorded MP4s |
| `coturn` | `coturn/coturn:4.6` | host network on UDP 3478 / TLS 5349 | uses `use-auth-secret`, configured via Compose CLI flags |
| `caddy` | `caddy:2-alpine` | 80/443 | auto-TLS via Let's Encrypt |

## Configuration

Two env files drive the whole stack. Both are gitignored.

- **`infra/.env`** — Compose-layer config (DOMAIN, ADMIN_EMAIL, EXTERNAL_IP, POSTGRES_PASSWORD, MinIO and TURN secrets). Read automatically by `docker compose` for `${VAR}` interpolation in `docker-compose.yml`.
- **`apps/api/.env`** — Fastify-app config (JWT secrets, SMTP, full DATABASE_URL, etc.).

A handful of values appear in both files (`POSTGRES_PASSWORD`, `MINIO_*`, `TURN_SHARED_SECRET`) because they're needed at the infra layer (Compose, coturn CLI) AND inside the API. Both `.env.example` files mark them with `[SYNCED]` — they MUST match exactly.

## First-boot checklist

1. **Pick a subdomain** for this backend — e.g. `cam.example.com`. Add a single A/AAAA record pointing it at the VPS public IP.

2. **Generate secrets** (5 random base64 strings):

   ```sh
   openssl rand -base64 32   # JWT_ACCESS_SECRET
   openssl rand -base64 32   # JWT_REFRESH_SECRET
   openssl rand -base64 32   # EMAIL_VERIFICATION_SECRET
   openssl rand -base64 32   # TURN_SHARED_SECRET     (used in both files)
   openssl rand -base64 32   # MINIO_SECRET_KEY       (used in both files)
   ```

3. **Fill in env files**:

   ```sh
   cp infra/.env.example infra/.env
   cp apps/api/.env.example apps/api/.env
   $EDITOR infra/.env apps/api/.env
   # Make sure POSTGRES_PASSWORD, MINIO_ACCESS_KEY, MINIO_SECRET_KEY,
   # and TURN_SHARED_SECRET are identical across both files.
   ```

4. **Build and start**:

   ```sh
   cd infra
   docker compose up -d --build
   ```

5. **Run migrations once** (from your workstation, with a tunneled DATABASE_URL or against the VPS):

   ```sh
   cd apps/api
   npm install
   DATABASE_URL=postgres://dalkong:<password>@<vps-ip>:5432/dalkong npm run db:migrate
   ```

   (Postgres is not exposed publicly by default — open 5432 to your IP only via SSH tunnel or a temporary firewall rule for the migration step.)

## Email options

Email verification is enabled by default (`EMAIL_VERIFICATION_REQUIRED=true`
in `apps/api/.env`). You have three paths:

1. **Skip it** — set `EMAIL_VERIFICATION_REQUIRED=false`, leave `SMTP_URL` and
   `EMAIL_FROM` blank. Signup auto-verifies new users. Fine for self-only
   deployments and initial standup.
2. **Test locally with Mailpit** — keep verification on, set
   `SMTP_URL=smtp://mailpit:1025` and `EMAIL_FROM=no-reply@<DOMAIN>`, then run
   `docker compose --profile dev up -d`. Open `http://localhost:8025` in a
   browser to read the verification emails and click the link.
3. **Use a real SMTP provider** — Resend, Postmark, Mailgun, Brevo, Amazon SES,
   Gmail with an app-password, etc. Most have free tiers sufficient for a
   home cam deployment. Format: `smtp://USER:PASS@host:587`.

## Verification

```sh
curl https://cam.example.com/health
# -> {"ok":true,"ts":"..."}

# Anonymous WS connect should be rejected.
wscat -c wss://cam.example.com/signaling
# -> closed: 4401 unauthorized

# Authenticated WS connect (after signup + login + email verify):
wscat -c wss://cam.example.com/signaling -H "authorization: Bearer $ACCESS_TOKEN"

# TURN creds:
curl -H "authorization: Bearer $ACCESS_TOKEN" https://cam.example.com/api/turn-credentials
```

## Threat model notes

- Postgres and MinIO are not exposed publicly — only Caddy (80/443) and coturn (3478/5349) bind public ports.
- Signaling WS is JWT-gated and the device must `hello` with its per-device secret within 5s; only paired (camera, viewer) tuples may relay through each other.
- TURN credentials are HMAC-derived, valid for `TURN_TTL_SECONDS` (default 24h), and cannot be brute-forced offline because the shared secret never leaves the server.
- All client uploads use short-lived (5 min) presigned URLs scoped to `users/{uid}/cameras/{deviceId}/{videoId}.mp4`.

## Changing the domain

Edit `DOMAIN` in `infra/.env` and the matching `PUBLIC_BASE_URL`, `TURN_URLS`, `STUN_URLS`, `TURN_REALM`, and `MINIO_PUBLIC_BASE_URL` (if set) in `apps/api/.env`, then `docker compose up -d` to recreate Caddy and coturn with the new value. Caddy will re-issue a Let's Encrypt cert for the new hostname automatically.
