# CREUP Web

Web pública de CREUP construida con Nuxt 4, Nitro, PostgreSQL, Redis, BullMQ y Drizzle ORM. Incluye un panel de administración para gestionar el contenido visible del sitio y varias integraciones externas para calendario, contenido institucional y correo.

## Qué incluye

- Web pública SSR con SEO, accesibilidad e i18n.
- Panel de administración para accesos, carrusel, "Qué es CREUP", igualdad, newsletter, prensa, dossier de prensa, enlaces, etiquetas, medios e informes económicos.
- Integración con Google Calendar para la agenda pública y agendas individuales.
- Integración con una API externa para miembros, organigrama, comités, eventos y documentos.
- Caché SSR/API, caché SWR de integraciones externas y limitación de peticiones compartidas en Redis.
- Cola BullMQ para envío de newsletters y tareas periódicas de mantenimiento.
- Envío de correos mediante SMTP.
- Mailpit en local para revisar correos salientes.

## Stack

- Nuxt 4 + Nitro
- Nuxt UI v4 + Tailwind CSS
- `@nuxtjs/i18n`
- Redis
- BullMQ
- PostgreSQL + Drizzle ORM
- `better-auth` con Google OAuth para el panel de administración

## Requisitos

- Node.js compatible con Nuxt 4
- `pnpm`
- Docker y Docker Compose para el entorno local con PostgreSQL, Redis, Adminer y Mailpit
- En producción, un proxy inverso delante de Nitro. Esta aplicación asume NGINX configurado para
  sobrescribir `X-Forwarded-For` con la IP real del cliente.

## Desarrollo local

1. Instala dependencias:

```sh
pnpm install
```

2. Crea tu `.env` y configura las variables necesarias.

3. Levanta los servicios auxiliares:

```sh
docker compose up -d postgres redis adminer mailpit
```

PostgreSQL local monta [docker/postgres/init/001-extensions.sql](./docker/postgres/init/001-extensions.sql), así que un volumen nuevo crea `pg_trgm` automáticamente en el primer arranque.

4. Ejecuta la aplicación:

```sh
pnpm dev
```

5. Si cambias el esquema de base de datos:

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

`pnpm db:migrate` usa el runner del proyecto, carga `.env`, muestra progreso, adquiere el advisory lock y garantiza extensiones PostgreSQL requeridas como `pg_trgm` antes de aplicar migraciones.

`pnpm db:seed` carga `.env` desde el propio script. En desarrollo no pide confirmación; en producción exige `--confirm` y `ALLOW_PRODUCTION_SEED=true`.

## Variables de entorno

### Runtime env (container start)

Toda la configuración es runtime — la imagen no lleva secretos ni URLs baked. Variables leídas en arranque:

- Requeridas para arrancar (validadas al inicio): `NUXT_SITE_URL`, `DATABASE_URL`, `APP_SECRET`, `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NUXT_REDIS_URL`, `NUXT_EXTERNAL_API_BASE_URL`, `NUXT_GOOGLE_CALENDAR_API_KEY`, `NUXT_GOOGLE_CALENDAR_ID`, `NUXT_SMTP_HOST`, `NUXT_SMTP_PORT`, `NUXT_SMTP_SECURE`, `NUXT_SMTP_USER`, `NUXT_SMTP_PASS`
- Requeridas por funcionalidades concretas: `NUXT_SMTP_FROM_EMAIL`, `NUXT_SMTP_TO_EMAIL`, `NUXT_SMTP_PRESS_EMAIL`, `NUXT_EXTERNAL_ASSET_PROXY_*`, `NUXT_EXTERNAL_API_CACHE_*`
- Si habilitas formularios públicos con verificación anti-spam: `NUXT_TURNSTILE_SECRET_KEY` y `NUXT_PUBLIC_TURNSTILE_SITE_KEY`

`DATABASE_URL` se mantiene sin prefijo `NUXT_` porque se lee con `process.env` de forma directa.

Cambiar dominio/origen no requiere reconstruir la imagen — solo cambia `NUXT_SITE_URL` y recrea el contenedor.

### Critical values to set for production

