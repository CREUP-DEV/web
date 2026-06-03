# CREUP Web — Guía de despliegue

Guía completa para desplegar CREUP Web en un VPS con Docker, Docker Compose y NGINX con TLS.

El build siempre ocurre **en local o en CI** — el VPS solo hace pull y ejecuta imágenes ya construidas. Esto mantiene el VPS mínimo y el entorno de build reproducible.

---

## Índice

1. [Visión general de la arquitectura](#1-visión-general-de-la-arquitectura)
2. [Requisitos](#2-requisitos)
3. [Configuración inicial del VPS](#3-configuración-inicial-del-vps)
4. [Configurar Google OAuth](#4-configurar-google-oauth)
5. [Configurar NGINX con TLS](#5-configurar-nginx-con-tls)
6. [Preparar el archivo de entorno de producción](#6-preparar-el-archivo-de-entorno-de-producción)
7. [Docker Compose de producción](#7-docker-compose-de-producción)
8. [Primer despliegue](#8-primer-despliegue)
9. [Despliegues posteriores con deploy.sh](#9-despliegues-posteriores-con-deploysh)
10. [Copias de seguridad](#10-copias-de-seguridad)
11. [Monitorización](#11-monitorización)
12. [Actualizar NGINX o Docker tras el despliegue](#12-actualizar-nginx-o-docker-tras-el-despliegue)
13. [Resolución de problemas](#13-resolución-de-problemas)

---

## 1. Visión general de la arquitectura

```
Internet
    │
    ▼
 NGINX (host o servicio Docker, puertos 80 + 443)
  • Terminación TLS (Let's Encrypt)
  • Redirección HTTP → HTTPS
  • client_max_body_size 50m
  • Fija X-Real-IP y X-Forwarded-For a $remote_addr
    │
    ▼
 Red bridge de Docker
  ┌────────────────────────────────────┐
  │  app (Nitro / Node 24, port 3000) │
  │  postgres (port 5432, internal)   │
  │  redis    (port 6379, internal)   │
  └────────────────────────────────────┘
```

- NGINX puede correr en el host y hacer proxy a `127.0.0.1:APP_PORT`, o como servicio Docker dentro de un Compose raíz compartido y hacer proxy al nombre del servicio (`app:3000` o el nombre real del servicio).
- PostgreSQL y Redis **no** están expuestos al host — se comunican con `app` por la red bridge interna de Docker.
- Los uploads viven en directorios del host montados como bind mounts, por lo que sobreviven a recreaciones de contenedores.
- Las migraciones corren en un **contenedor efímero** durante cada despliegue, antes de reiniciar la app.

---

## 2. Requisitos

### En tu máquina local

- Docker con Buildx (Docker Desktop o `docker buildx install`)
- `pnpm`
- `ssh` y `git`
- Acceso a un registro de contenedores (GitHub Container Registry — GHCR — está preconfigurado)

### En el VPS

- Ubuntu 22.04 LTS o superior (Debian 12 también funciona)
- Mínimo 1 GB de RAM; recomendados 2 GB (Node SSR + PostgreSQL + Redis)
- Acceso SSH con usuario no-root en el grupo `docker`
- Docker Engine (no Docker Desktop) y el plugin Compose
- NGINX
- `certbot` + `python3-certbot-nginx`

---

## 3. Configuración inicial del VPS

### 3a. Crear el directorio del proyecto en el VPS

```bash
# Como tu usuario de despliegue (p.ej. dockeruser)
sudo mkdir -p /opt/creup-web
sudo chown $USER:$USER /opt/creup-web
cd /opt/creup-web

# Crear los directorios de datos que se montarán como bind mounts
mkdir -p \
  data/public-uploads/og \
  data/public-uploads/inicio/imagenes \
  data/public-uploads/conocenos/imagenes \
  data/public-uploads/eventos/imagenes \
  data/public-uploads/eventos/documentos \
  data/public-uploads/prensa/imagenes \
  data/public-uploads/prensa/documentos \
  data/public-uploads/prensa/newsletter/portadas \
  data/public-uploads/prensa/newsletter/documentos \
  data/public-uploads/prensa/newsletter/imagenes-por-defecto \
  data/public-uploads/documentos/externos \
  data/public-uploads/documentos/igualdad \
  data/public-uploads/documentos/informes-economicos \
  data/admin-assets
```

### 3b. Copiar los archivos del proyecto al VPS

Solo necesitas tres archivos en el VPS — la imagen de la app se descarga del registro:

```bash
# Desde tu máquina local
scp docker-compose.production.example.yml dockeruser@tu-vps:/opt/creup-web/docker-compose.yml
scp -r docker/ dockeruser@tu-vps:/opt/creup-web/docker/
```

El directorio `docker/` contiene `postgres/init/001-extensions.sql`, que se ejecuta en el primer arranque de PostgreSQL para instalar `pg_trgm`.

### 3c. Autenticarse en GHCR desde el VPS (si usas imagen privada)

```bash
# En el VPS
echo "TU_GITHUB_PAT" | docker login ghcr.io -u TU_GITHUB_USERNAME --password-stdin
```

---

## 4. Configurar Google OAuth

El panel de administración usa Google OAuth. Necesitas un proyecto de Google Cloud con credenciales OAuth.

1. Ve a [console.cloud.google.com](https://console.cloud.google.com) → APIs y servicios → Credenciales.
2. Crea un **OAuth 2.0 Client ID** (aplicación web).
3. Añade tu dominio de producción a **Authorized JavaScript origins**: `https://creup.es`
4. Añade la URL de callback a **Authorized redirect URIs**: `https://creup.es/api/auth/callback/google`
5. Copia el Client ID y el Client Secret en tu `.env` como `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

---

## 5. Configurar NGINX con TLS

### 5a. Config HTTP inicial (necesaria para que Certbot emita el certificado)

Crea `/etc/nginx/sites-available/creup`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name creup.es www.creup.es;

    # ACME challenge de Certbot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

Actívalo:

```bash
sudo ln -s /etc/nginx/sites-available/creup /etc/nginx/sites-enabled/creup
sudo nginx -t && sudo systemctl reload nginx
```

### 5b. Obtener el certificado TLS

```bash
sudo certbot --nginx -d creup.es -d www.creup.es \
  --non-interactive --agree-tos -m admin@creup.es
```

Certbot modificará la config de NGINX automáticamente y configurará la renovación automática.

### 5c. Sustituir por la config completa de producción

Usa la plantilla incluida como base:

```bash
sudo cp /opt/creup-web/deploy/nginx/creup.production.example.conf \
        /etc/nginx/sites-available/creup
```

Edita la copia para ajustar `server_name`, rutas de certificado y upstream si es necesario.

La plantilla ya gestiona la redirección HTTP→HTTPS, los upgrades de WebSocket y las cabeceras críticas `X-Forwarded-For` y `X-Real-IP`. El requisito clave de seguridad es que ambas se asignen a `$remote_addr` (IP del cliente directo), **sin acumular** — así el rate limiter y la detección de IP ven la IP real:

```nginx
# CRÍTICO: sobreescribir, no acumular, para que Nitro vea exactamente una IP.
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP       $remote_addr;
```

La aplicación prefiere `X-Real-IP` sobre `X-Forwarded-For` cuando la conexión llega desde un proxy de confianza (`NUXT_TRUSTED_PROXY_CIDRS`), siempre que NGINX sobrescriba esa cabecera con `$remote_addr`. Si solo está disponible `X-Forwarded-For`, se recorre de derecha a izquierda omitiendo los saltos de proxy de confianza.

Refuerzo adicional para el bloque HTTPS:

```nginx
# Refuerzo TLS
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;

# HSTS: la app ya envía esta cabecera vía nuxt-security (Strict-Transport-Security: max-age=31536000; includeSubdomains).
# No añadirla también en NGINX para evitar cabeceras duplicadas.

# Ajuste de buffering del proxy
proxy_buffering on;
proxy_buffer_size 8k;
proxy_buffers 8 8k;
proxy_busy_buffers_size 16k;

# Endpoint de health: solo permite peticiones directas (no proxiadas).
# La app rechaza peticiones con X-Forwarded-For con un 404.
# No exponer /health a internet a través de NGINX:
location /health {
    deny all;
}
```

Recarga NGINX:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Preparar el archivo de entorno de producción

En el VPS, crea `/opt/creup-web/.env`. Parte del `.env.example` del proyecto y rellena todos los valores:

```bash
cd /opt/creup-web
# Copiar .env desde tu máquina local
scp .env dockeruser@tu-vps:/opt/creup-web/.env
# O crearlo directamente en el VPS
nano .env
```

**Valores críticos para producción:**

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

# ── Compose deploy ──
COMPOSE_APP_SERVICE=app
COMPOSE_POSTGRES_SERVICE=postgres
COMPOSE_NGINX_SERVICE=nginx

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
NUXT_EXTERNAL_ASSET_BASE_URL=https://assets.example.com
NUXT_EXTERNAL_ASSET_PROXY_ALLOWED_ORIGINS=https://assets.example.com,https://api.example.com
NUXT_EXTERNAL_ASSET_PROXY_TIMEOUT_MS=10000
NUXT_EXTERNAL_ASSET_PROXY_IMAGE_MAX_BYTES=15728640
NUXT_EXTERNAL_ASSET_PROXY_PDF_MAX_BYTES=41943040
NUXT_EXTERNAL_API_CACHE_MAX_AGE_SECONDS=60
NUXT_EXTERNAL_API_CACHE_STALE_SECONDS=300

# ── Trusted proxy CIDRs (optional, default: 127.0.0.1/32,::1/128) ──
# Only connections from these ranges will have X-Forwarded-For honored.
# Add Docker bridge or private network ranges if NGINX runs on a different host.
# NUXT_TRUSTED_PROXY_CIDRS=127.0.0.1/32,::1/128

# ── Cloudflare Turnstile (anti-spam on public forms) ──
NUXT_TURNSTILE_SECRET_KEY=<secret key>
NUXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>

# ── Analytics ──
NUXT_UMAMI_HOST=https://umami.creup.es
NUXT_UMAMI_ID=<your umami site id>
```

La URL pública incrustada en la imagen al compilar debe ser el origen real del sitio. `bash ./deploy.sh` pasa a `docker build` el valor `NUXT_DEPLOY_SITE_URL` si está definido en tu `.env` local; si no, usa `NUXT_SITE_URL`. Así puedes mantener `NUXT_SITE_URL=http://localhost:3000` en el entorno desde el que lanzas el build y definir `NUXT_DEPLOY_SITE_URL=https://creup.es` solo para esa fase; en el VPS, el contenedor sigue leyendo `NUXT_SITE_URL` del `.env` de producción (runtime).

`deploy.sh` exige que `NUXT_SITE_URL` esté definido en el `.env` que carga (aunque sea `http://localhost:3000` en tu portátil). Si usas Umami, `NUXT_UMAMI_HOST` y `NUXT_UMAMI_ID` también deben estar presentes durante `docker build` o `bash ./deploy.sh`, no solo al arrancar el contenedor. El módulo `nuxt-umami` y la CSP de Nuxt se resuelven en compilación.

> **Seguridad:** El archivo `.env` contiene secretos. Permisos recomendados `600`:
>
> ```bash
> chmod 600 /opt/creup-web/.env
> ```

---

## 7. Docker Compose de producción

El archivo `docker-compose.production.example.yml` es la plantilla de Compose para producción. Cópialo a `docker-compose.yml` en el directorio del proyecto en el VPS si aún no lo has hecho:

```bash
mv docker-compose.production.example.yml docker-compose.yml
```

El archivo Compose define:

| Servicio   | Imagen                        | Notas                              |
| ---------- | ----------------------------- | ---------------------------------- |
| `app`      | `ghcr.io/CREUP-DEV/web:<tag>` | Nitro SSR + BullMQ worker          |
| `postgres` | `postgres:18-alpine`          | Volumen de datos + scripts de init |
| `redis`    | `redis:8-alpine`              | Persistencia AOF + contraseña      |

**Los servicios no están expuestos a la red del host** salvo `app` en `APP_PORT` (por defecto `3000`) cuando NGINX corre en el host. Si NGINX corre como servicio Docker, lo normal es no publicar `APP_PORT` y hacer proxy por la red interna al puerto `3000` del contenedor.

El healthcheck de la app se define en el `Dockerfile`; el Compose lo hereda de la imagen. Solo añade `healthcheck:` en Compose si necesitas sobrescribirlo para un entorno concreto. `APP_PORT` es el puerto publicado en el host; dentro del contenedor Nitro escucha en `3000`.

También es válido que este proyecto viva como archivo incluido desde un Compose raíz compartido:

```yaml
include:
  - web/docker-compose.yml
```

En ese caso:

- `COMPOSE_DIR` debe apuntar al directorio del Compose raíz.
- `COMPOSE_APP_SERVICE` debe ser el nombre real del servicio web.
- `COMPOSE_POSTGRES_SERVICE` debe ser el servicio PostgreSQL compartido si las migraciones dependen de él.
- `COMPOSE_NGINX_SERVICE` debe ser el servicio NGINX si vive en el mismo Compose.
- `deploy.sh` debe recrear solo `COMPOSE_APP_SERVICE`; no ejecutes `docker compose up -d` global con `IMAGE` exportado, porque otros servicios que usen `${IMAGE}` podrían arrancar con la imagen equivocada.

---

## 8. Primer despliegue

### 8a. En tu máquina local — configurar variables de despliegue

Tu `.env` local debe incluir:

```env
VPS_HOST=dockeruser@ip-o-hostname-del-vps
REMOTE_DIR=/opt/creup-web

# Si el compose remoto vive fuera de REMOTE_DIR, por ejemplo en un Compose raíz compartido
COMPOSE_DIR=/opt/compose-root
COMPOSE_APP_SERVICE=app
COMPOSE_POSTGRES_SERVICE=postgres
COMPOSE_NGINX_SERVICE=nginx

# Credenciales GHCR (o usa docker login ghcr.io manualmente)
GHCR_USERNAME=tu-usuario-github
GHCR_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

IMAGE_NAME=ghcr.io/CREUP-DEV/web
DOCKER_PLATFORM=linux/amd64
APPLY_MIGRATIONS_ON_DEPLOY=true
DEPLOY_IMAGE_RETENTION=2

# Si activas Umami, estas variables se inyectan también en el build
NUXT_UMAMI_HOST=https://umami.creup.es
NUXT_UMAMI_ID=<your umami site id>
```

### 8b. Dar permisos de ejecución al script

```bash
chmod +x deploy.sh
```

### 8c. Ejecutar el primer despliegue

```bash
bash ./deploy.sh
```

Qué hace paso a paso:

1. Carga las variables desde `.env` local.
2. Construye la imagen Docker (sin secretos baked — toda la config es runtime).
3. Publica la imagen en GHCR.
4. Conecta por SSH al VPS.
5. `docker compose pull "$COMPOSE_APP_SERVICE"` — descarga la nueva imagen en el VPS.
6. Arranca `postgres` si no está en marcha (necesario para las migraciones).
7. Ejecuta `docker compose run --rm "$COMPOSE_APP_SERVICE" /app/ops/migrate.mjs` — aplica las migraciones Drizzle pendientes de forma atómica (el advisory lock evita ejecuciones concurrentes).
8. `docker compose up -d "$COMPOSE_APP_SERVICE"` — recrea solo la app.
9. Recarga NGINX si `COMPOSE_NGINX_SERVICE` existe en el Compose.
10. Elimina en el VPS las imágenes antiguas de `IMAGE_NAME`, conservando las `DEPLOY_IMAGE_RETENTION` más recientes.

### 8d. Seed inicial (solo la primera vez)

Para producción, lo más seguro es entrar directamente al panel de administración y crear el contenido desde allí, en lugar de ejecutar el seed (que es destructivo).

Si aun así necesitas el seed, ejecuta un contenedor efímero en el VPS:

```bash
# En el VPS
cd /opt/creup-web
docker compose run --rm \
  -e NODE_ENV=production \
  -e ALLOW_PRODUCTION_SEED=true \
  app /app/ops/seed.mjs --confirm
```

### 8e. Verificar el despliegue

```bash
# Health check directo (la app rechaza peticiones proxiadas a /health)
curl "http://127.0.0.1:${APP_PORT:-3000}/health"
# Esperado: {"status":"ok","timestamp":"...","checks":{"database":"ok","redis":"ok","externalApi":"ok","smtp":"ok"}}

# Por dominio público (NGINX bloquea /health → 404)
curl -I https://creup.es/health

# Panel de administración
open https://creup.es/admin
```

---

## 9. Despliegues posteriores con deploy.sh

Para cada nueva versión:

```bash
bash ./deploy.sh
```

El script aplica las migraciones antes de recrear el contenedor de la app, por lo que no hay ventana de tiempo en que el nuevo código corra contra un esquema antiguo.

Tras arrancar correctamente, el script limpia imágenes Docker antiguas de la app en el VPS. Por defecto conserva 2 imágenes distintas de `IMAGE_NAME`: la actual y la anterior. Puedes aumentar el margen para rollback con `DEPLOY_IMAGE_RETENTION=3` o desactivar la limpieza con `DEPLOY_IMAGE_RETENTION=0`.

**Nota:** Docker Compose `up -d` para el contenedor antiguo antes de arrancar el nuevo. Para un sitio de bajo tráfico este hueco de ~2 segundos es aceptable; zero-downtime real requeriría un load balancer con réplicas.

### Rollback

Cada despliegue guarda la imagen que estaba corriendo en `.last_app_image` dentro del directorio de Compose del VPS. Para volver a esa imagen desde tu ordenador:

```bash
bash ./rollback.sh
```

También puedes volver a una etiqueta concreta:

```bash
IMAGE_TAG=<etiqueta-anterior> bash ./rollback.sh
```

O ejecutar el rollback manual en el VPS:

```bash
# En el VPS
cd /opt/creup-web
IMAGE=ghcr.io/CREUP-DEV/web:<etiqueta-anterior> docker compose up -d "$COMPOSE_APP_SERVICE"
```

Las migraciones son **unidireccionales** (nunca edites archivos de migración existentes). Si una migración debe revertirse, escribe una nueva migración que deshaga el cambio.

---

## 10. Copias de seguridad

### PostgreSQL

El enfoque más fiable es `pg_dump` como tarea cron en el VPS:

```bash
# /opt/creup-web/scripts/backup-db.sh
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/opt/creup-web/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/creup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec web-postgres pg_dump \
  -U creup -d creup --no-owner --no-acl \
  | gzip > "$FILENAME"

# Conservar solo los últimos 14 días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete

echo "Backup guardado: $FILENAME"
```

```bash
chmod +x /opt/creup-web/scripts/backup-db.sh

# Añadir al crontab (diario a las 03:00)
crontab -e
# 0 3 * * * /opt/creup-web/scripts/backup-db.sh >> /var/log/creup-backup.log 2>&1
```

Restaurar desde backup:

```bash
gunzip -c backup.sql.gz \
  | docker exec -i web-postgres psql -U creup -d creup
```

### Archivos subidos

Los archivos de administración viven en `./data/public-uploads` y `./data/admin-assets` en el VPS. Haz backup con `rsync` o `tar`:

```bash
# Ejemplo: rsync a un servidor de almacenamiento externo
rsync -az --delete \
  /opt/creup-web/data/ \
  backup-user@servidor-storage:/backups/creup-web/data/
```

---

## 11. Monitorización

### El endpoint de health

`GET /health` comprueba base de datos, Redis, API externa y SMTP, y devuelve:

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

Valores posibles por check: `ok`, `error`, `unconfigured`, `degraded`.
Estado global: `ok` (200), `degraded` (200) o `error` (503).

**Importante:** El endpoint rechaza peticiones con cabecera `X-Forwarded-For` (devuelve 404). Solo puede alcanzarse mediante peticiones directas en el VPS, no a través de NGINX. Bloquéalo en NGINX con `deny all` como se muestra en la sección 5c.

### Health check automatizado

Usa un servicio como [Uptime Kuma](https://github.com/louislam/uptime-kuma) (self-hosted) o cualquier monitor externo apuntando al dominio público. Para alertas simples desde el propio VPS:

```bash
# Añadir al crontab
*/5 * * * * \
  curl -sf "http://127.0.0.1:${APP_PORT:-3000}/health" | grep -q '"status":"ok"' \
  || echo "CREUP health check FAILED at $(date)" | mail -s "CREUP Alert" admin@creup.es
```

### Ver logs

```bash
# Logs de la app (JSON estructurado de Nitro)
docker logs -f web-app

# Logs de PostgreSQL
docker logs -f web-postgres

# Logs de Redis
docker logs -f web-redis
```

### Purgar caché pública y de API externa

La web guarda en Redis dos capas de caché: respuestas públicas de Nitro y respuestas de la API externa. Si en la API externa se rellena un campo que antes estaba vacío (foto, nombre, descripción, etc.) y producción sigue mostrando el valor viejo, purga ambas capas:

```bash
# En el VPS
cd /opt/creup-web
docker compose exec app node /app/ops/cache-purge.mjs
```

Para comprobar antes cuántas claves se borrarían:

```bash
docker compose exec app node /app/ops/cache-purge.mjs --dry-run
```

Si solo quieres purgar una capa:

```bash
docker compose exec app node /app/ops/cache-purge.mjs --external-only
docker compose exec app node /app/ops/cache-purge.mjs --nitro-only
```

---

## 12. Actualizar NGINX o Docker tras el despliegue

### Actualizar la config de NGINX

```bash
sudo nano /etc/nginx/sites-available/creup
sudo nginx -t && sudo systemctl reload nginx
```

El reload de NGINX es graceful — las peticiones en vuelo se completan antes de reemplazar los workers.

### Renovación del certificado TLS

Certbot configura un timer de systemd para la renovación automática. Verifica que está activo:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### Actualizar imágenes Docker (postgres/redis)

```bash
# En el VPS
cd /opt/creup-web
docker compose pull postgres redis
docker compose up -d postgres redis
```

---

## 13. Resolución de problemas

### La app no arranca — fallo en la validación de config al inicio

La app valida las variables de entorno críticas al arrancar y falla rápido con un error claro si falta alguna:

```bash
docker logs web-app 2>&1 | grep -A 5 "startup"
```

Causas habituales: `NUXT_REDIS_URL`, `APP_SECRET`, `BETTER_AUTH_URL`/`NUXT_SITE_URL`, `NUXT_SMTP_HOST`, `NUXT_EXTERNAL_API_BASE_URL` no definidas o mal formadas. Si la API externa y los assets viven en orígenes distintos, verifica también `NUXT_EXTERNAL_ASSET_BASE_URL` y `NUXT_EXTERNAL_ASSET_PROXY_ALLOWED_ORIGINS`.

### "Too many connections" de PostgreSQL

Aumenta `DATABASE_MAX_CONNECTIONS` en `.env`, pero mantente muy por debajo del `max_connections` de PostgreSQL (por defecto 100). Con una réplica de la app, el valor por defecto de 10 es conservador y suficiente.

### El rate limiting no funciona

El rate limiter requiere Redis y que la IP del cliente se detecte correctamente. La app solo acepta `X-Real-IP` y `X-Forwarded-For` de conexiones que vengan de CIDRs configurados en `NUXT_TRUSTED_PROXY_CIDRS` (por defecto solo loopback). Verifica que:

1. NGINX asigna `X-Real-IP $remote_addr` y `X-Forwarded-For $remote_addr` — asignación, no acumulación.
2. La IP del proceso NGINX está en `NUXT_TRUSTED_PROXY_CIDRS` (por defecto `127.0.0.1/32,::1/128` cubre el caso estándar).

Si NGINX corre en otro host, añade su IP o rango a `NUXT_TRUSTED_PROXY_CIDRS`.

### El login de administración falla (error de redirect OAuth)

Comprueba que:

1. `NUXT_SITE_URL` coincide exactamente con el origen en el navegador (`https://creup.es`).
2. La URL de callback `https://creup.es/api/auth/callback/google` está en la lista de Authorized redirect URIs de Google.
3. `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` son correctos.

### Los emails de newsletter no se envían

1. Comprueba el health endpoint: `curl "http://127.0.0.1:${APP_PORT:-3000}/health"` — SMTP debe mostrar `ok`.
2. Revisa los logs: `docker logs web-app | grep smtp`.
3. Verifica las variables `NUXT_SMTP_*`. Puedes testear con:

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

### Los uploads no persisten entre despliegues

Verifica que los bind mounts están correctamente definidos en `.env`:

```env
APP_PUBLIC_UPLOADS_DIR=./data/public-uploads
APP_ADMIN_ASSETS_DIR=./data/admin-assets
```

Y que estos directorios existen en el host con el propietario correcto (UID 1000, el usuario no-root de la imagen distroless):

```bash
ls -la /opt/creup-web/data/
# Debe mostrar directorios con permisos de escritura, propietario UID 1000
sudo chown -R 1000:1000 /opt/creup-web/data/
```

### La migración de base de datos falla durante el despliegue

Las migraciones adquieren un advisory lock de PostgreSQL — solo una ejecución avanza a la vez. Si una ejecución anterior quedó a medias:

```bash
# Comprobar locks atascados (en el VPS)
docker compose exec postgres psql -U creup -d creup \
  -c "SELECT pid, granted, classid, objid FROM pg_locks WHERE locktype = 'advisory';"

# Si es necesario, terminar la sesión atascada
docker compose exec postgres psql -U creup -d creup \
  -c "SELECT pg_terminate_backend(<pid>);"
```

Después vuelve a ejecutar el despliegue.
