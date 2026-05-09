# Local development on this Mac

Runs the whole stack on your dev Mac so you can iterate without touching the
prod Mac. Phones on the same WiFi connect over HTTP to the dev Mac's LAN IP.

For the production deployment, see [`PROD.md`](PROD.md).

## What runs in dev

| Service | Where | URL the phones use |
|---|---|---|
| postgres | docker | internal |
| minio | docker | proxied via api on `:3001/media` (or skip and use direct upload URLs) |
| coturn | docker, bridged | `<dev-mac-lan-ip>:3478` (UDP/TCP) |
| api (Fastify) | docker | `http://<dev-mac-lan-ip>:3001` |
| caddy | **disabled** in dev (no TLS) | — |

## Setup

1. **Install Docker Desktop for Mac** (if not already).

2. **Find your dev Mac's LAN IP**:
   ```sh
   ipconfig getifaddr en0   # or en1 if you're on Wi-Fi via a different adapter
   ```
   Call this `LAN_IP` for the rest of this doc.

3. **Reserve the IP** in your router's DHCP so it doesn't move while you're testing.

4. **Configure env**:

   ```sh
   cp infra/.env.example infra/.env
   cp apps/api/.env.example apps/api/.env
   $EDITOR infra/.env apps/api/.env
   ```

   For dev, `infra/.env`:

   ```
   DOMAIN=<LAN_IP>:3001
   ADMIN_EMAIL=dev@local                       # unused without caddy
   COTURN_EXTERNAL_IP=<LAN_IP>
   POSTGRES_PASSWORD=<openssl rand -base64 24>
   MINIO_ACCESS_KEY=<openssl rand -hex 8>
   MINIO_SECRET_KEY=<openssl rand -base64 32>
   TURN_SHARED_SECRET=<openssl rand -base64 32>
   ```

   For dev, `apps/api/.env`:

   ```
   PUBLIC_BASE_URL=http://<LAN_IP>:3001

   DATABASE_URL=postgres://dalkong:<same POSTGRES_PASSWORD>@postgres:5432/dalkong

   JWT_ACCESS_SECRET=<openssl rand -base64 32>
   JWT_REFRESH_SECRET=<openssl rand -base64 32>
   EMAIL_VERIFICATION_SECRET=<openssl rand -base64 32>

   EMAIL_VERIFICATION_REQUIRED=false
   EMAIL_FROM=
   SMTP_URL=

   MINIO_ENDPOINT=minio
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_ACCESS_KEY=<same as infra/.env>
   MINIO_SECRET_KEY=<same as infra/.env>
   MINIO_BUCKET=dalkong-videos

   TURN_REALM=<LAN_IP>
   TURN_SHARED_SECRET=<same as infra/.env>
   TURN_TTL_SECONDS=86400
   TURN_URLS=turn:<LAN_IP>:3478
   STUN_URLS=stun:<LAN_IP>:3478

   CORS_ORIGINS=
   ```

5. **Bring it up**:

   ```sh
   cd infra
   docker compose \
     -f docker-compose.yml \
     -f docker-compose.mac.yml \
     -f docker-compose.dev.yml \
     up -d --build
   ```

   (Tip: `export COMPOSE_FILE=docker-compose.yml:docker-compose.mac.yml:docker-compose.dev.yml` in your shell so `docker compose` picks up all three by default.)

6. **Apply migrations**:

   ```sh
   docker compose exec api node dist/db/migrate.js
   ```

7. **Smoke test from another machine on the LAN** (or your phone's browser):

   ```sh
   curl http://<LAN_IP>:3001/health
   # {"ok":true,"ts":"..."}
   ```

## Mobile app

```sh
cd apps/mobile
echo "DALKONG_API_BASE_URL=http://<LAN_IP>:3001" > .env
```

iOS App Transport Security blocks plain HTTP by default. The `app.config.ts`
already declares `NSAllowsLocalNetworking: true`, which permits HTTP traffic
to RFC 1918 LAN addresses (10.x, 172.16-31.x, 192.168.x) — exactly the
range your dev Mac sits in. No further iOS config needed.

For iteration, run the dev client on a real phone on the same WiFi:

```sh
npx expo run:ios     # or run:android
```

## When you're done iterating

```sh
docker compose down                    # stop the stack
docker compose down -v                 # stop and wipe data volumes (start fresh)
```

To deploy the same code on the prod Mac, follow [`PROD.md`](PROD.md). The dev
Mac and prod Mac share the same compose files; only the env values and which
overrides you pass differ.