Este bloque se mantiene idéntico al de `DEPLOYMENT.md` para evitar desalineaciones.

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

## Suposiciones de despliegue

- Nitro debe ejecutarse detrás de NGINX u otro proxy de confianza que fije `X-Forwarded-For` y
  `X-Real-IP`. La ruta `/health` rechaza peticiones que lleven cabecera `X-Forwarded-For` (responde 404),
  por lo que solo son válidos los health checks directos sin pasar por proxy.
- Redis es obligatorio para caché de handlers Nitro, caché SWR de APIs externas, rate limiting
  público, almacenamiento secundario de Better Auth y colas BullMQ.
- El envío de newsletters usa una cola persistida en PostgreSQL y un worker ligero dentro de Nitro
  para el estado de entregas, pero la orquestación de envíos y tareas periódicas corre por BullMQ
  sobre Redis. Al menos una instancia de Nitro debe permanecer activa para procesar esa cola.
- En despliegue Docker en mismo VPS, usa `REDIS_PASSWORD` y `NUXT_REDIS_URL=redis://:TU_PASSWORD@redis:6379` dentro de `app`.
- Los archivos subidos por administración viven en `.data/admin-assets/` y en subdirectorios de
  `public/`. Ese contenido no está versionado y debe entrar en la estrategia de copias de
  seguridad del despliegue.
- Los assets estáticos de marca sí pueden versionarse en `public/`, pero los uploads gestionados
  desde administración (`inicio/`, `prensa/`, `conocenos/`, `documentos/igualdad/`,
  `documentos/informes-economicos/` y cualquier `_tmp/`) deben quedar fuera de Git.
- Configura también un límite de cuerpo en el proxy frontal (`client_max_body_size` en NGINX o
  equivalente) alineado con el mayor upload permitido por la app. Hoy la administración usa un
  techo duro de 22 MB por petición y la app exige `Content-Length` en uploads.

### Google Calendar

- `NUXT_GOOGLE_CALENDAR_API_KEY`
- `NUXT_GOOGLE_CALENDAR_ID`

### API externa y proxy de assets

- `NUXT_EXTERNAL_API_BASE_URL`
- `NUXT_EXTERNAL_ASSET_PROXY_ALLOWED_ORIGINS`
- `NUXT_EXTERNAL_ASSET_PROXY_TIMEOUT_MS`
- `NUXT_EXTERNAL_ASSET_PROXY_IMAGE_MAX_BYTES`
- `NUXT_EXTERNAL_ASSET_PROXY_PDF_MAX_BYTES`
- `NUXT_EXTERNAL_API_CACHE_MAX_AGE_SECONDS`
- `NUXT_EXTERNAL_API_CACHE_STALE_SECONDS`

### Umami y CSP

- La CSP se construye de forma dinámica y añade el origen de `NUXT_UMAMI_HOST` a `connect-src` cuando está configurado.
- Si usas Umami en un origen distinto al de la web (por ejemplo `https://umami.creup.es`), define `NUXT_UMAMI_HOST` para evitar bloqueos por CSP.
- El modo proxy de Umami (`proxy: cloak`) sigue activo; esta configuración añade resiliencia si hay fallback al host directo.

### Docker local

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `REDIS_PORT`
- `ADMINER_PORT`
- `MAILPIT_SMTP_PORT`
- `MAILPIT_WEB_PORT`

## Scripts útiles

- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm i18n:check` — verifica que `en.json` tiene exactamente las mismas claves que `es.json`
- `pnpm i18n:audit-identical` — detecta claves con traducción idéntica en ambos idiomas
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:studio`
- `pnpm db:seed`

## Servicios locales

- Aplicación: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- Redis: `localhost:6379` por defecto
- Adminer: `http://localhost:8088` por defecto
- Mailpit web: `http://localhost:8025` por defecto
- Mailpit SMTP: `localhost:1025` por defecto

## Deploy con Docker + NGINX (resumen rápido)

Este repositorio incluye un flujo donde el build se hace en tu equipo local o CI, se publica la imagen en GHCR y el VPS solo hace pull + recreate con Docker Compose.

