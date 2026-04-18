# CREUP Web — Deployment Guide

Complete guide for deploying CREUP Web on a VPS using Docker, Docker Compose, and NGINX with TLS.

The build always happens **locally or in CI** — the VPS only pulls and runs pre-built images. This keeps the VPS minimal and the build environment reproducible.

---

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [VPS initial setup](#3-vps-initial-setup)
4. [Google OAuth setup](#4-google-oauth-setup)
5. [Configure NGINX with TLS](#5-configure-nginx-with-tls)
6. [Prepare the production environment file](#6-prepare-the-production-environment-file)
7. [Production Docker Compose](#7-production-docker-compose)
8. [First deploy](#8-first-deploy)
9. [Ongoing deploys with deploy.sh](#9-ongoing-deploys-with-deploysh)
10. [Backups](#10-backups)
11. [Health monitoring](#11-health-monitoring)
12. [Updating NGINX or Docker after deploy](#12-updating-nginx-or-docker-after-deploy)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Architecture overview

```
Internet
    │
    ▼
 NGINX (host, port 80 + 443)
  • TLS termination (Let's Encrypt)
  • HTTP → HTTPS redirect
  • client_max_body_size 50m
  • Sets X-Forwarded-For to $remote_addr (single value, not appended)
    │
    ▼
 Docker bridge network
  ┌────────────────────────────────────┐
  │  app (Nitro / Node 24, port 3000) │
  │  postgres (port 5432, internal)   │
  │  redis    (port 6379, internal)   │
  └────────────────────────────────────┘
```

- NGINX runs on the host (not in Docker) and proxies to `127.0.0.1:3000`.
- PostgreSQL and Redis are **not** exposed to the host — they communicate with `app` on the internal Docker bridge.
- Uploads live in bind-mounted host directories so they survive container recreations.
- Migrations run as a **one-shot ephemeral container** during each deploy, before the app restarts.

---

## 2. Prerequisites

### On your local machine

- Docker with Buildx (Docker Desktop or `docker buildx install`)
- `pnpm`
- `ssh` and `git`
- Access to a container registry (GitHub Container Registry — GHCR — is preconfigured)

### On the VPS

- Ubuntu 22.04 LTS or newer (Debian 12 also works)
- 1 GB RAM minimum; 2 GB recommended (Node SSR + PostgreSQL + Redis)
- SSH access with a non-root user in the `docker` group
- Docker Engine (not Docker Desktop) and the Compose plugin
- NGINX
- `certbot` + `python3-certbot-nginx`

---

## 3. VPS initial setup

### 3a. Create the project directory on the VPS

```bash
# As your deploy user (e.g. dockeruser)
sudo mkdir -p /opt/creup-web
sudo chown $USER:$USER /opt/creup-web
cd /opt/creup-web

# Create the data directories that will be bind-mounted
mkdir -p data/public-uploads data/admin-assets
```

### 3b. Copy project files to the VPS

You only need three files on the VPS — the app image is pulled from the registry:

```bash
# From your local machine
scp docker-compose.production.example.yml dockeruser@your-vps:/opt/creup-web/docker-compose.yml
scp -r docker/ dockeruser@your-vps:/opt/creup-web/docker/
```

The `docker/` directory contains `postgres/init/001-extensions.sql` which runs on first PostgreSQL startup to install `pg_trgm`.

### 3c. Authenticate with GHCR on the VPS (if using a private image)

```bash
# On the VPS
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

---

## 4. Google OAuth setup

The admin panel authenticates via Google OAuth. You need a Google Cloud project with OAuth credentials.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add your production domain to **Authorized JavaScript origins**: `https://creup.es`
4. Add the callback URL to **Authorized redirect URIs**: `https://creup.es/api/auth/callback/google`
5. Copy the Client ID and Client Secret into your `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## 5. Configure NGINX with TLS

### 5a. Initial HTTP-only config (needed for Certbot to issue certificates)

Create `/etc/nginx/sites-available/creup`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name creup.es www.creup.es;

    # Certbot ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/creup /etc/nginx/sites-enabled/creup
sudo nginx -t && sudo systemctl reload nginx
```

### 5b. Obtain TLS certificate

```bash
sudo certbot --nginx -d creup.es -d www.creup.es \
  --non-interactive --agree-tos -m admin@creup.es
```

Certbot will edit the nginx config automatically and set up auto-renewal.

### 5c. Replace with the full production config

Use the provided template as your base. Copy and edit it:

```bash
sudo cp /opt/creup-web/deploy/nginx/creup.production.example.conf \
        /etc/nginx/sites-available/creup
```

The template already handles HTTP→HTTPS redirect, WebSocket upgrades, and the critical `X-Forwarded-For` header. The key security requirement is that `X-Forwarded-For` must be set to `$remote_addr` (the direct client IP), **not appended** — this ensures the rate limiter and IP detection see the real IP:

```nginx
# CRITICAL: overwrite, do not append, so Nitro sees exactly one IP.
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP       $remote_addr;
```

Additional hardening to add to the HTTPS server block:

```nginx
# TLS hardening
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;

# HSTS (set here since the app itself does not send this header)
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Proxy buffering tuning
proxy_buffering on;
proxy_buffer_size 8k;
proxy_buffers 8 8k;
proxy_busy_buffers_size 16k;

# Health check endpoint: allow only direct (non-proxied) requests
# The app rejects requests that carry X-Forwarded-For with a 404.
# Do not expose /health via NGINX to the public internet:
location /health {
    deny all;
}
```

Reload NGINX:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Prepare the production environment file

On the VPS, create `/opt/creup-web/.env`. Start from the project's `.env.example` and fill in every value:

```bash
cd /opt/creup-web
# Copy .env from your local machine
scp .env dockeruser@your-vps:/opt/creup-web/.env
# Or create it directly on the VPS
nano .env
```

**Critical values to set for production:**

This block is mirrored in `README.md` and should remain identical.

```env
# ── Application ──
# Site origin — all server-side URL generation and auth use this.
# docker-compose.production.example.yml injects NUXT_SITE_URL from this.
NUXT_SITE_URL=https://creup.es
APP_SECRET=<output of: openssl rand -base64 32>

# ── Admin access ──
ADMIN_EMAILS=yourname@gmail.com
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# ── PostgreSQL ──
POSTGRES_USER=creup
POSTGRES_PASSWORD=<strong random password>
POSTGRES_DB=creup
DATABASE_URL=postgresql://creup:<POSTGRES_PASSWORD>@postgres:5432/creup?schema=public

# ── Redis ──
REDIS_PASSWORD=<strong random password>
NUXT_REDIS_URL=redis://:REDIS_PASSWORD@redis:6379

# ── Deploy ──
APP_PORT=3000
APP_PUBLIC_UPLOADS_DIR=./data/public-uploads
APP_ADMIN_ASSETS_DIR=./data/admin-assets
APPLY_MIGRATIONS_ON_DEPLOY=true

# ── SMTP (required for contact form and newsletter) ──
NUXT_SMTP_HOST=smtp.example.com
NUXT_SMTP_PORT=587
NUXT_SMTP_SECURE=false
NUXT_SMTP_USER=noreply@creup.es
NUXT_SMTP_PASS=<smtp password>
NUXT_SMTP_FROM_EMAIL=noreply@creup.es
NUXT_SMTP_TO_EMAIL=info@creup.es
NUXT_SMTP_PRESS_EMAIL=prensa@creup.es

# ── Google Calendar ──
NUXT_GOOGLE_CALENDAR_API_KEY=<api key>
NUXT_GOOGLE_CALENDAR_ID=<calendar id>

# ── External API ──
NUXT_EXTERNAL_API_BASE_URL=https://api.example.com
NUXT_EXTERNAL_ASSET_PROXY_ALLOWED_ORIGINS=https://api.example.com
NUXT_EXTERNAL_ASSET_PROXY_TIMEOUT_MS=10000
NUXT_EXTERNAL_ASSET_PROXY_IMAGE_MAX_BYTES=15728640
NUXT_EXTERNAL_ASSET_PROXY_PDF_MAX_BYTES=41943040
NUXT_EXTERNAL_API_CACHE_MAX_AGE_SECONDS=60
NUXT_EXTERNAL_API_CACHE_STALE_SECONDS=300

# ── Cloudflare Turnstile (anti-spam on public forms) ──
NUXT_TURNSTILE_SECRET_KEY=<secret key>
NUXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>

# ── Analytics ──
NUXT_UMAMI_HOST=https://umami.creup.es
NUXT_UMAMI_ID=<your umami site id>
```

> **Security:** The `.env` file contains secrets. Permissions should be `600`:
>
> ```bash
> chmod 600 /opt/creup-web/.env
> ```

---

## 7. Production Docker Compose

The file `docker-compose.production.example.yml` is the production Compose template. Copy it to `docker-compose.yml` in your VPS project directory if you haven't already:

```bash
# Already done in step 3b if you followed along
# Rename on VPS if needed:
mv docker-compose.production.example.yml docker-compose.yml
```

The compose file defines:

| Service    | Image                         | Notes                      |
| ---------- | ----------------------------- | -------------------------- |
| `app`      | `ghcr.io/CREUP-DEV/web:<tag>` | Nitro SSR + BullMQ worker  |
| `postgres` | `postgres:18-alpine`          | Data volume + init scripts |
| `redis`    | `redis:8-alpine`              | AOF persistence + password |

**Services are not exposed to the host network** except `app` on `APP_PORT` (default `3000`). NGINX proxies to `127.0.0.1:3000`.

---

## 8. First deploy

### 8a. On your local machine — configure deploy variables

Your local `.env` must include:

```env
VPS_HOST=dockeruser@your-vps-ip-or-hostname
REMOTE_DIR=/opt/creup-web

# GHCR credentials (or use docker login ghcr.io manually)
GHCR_USERNAME=your-github-username
GHCR_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

IMAGE_NAME=ghcr.io/CREUP-DEV/web
DOCKER_PLATFORM=linux/amd64
APPLY_MIGRATIONS_ON_DEPLOY=true
```

### 8b. Make the deploy script executable

```bash
chmod +x deploy.sh
```

### 8c. Run the first deploy

```bash
bash ./deploy.sh
```

What happens step by step:

1. Loads `.env` from your local machine.
2. Builds the Docker image (no secrets baked in — all config is runtime).
3. Pushes the image to GHCR.
4. SSH into the VPS.
5. `docker compose pull` — pulls the new image on the VPS.
6. Starts `postgres` if it isn't running (needed for migrations).
7. Runs `docker compose run --rm app /app/ops/migrate.mjs` — applies pending Drizzle migrations atomically (advisory lock prevents concurrent runs).
8. `docker compose up -d` — recreates all containers.

### 8d. Seed initial data (first time only)

In practice, for production sites it's safer to log in to the admin panel directly and create content there, rather than running the seed (which is destructive).

If you do need to seed, run an ephemeral container on the VPS:

```bash
# On the VPS
cd /opt/creup-web
docker compose run --rm \
  -e NODE_ENV=production \
  -e ALLOW_PRODUCTION_SEED=true \
  app /app/ops/seed.mjs --confirm
```

### 8e. Verify the deploy

```bash
# Direct health check (bypasses NGINX — the app rejects proxied requests to /health)
curl http://127.0.0.1:3000/health
# Expected: {"status":"ok","timestamp":"...","checks":{"database":"ok","redis":"ok","externalApi":"ok","smtp":"ok"}}

# Via the public domain (should get 404 from the app — NGINX blocks /health)
curl -I https://creup.es/health

# Admin panel
open https://creup.es/admin
```

---

## 9. Ongoing deploys with deploy.sh

For every subsequent release:

```bash
bash ./deploy.sh
```

The script applies migrations before recreating the app container, so there is no downtime window where the new code runs against an old schema.

**Zero-downtime note:** Docker Compose `up -d` stops the old container and starts the new one sequentially. For true zero-downtime you would need a load balancer with multiple replicas. For a low-traffic site this ~2 second gap is acceptable.

### Rollback

To roll back to a specific image tag:

```bash
# On the VPS
cd /opt/creup-web
IMAGE=ghcr.io/CREUP-DEV/web:<previous-tag> docker compose up -d app
```

Migrations are **forward-only** (never edit existing migration files). If a migration must be reversed, write a new migration that undoes the change.

---

## 10. Backups

### PostgreSQL

The most reliable approach is `pg_dump` run as a cron job on the VPS:

```bash
# /opt/creup-web/scripts/backup-db.sh
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/opt/creup-web/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/creup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec creup-web-postgres pg_dump \
  -U creup -d creup --no-owner --no-acl \
  | gzip > "$FILENAME"

# Keep only the last 14 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete

echo "Backup saved: $FILENAME"
```

```bash
chmod +x /opt/creup-web/scripts/backup-db.sh

# Add to crontab (daily at 03:00)
crontab -e
# 0 3 * * * /opt/creup-web/scripts/backup-db.sh >> /var/log/creup-backup.log 2>&1
```

Restore from backup:

```bash
gunzip -c backup.sql.gz \
  | docker exec -i creup-web-postgres psql -U creup -d creup
```

### Upload assets

Admin-uploaded files live in `./data/public-uploads` and `./data/admin-assets` on the VPS. Back them up with `rsync` or `tar`:

```bash
# Example: rsync to a remote storage server
rsync -az --delete \
  /opt/creup-web/data/ \
  backup-user@storage-server:/backups/creup-web/data/
```

---

## 11. Health monitoring

### The health endpoint

`GET /health` checks database, Redis, external API, and SMTP, then returns:

```json
{
  "status": "ok",
  "timestamp": "2026-04-12T12:00:00.000Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "externalApi": "ok",
    "smtp": "ok"
  }
}
```

Possible values per check: `ok`, `error`, `unconfigured`, `degraded`.
Overall status: `ok` (200), `degraded` (200), or `error` (503).

**Important:** The endpoint rejects requests that carry an `X-Forwarded-For` header (returns 404). This means it can only be reached by direct requests on the VPS, not through NGINX. Block it in NGINX with `deny all` as shown in section 5c.

### Automated health check (via uptime monitoring)

Use a service like [Uptime Kuma](https://github.com/louislam/uptime-kuma) (self-hosted) or any external uptime monitor. Point it at your public domain — the app will respond normally to all public routes.

For direct internal health checks from the VPS itself:

```bash
# Add to crontab for simple alerting
*/5 * * * * \
  curl -sf http://127.0.0.1:3000/health | grep -q '"status":"ok"' \
  || echo "CREUP health check FAILED at $(date)" | mail -s "CREUP Alert" admin@creup.es
```

### Viewing logs

```bash
# App logs (structured JSON from Nitro)
docker logs -f creup-web-app

# PostgreSQL logs
docker logs -f creup-web-postgres

# Redis logs
docker logs -f creup-web-redis
```

---

## 12. Updating NGINX or Docker after deploy

### Update the NGINX config

```bash
sudo nano /etc/nginx/sites-available/creup
sudo nginx -t && sudo systemctl reload nginx
```

NGINX reload is graceful — in-flight requests complete before workers are replaced.

### TLS certificate renewal

Certbot sets up a systemd timer that auto-renews. Verify it:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### Docker image updates (postgres/redis)

```bash
# On the VPS
cd /opt/creup-web
docker compose pull postgres redis
docker compose up -d postgres redis
```

---

## 13. Troubleshooting

### App won't start — startup config validation failed

The app validates critical environment variables at startup and fails fast with a clear error if any are missing. Check:

```bash
docker logs creup-web-app 2>&1 | grep -A 5 "startup"
```

Common causes: `NUXT_REDIS_URL`, `APP_SECRET`, `NUXT_SMTP_HOST`, `NUXT_EXTERNAL_API_BASE_URL` not set or malformed.

### "Too many connections" from PostgreSQL

Increase `DATABASE_MAX_CONNECTIONS` in `.env` — but stay well below your PostgreSQL `max_connections` setting (default 100). With one app replica the default of 10 is conservative and fine.

### Rate limiting not working

The rate limiter requires Redis and a correct `X-Forwarded-For` header. If the header is missing or contains multiple IPs, rate limiting is skipped (fail-open by design). Verify NGINX sets `X-Forwarded-For $remote_addr` — this must be an assignment, not an append.

### Admin login fails (OAuth redirect error)

Check that:
1. `NUXT_SITE_URL` matches the exact origin in the browser (`https://creup.es`).
2. The Google OAuth callback URL `https://creup.es/api/auth/callback/google` is listed in Authorized redirect URIs.
3. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct.

### Newsletter emails not sending

1. Check the health endpoint: `curl http://127.0.0.1:3000/health` — SMTP should show `ok`.
2. Check logs: `docker logs creup-web-app | grep smtp`.
3. Verify `NUXT_SMTP_*` variables are correct. Test with:

```bash
docker compose exec app node -e "
  const nodemailer = require('nodemailer');
  const t = nodemailer.createTransport({
    host: process.env.NUXT_SMTP_HOST,
    port: Number(process.env.NUXT_SMTP_PORT),
    secure: process.env.NUXT_SMTP_SECURE === 'true',
    auth: { user: process.env.NUXT_SMTP_USER, pass: process.env.NUXT_SMTP_PASS },
  });
  t.verify().then(() => console.log('SMTP OK')).catch(e => console.error(e));
"
```

### Uploads not persisting across deploys

Verify the bind mounts are correctly set in `.env`:

```env
APP_PUBLIC_UPLOADS_DIR=./data/public-uploads
APP_ADMIN_ASSETS_DIR=./data/admin-assets
```

And that these directories exist on the host with the right owner (UID 1000, the non-root user in the distroless image):

```bash
ls -la /opt/creup-web/data/
# Should show writable directories owned by UID 1000
sudo chown -R 1000:1000 /opt/creup-web/data/
```

### Database migration fails during deploy

Migrations acquire a PostgreSQL advisory lock — only one migration run proceeds at a time. If a previous run crashed mid-migration:

```bash
# Check for stuck locks (on the VPS)
docker compose exec postgres psql -U creup -d creup \
  -c "SELECT pid, granted, classid, objid FROM pg_locks WHERE locktype = 'advisory';"

# If needed, kill the stuck session
docker compose exec postgres psql -U creup -d creup \
  -c "SELECT pg_terminate_backend(<pid>);"
```

Then re-run the deploy.
