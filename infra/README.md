# Self-hosted Infrastructure

Five services on a single VPS, fronted by Caddy on `your.domain`:

| Service | Image | Public path | Notes |
|---|---|---|---|
| `api` | built from `apps/api/Dockerfile` | `/auth/*`, `/api/*`, `/devices*`, `/videos*`, `/signaling`, `/health` | Fastify + Drizzle + Postgres + MinIO clients |
| `postgres` | `postgres:16-alpine` | internal only | data volume `pg_data` |
| `minio` | `minio/minio:latest` | proxied via `/media/*` | object store for recorded MP4s |
| `coturn` | `coturn/coturn:4.6` | host network on UDP 3478 / TLS 5349 | uses `use-auth-secret` |
| `caddy` | `caddy:2-alpine` | 80/443 | auto-TLS via Let's Encrypt |

## First-boot checklist

1. Point an A/AAAA record for `your.domain` (and `turn.your.domain`) at the VPS.
2. Generate secrets:
   ```
   openssl rand -base64 32   # JWT_ACCESS_SECRET
   openssl rand -base64 32   # JWT_REFRESH_SECRET
   openssl rand -base64 32   # EMAIL_VERIFICATION_SECRET
   openssl rand -base64 32   # TURN_SHARED_SECRET
   openssl rand -base64 32   # MINIO_SECRET_KEY
   ```
3. Copy `apps/api/.env.example` to `apps/api/.env` and fill in the values above plus your SMTP URL.
4. Replace `your.domain` everywhere in `caddy/Caddyfile`, `coturn/turnserver.conf`, and `apps/api/.env`.
5. Inject the same `TURN_SHARED_SECRET` into `coturn/turnserver.conf` (`static-auth-secret=...`).
6. Build and start:
   ```
   cd infra
   docker compose up -d --build
   ```
7. Run migrations once after first boot:
   ```
   docker compose exec api node --experimental-strip-types src/db/migrate.ts
   # (or build-time: from a workstation with DATABASE_URL pointed at the VPS)
   npm --prefix apps/api run db:generate
   npm --prefix apps/api run db:migrate
   ```

## Verification

```
curl https://your.domain/health
# -> {"ok":true,"ts":"..."}

# Anonymous WS connect should be rejected.
wscat -c wss://your.domain/signaling
# -> closed: 4401 unauthorized

# Authenticated WS connect (after signup + login + email verify):
wscat -c wss://your.domain/signaling -H "authorization: Bearer $ACCESS_TOKEN"

# TURN creds:
curl -H "authorization: Bearer $ACCESS_TOKEN" https://your.domain/api/turn-credentials
```

## Threat model notes

- Postgres and MinIO are not exposed publicly — only Caddy and coturn bind public ports.
- Signaling WS is JWT-gated and the device must `hello` with its per-device secret within 5s; only paired (camera, viewer) tuples may relay through each other.
- TURN credentials are HMAC-derived, valid for `TURN_TTL_SECONDS` (default 24h), and cannot be brute-forced offline because the shared secret never leaves the server.
- All client uploads use short-lived (5 min) presigned URLs scoped to `users/{uid}/cameras/{deviceId}/{videoId}.mp4`.