Puntos clave del flujo actual:

- Se usa un único archivo de entorno: `.env` (también en producción).
- `deploy.sh` aplica migraciones antes de recrear los contenedores (`APPLY_MIGRATIONS_ON_DEPLOY=true` por defecto).
- No se ejecutan migraciones en el arranque normal del contenedor.
- El runner de migraciones usa un bloqueo advisory de PostgreSQL para evitar ejecuciones concurrentes.
- En producción se recomienda usar bind mounts para gestionar ficheros desde el VPS.

### Compose mínimo de producción

Hay un ejemplo mínimo en `docker-compose.production.example.yml` (sin Adminer/Mailpit y sin
acoplar NGINX dentro del mismo stack). Puedes copiarlo como `docker-compose.yml` en el directorio
del servicio web en el VPS.

El ejemplo usa `env_file: .env` para inyectar variables de entorno, bind mounts para uploads de app
y volúmenes nombrados para PostgreSQL y Redis:

- `${APP_PUBLIC_UPLOADS_DIR}` -> subrutas de uploads en `/app/.output/public` (sin sobrescribir `/_nuxt`)
- `${APP_ADMIN_ASSETS_DIR}` -> `/app/.output/.data/admin-assets`
- `creup_web_postgres_data` -> `/var/lib/postgresql/data` (si habilitas `postgres` local)
- `creup_web_redis_data` -> `/data`

### 1) Preparar VPS una sola vez

1. Copia el proyecto al VPS en una ruta estable (por ejemplo `/opt/creup-web`).
2. Crea el archivo `.env` en el VPS a partir de `.env.example`.
3. Ajusta las variables reales siguiendo el bloque canónico de esta sección (idéntico a `DEPLOYMENT.md`, con mismo orden y descripciones).
4. Si usas GHCR privado, ejecuta una vez en el VPS: `docker login ghcr.io`.
5. Si usas PostgreSQL en el mismo compose de producción, usa `DATABASE_URL` con host `postgres`.
6. Si usas Redis en el mismo compose de producción, define `REDIS_PASSWORD` y usa `NUXT_REDIS_URL=redis://:TU_PASSWORD@redis:6379`.
7. Asegura que Docker y Docker Compose estén instalados en el VPS.

### 2) Configurar variables en tu equipo local

1. Mantén tu `.env` para desarrollo.
2. Usa ese mismo `.env` como fuente para el deploy.
3. Define al menos:

- `VPS_HOST` (ejemplo: `ubuntu@mi-vps`)
- `REMOTE_DIR` (ejemplo: `/opt/creup-web`)

4. Opcional:

- `IMAGE_NAME`, `IMAGE_TAG` o `IMAGE`
- `GHCR_USERNAME` + `GHCR_TOKEN`
- `DOCKER_PLATFORM` (por defecto `linux/amd64`)
- `APPLY_MIGRATIONS_ON_DEPLOY=false` si no quieres ejecutar migraciones en `deploy.sh`

Antes del primer uso, marca scripts como ejecutables:

```sh
chmod +x deploy.sh
chmod +x deploy-local.sh
```

### 3) Ejecutar deploy remoto

```sh
bash ./deploy.sh
```

Qué hace `deploy.sh`:

1. Carga variables de `.env` local.
2. Construye la imagen con Docker Buildx (o Docker clásico si no hay Buildx). No bake secrets ni URLs — toda la config es runtime.
3. Publica la imagen en GHCR.
4. Se conecta por SSH al VPS.
5. En el VPS ejecuta `cd` y `docker compose pull`.
6. Si `APPLY_MIGRATIONS_ON_DEPLOY=true`, ejecuta un contenedor efímero para correr `/app/ops/migrate.mjs`.
7. Finalmente ejecuta `docker compose up -d`.

### Prueba local de despliegue (modo producción)

Si quieres validar cómo queda la web desplegada sin VPS, usa el stack local con NGINX frontal:

- `docker-compose.local-deploy.yml` levanta `nginx`, `app`, `postgres`, `redis` y `mailpit`.
- `deploy-local.sh` construye la imagen de producción local, aplica migraciones y levanta el stack.

