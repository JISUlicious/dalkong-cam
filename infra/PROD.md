# Production deployment (always-on Mac with public access)

This is the **production** runbook — for the always-on Mac that serves the cam
24/7. For local iteration on your dev Mac, see [`DEV.md`](DEV.md).

Configuration assumed:

- An always-on Mac on your home LAN runs the whole stack.
- Your `DOMAIN` resolves publicly to your home IP (DDNS if dynamic).
- Caddy issues a real Let's Encrypt cert.
- Phones on home WiFi reach the API the same way phones on cellular do — via the public domain (NAT hairpin).

If any of those assumptions changes, see the alternatives at the bottom.

## Prerequisites on the prod Mac

- Docker Desktop for Mac. Open it once after install so the engine starts. Enable "Start Docker Desktop when you log in" so the stack survives a reboot.
- Git.
- A static LAN IP for the Mac. The cleanest way: open your router's admin UI, find the Mac in the DHCP client list, and add a DHCP reservation pinning its current LAN IP to its MAC address. Reboot the Mac and confirm it kept the same address.
- A clone of this repo on the prod Mac:
  ```sh
  git clone <your-repo-url> dalkong-cam
  cd dalkong-cam
  ```

## Already running nginx?

If the prod Mac already has nginx terminating TLS for other subdomains, **skip Caddy**
and front dalkong-cam with the existing nginx instead:

1. Use the `docker-compose.nginx.yml` overlay alongside the Mac one. Caddy
   is disabled; api binds to `127.0.0.1:3001`, minio to `127.0.0.1:9000`.
2. Drop [`infra/nginx/cam.example.conf`](nginx/cam.example.conf) into
   `/etc/nginx/sites-available/`, replace the domain, and `ln -s` it to
   `sites-enabled/`.
3. Issue a cert for the subdomain: `sudo certbot --nginx -d cam.yourdomain.com`
   (or extend an existing wildcard).
4. `sudo nginx -t && sudo nginx -s reload`.
5. coturn ports (3478/UDP+TCP, 49152-49262/UDP) still need to be forwarded
   from the router to the Mac directly — nginx is not involved in TURN
   traffic.

The compose invocation becomes:

```sh
docker compose \
  -f docker-compose.yml \
  -f docker-compose.mac.yml \
  -f docker-compose.nginx.yml \
  up -d --build
```

The rest of this doc (DNS, env, secrets, migrations, smoke tests) applies
unchanged. Skip the "Caddy logs / cert obtained" section.

## DNS and ports

1. **A record**: `cam.yourdomain.com` (or whatever you set as `DOMAIN`) must resolve to your home's public IPv4.
   - Find your public IP: `curl ifconfig.me` from any machine at home.
   - If your ISP gives you a dynamic IP, set up a DDNS updater so the A record stays fresh. Common picks: Cloudflare DDNS (a tiny script + an API token), DuckDNS (free), or your router's built-in DDNS.