Pasos:

1. Crea `.env.local-deploy` (o usa `.env` existente).
2. Asegura una URL local de prueba: `LOCAL_DEPLOY_SITE_URL=http://localhost:8080`.
3. Ejecuta:

```sh
bash ./deploy-local.sh
```

Nota: en `docker-compose.local-deploy.yml`, las variables `NUXT_*` de `environment` tienen prioridad sobre `env_file`, por lo que los overrides de Mailpit se aplican aunque en tu `.env` tengas otros valores.

Comandos útiles:

```sh
bash ./deploy-local.sh status
bash ./deploy-local.sh logs
bash ./deploy-local.sh logs app nginx
bash ./deploy-local.sh logs all --no-follow -n 100
bash ./deploy-local.sh logs postgres --since 30m --grep error
bash ./deploy-local.sh doctor
bash ./deploy-local.sh doctor /inicio/imagenes/carrusel/mi-banner.webp
bash ./deploy-local.sh down
```

Opciones de logs:

- Servicios: `app`, `nginx`, `postgres`, `redis`, `mailpit` o `all`.
- Múltiples servicios explícitos: `bash ./deploy-local.sh logs app nginx redis`.
- Filtros: `--no-follow`, `--lines/-n`, `--since`, `--until`, `--timestamps/-t`, `--grep`.
- Ayuda completa: `bash ./deploy-local.sh logs --help`.

Diagnóstico rápido:

- `bash ./deploy-local.sh doctor` muestra estado de contenedores y prueba la home tanto desde NGINX como desde la app.
- `bash ./deploy-local.sh doctor /ruta/publica.webp` compara esa ruta en el proxy local, en Nitro y, si es imagen, también genera una petición IPX equivalente para detectar diferencias de `Content-Length`, `ETag`, `Cache-Control` o bytes reales servidos.
- Si el stack no llega a estar listo durante `up`, el script muestra automáticamente `compose ps` y los logs recientes de `app`, `nginx`, `postgres` y `redis`.

Depuración de stack traces:

- El stack local exporta `NODE_OPTIONS=--enable-source-maps --trace-uncaught` por defecto para que los errores del contenedor `app` sean más útiles en modo producción local.
- Puedes sobrescribirlo con `LOCAL_DEPLOY_NODE_OPTIONS=...` en tu `.env.local-deploy`.

Puertos por defecto:

- Web (NGINX): `http://localhost:8080`
- Mailpit: `http://localhost:8025`

### 4) Persistencia de uploads en producción

La app escribe assets en disco (`.data/admin-assets` y varios subdirectorios de `public/`).
En producción, usa bind mounts para gestionar ese contenido directamente en el VPS.

Haz backup tanto de PostgreSQL como de estos volúmenes Docker.

### 5) TLS / HTTPS

Para producción pública:

1. Añade TLS (Let's Encrypt con certbot o un proxy frontal).
2. Fuerza redirección HTTP -> HTTPS.
3. Mantén cabeceras `X-Real-IP` y `X-Forwarded-For` con IP real del cliente.
4. Puedes partir de la plantilla `deploy/nginx/creup.production.example.conf` y adaptarla a tu dominio/certificados.

NGINX puede vivir en un stack separado del stack web. El deploy de este repositorio no modifica
la configuración de NGINX.

La app no envía cabecera HSTS por sí sola. Si necesitas `Strict-Transport-Security`, configúrala
en proxy/CDN una vez confirmado que todo el tráfico público entra por HTTPS.

## Estructura principal

- `app/` — componentes, layouts, páginas y composables
- `server/api/` — endpoints públicos y de administración
- `server/middleware/` — middleware del servidor
- `server/utils/` — utilidades compartidas
- `server/db/` — cliente y esquema de Drizzle
- `i18n/locales/` — mensajes de traducción
- `drizzle/` — migraciones y seeds

## Despliegue en producción

Consulta [`DEPLOYMENT.md`](./DEPLOYMENT.md) para una guía completa paso a paso con Docker, Docker Compose y NGINX sobre un VPS.