2. **Port forwards** (router → second Mac's LAN IP):

   | Port | Protocol | Target on Mac | Purpose |
   |---|---|---|---|
   | 80 | TCP | same | Caddy HTTP-01 ACME challenge + redirect to HTTPS |
   | 443 | TCP | same | API + signaling (WSS) |
   | 3478 | UDP + TCP | same | coturn STUN/TURN |
   | 5349 | TCP | same | TURNS (skip for v1; see "TURNS later" below) |
   | 49152–49262 | UDP | same | coturn relay range (see `infra/docker-compose.mac.yml`) |

3. **ISP check**: most residential ISPs don't block 443 or 3478, but a handful block 80. If yours does, Caddy will fail HTTP-01. Two workarounds: (a) use a DNS-01 challenge with your DNS provider's API token, or (b) flip to a Cloudflare Tunnel (no inbound ports needed at all) — that's a different deployment shape, ask if you want to go that route.

## Configure

```sh
cd dalkong-cam
cp infra/.env.example infra/.env
cp apps/api/.env.example apps/api/.env
$EDITOR infra/.env apps/api/.env
```

In `infra/.env`:

```
DOMAIN=cam.yourdomain.com
ADMIN_EMAIL=you@yourdomain.com
COTURN_EXTERNAL_IP=<your home public IP>      # Mac override needs this
POSTGRES_PASSWORD=<openssl rand -base64 24>
MINIO_ACCESS_KEY=<openssl rand -hex 8>
MINIO_SECRET_KEY=<openssl rand -base64 32>
TURN_SHARED_SECRET=<openssl rand -base64 32>
```

In `apps/api/.env` for option A (skip email verification):

```
PUBLIC_BASE_URL=https://cam.yourdomain.com

DATABASE_URL=postgres://dalkong:<same POSTGRES_PASSWORD>@postgres:5432/dalkong

JWT_ACCESS_SECRET=<fresh openssl rand -base64 32>
JWT_REFRESH_SECRET=<fresh openssl rand -base64 32>
EMAIL_VERIFICATION_SECRET=<fresh openssl rand -base64 32>

EMAIL_VERIFICATION_REQUIRED=false
EMAIL_FROM=
SMTP_URL=

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=<same as infra/.env>
MINIO_SECRET_KEY=<same as infra/.env>
MINIO_BUCKET=dalkong-videos

TURN_REALM=cam.yourdomain.com
TURN_SHARED_SECRET=<same as infra/.env>
TURN_TTL_SECONDS=86400
TURN_URLS=turn:cam.yourdomain.com:3478
STUN_URLS=stun:cam.yourdomain.com:3478

CORS_ORIGINS=https://cam.yourdomain.com
```

(Drop `turns:` from `TURN_URLS` for v1 since we're skipping TURNS.)

## Bring it up

From `infra/`, **always pass both compose files on Mac**:

```sh
docker compose -f docker-compose.yml -f docker-compose.mac.yml up -d --build
```

Tip: `export COMPOSE_FILE=docker-compose.yml:docker-compose.mac.yml` in your shell, or drop a one-line `infra/.env`-friendly alias, so you don't forget.

Wait ~30 seconds for Caddy to obtain a cert (it provisions on first request). Watch with:

```sh
docker compose -f docker-compose.yml -f docker-compose.mac.yml logs -f caddy
```

You should see `certificate obtained successfully`. If you see ACME failures, the most common cause is port 80 not actually reaching this Mac — re-check the router forward.

## Apply migrations

After the first boot, once postgres is healthy:

```sh
docker compose -f docker-compose.yml -f docker-compose.mac.yml \
  exec api node dist/db/migrate.js
```

Output should be `Migrations applied from /repo/apps/api/dist/db/migrations`.

## Verify

From any machine, anywhere:

```sh
curl https://cam.yourdomain.com/health
# {"ok":true,"ts":"..."}

# Anonymous WS connect should be rejected:
brew install websocat   # one-time
websocat wss://cam.yourdomain.com/signaling
# closes with: 4401 unauthorized
```

End-to-end smoke test (signup → login → TURN creds):

```sh
DOMAIN=cam.yourdomain.com

# 1. signup (option A auto-verifies)
curl -sS -X POST https://$DOMAIN/auth/signup \
  -H content-type:application/json \
  -d '{"email":"me@example.com","password":"violet-hexagon-driftwood-quartz"}'

# 2. login
ACCESS=$(curl -sS -X POST https://$DOMAIN/auth/login \
  -H content-type:application/json \
  -d '{"email":"me@example.com","password":"violet-hexagon-driftwood-quartz"}' \
  | jq -r .accessToken)

# 3. TURN creds
curl -sS -H "authorization: Bearer $ACCESS" https://$DOMAIN/api/turn-credentials
# { "username": "...", "credential": "...", "iceServers": [...] }
```

## Mac housekeeping

- **Keep the Mac awake**: System Settings → Energy → "Prevent automatic sleeping when display is off" (or run a background `caffeinate -di` LaunchAgent). If the Mac sleeps, the cam is offline.
- **macOS Firewall**: System Settings → Network → Firewall. Either turn it off, or enable it and explicitly allow Docker. With it on but not configured, Docker can fail to bind ports.
- **Auto-restart on reboot**: `restart: unless-stopped` on every service is already set, so as long as Docker Desktop launches at login, the stack comes back. To enable Docker Desktop autostart: Docker → Settings → General → "Start Docker Desktop when you log in".
- **Updates**: `docker compose pull && docker compose up -d` periodically.

## Mobile app config

```sh
cd apps/mobile
echo "DALKONG_API_BASE_URL=https://cam.yourdomain.com" > .env
```

The phones will reach the API the same way whether they're on home WiFi (NAT hairpin via the router) or cellular. If your router doesn't support hairpin (rare on modern routers), phones on home WiFi would loop back through the public DNS path — symptoms: works on cellular, fails on WiFi. Fix: enable "NAT loopback" / "hairpin NAT" in router settings, or set up split-horizon DNS pointing `cam.yourdomain.com` to the Mac's LAN IP for clients on the home network.

## Alternatives

- **Public via Cloudflare Tunnel** instead of port-forwarding: no inbound ports, no DDNS, Cloudflare terminates TLS. Less self-hosted (Cloudflare is in the trust chain) but simpler. Ask if you want a recipe.
- **TURNS later**: to add encrypted TURN on 5349, mount Caddy's data volume into coturn (already wired in `docker-compose.yml`) and pass `--cert=/caddy-data/.../fullchain.pem --pkey=/caddy-data/.../key.pem` to coturn. Plain TURN on 3478 works on virtually all home networks, so this is rarely needed.
