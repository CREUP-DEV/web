# CREUP Web

Web pública de CREUP construida con Nuxt 4, Nitro, PostgreSQL y Drizzle ORM. Incluye un panel de administración para gestionar el contenido visible del sitio y varias integraciones externas para calendario, contenido institucional y correo.

## Qué incluye

- Web pública SSR con SEO, accesibilidad e i18n.
- Panel de administración para accesos, carrusel, "Qué es CREUP", igualdad, newsletter, prensa, dossier de prensa, enlaces, etiquetas, medios e informes económicos.
- Integración con Google Calendar para la agenda pública y agendas individuales.
- Integración con una API externa para miembros, organigrama, comités, eventos y documentos.
- Envío de correos mediante SMTP.
- Mailpit en local para revisar correos salientes.

## Stack

- Nuxt 4 + Nitro
- Nuxt UI v4 + Tailwind CSS
- `@nuxtjs/i18n`
- PostgreSQL + Drizzle ORM
- `better-auth` con Google OAuth para el panel de administración

## Requisitos

- Node.js compatible con Nuxt 4
- `pnpm`
- Docker y Docker Compose para el entorno local con PostgreSQL, Adminer y Mailpit
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
docker compose up -d postgres adminer mailpit
```

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

## Variables de entorno

### Aplicación

- `SITE_URL`
- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `OG_IMAGE_SECRET`

### Acceso de administración

- `ADMIN_EMAILS`
- `ADMIN_EMAIL_DOMAIN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### SMTP y correo

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_TO_EMAIL`
- `SMTP_PRESS_EMAIL`

Nota: los correos transaccionales del proyecto se mantienen en español.

## Suposiciones de despliegue

- Nitro debe ejecutarse detrás de NGINX u otro proxy de confianza que fije `X-Forwarded-For` y, si
  se usa, `X-Real-IP`.
- El limitador de peticiones usa almacenamiento de caché del proceso por defecto. Protege frente a
  ráfagas locales, pero no sobrevive reinicios ni escalado horizontal sin un backend compartido.
- El envío de newsletters usa una cola persistida en PostgreSQL y un worker ligero dentro de Nitro
  que reanuda lotes pendientes al arrancar y los revisa periódicamente. Al menos una instancia de
  Nitro debe permanecer activa para drenar esa cola.
- Los archivos subidos por administración viven en `.data/admin-assets/` y en subdirectorios de
  `public/`. Ese contenido no está versionado y debe entrar en la estrategia de copias de
  seguridad del despliegue.

### Google Calendar

- `GOOGLE_CALENDAR_API_KEY`
- `GOOGLE_CALENDAR_ID`

### API externa y proxy de assets

- `EXTERNAL_API_BASE_URL`
- `EXTERNAL_ASSET_PROXY_SECRET`
- `EXTERNAL_ASSET_PROXY_ALLOWED_ORIGINS`
- `EXTERNAL_ASSET_PROXY_TIMEOUT_MS`
- `EXTERNAL_ASSET_PROXY_IMAGE_MAX_BYTES`
- `EXTERNAL_ASSET_PROXY_PDF_MAX_BYTES`
- `EXTERNAL_API_CACHE_MAX_AGE_SECONDS`
- `EXTERNAL_API_CACHE_STALE_SECONDS`

### Docker local

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `ADMINER_PORT`
- `MAILPIT_SMTP_PORT`
- `MAILPIT_WEB_PORT`

## Scripts útiles

- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:push`
- `pnpm db:studio`
- `pnpm db:seed`

## Servicios locales

- Aplicación: `http://localhost:3000`
- Adminer: `http://localhost:8088` por defecto
- Mailpit web: `http://localhost:8025` por defecto
- Mailpit SMTP: `localhost:1025` por defecto

## Deploy con Docker + NGINX (sin build en VPS)

Este repositorio incluye un flujo donde el build se hace en tu equipo local o CI, se publica la imagen en GHCR y el VPS solo hace pull + recreate con Docker Compose.

Puntos clave del flujo actual:

- Se usa un único archivo de entorno: `.env` (también en producción).
- `deploy.sh` mantiene las migraciones en deploy (`APPLY_MIGRATIONS_ON_DEPLOY=true` por defecto).
- Hay soporte opcional para ejecutar migraciones en cada arranque del contenedor
  (`RUN_MIGRATIONS_ON_START=true`).
- En producción se recomienda usar bind mounts para gestionar ficheros desde el VPS.

### Compose mínimo de producción

Hay un ejemplo mínimo en `docker-compose.production.example.yml` (sin Adminer/Mailpit y sin
acoplar NGINX dentro del mismo stack). Puedes copiarlo como `docker-compose.yml` en el directorio
del servicio web en el VPS.

El ejemplo usa `env_file: .env` para inyectar variables de entorno, bind mounts para datos de app
y volumen nombrado para PostgreSQL:

- `${APP_PUBLIC_DIR}` -> `/app/.output/public`
- `${APP_ADMIN_ASSETS_DIR}` -> `/app/.output/.data/admin-assets`
- `creup_web_postgres_data` -> `/var/lib/postgresql/data` (si habilitas `postgres` local)

### 1) Preparar VPS una sola vez

1. Copia el proyecto al VPS en una ruta estable (por ejemplo `/opt/creup-web`).
2. Crea el archivo `.env` en el VPS a partir de `.env.example`.
3. Ajusta `DATABASE_URL`, secretos OAuth, SMTP y resto de variables reales.
4. Si usas GHCR privado, ejecuta una vez en el VPS: `docker login ghcr.io`.
5. Si usas PostgreSQL en el mismo compose de producción, usa `DATABASE_URL` con host `postgres`.
6. Asegura que Docker y Docker Compose estén instalados en el VPS.

### 2) Configurar variables en tu equipo local

1. Mantén tu `.env` para desarrollo.
2. Usa ese mismo `.env` como fuente para el deploy.
3. Define al menos:
  - `SITE_URL`
  - `VPS_HOST` (ejemplo: `ubuntu@mi-vps`)
  - `REMOTE_DIR` (ejemplo: `/opt/creup-web`)
4. Opcional:
  - `IMAGE_NAME`, `IMAGE_TAG` o `IMAGE`
  - `GHCR_USERNAME` + `GHCR_TOKEN`
  - `DOCKER_PLATFORM` (por defecto `linux/amd64`)
  - `APPLY_MIGRATIONS_ON_DEPLOY=false` si no quieres ejecutar migraciones en `deploy.sh`
  - `RUN_MIGRATIONS_ON_START=true` para ejecutar migraciones en cada arranque del contenedor

Antes del primer uso, marca scripts como ejecutables:

```sh
chmod +x deploy.sh
```

### 3) Ejecutar deploy remoto

```sh
bash ./deploy.sh
```

Qué hace `deploy.sh`:

1. Carga variables de `.env` local.
2. Construye la imagen con Docker Buildx (o Docker clásico si no hay Buildx).
3. Publica la imagen en GHCR.
4. Se conecta por SSH al VPS.
5. En el VPS ejecuta `cd`, `docker compose pull` y `docker compose up -d`.
6. Si `APPLY_MIGRATIONS_ON_DEPLOY=true`, el `up -d` del deploy fuerza
  `RUN_MIGRATIONS_ON_START=true` para aplicar migraciones en ese despliegue.

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

## Estructura principal

- `app/` — componentes, layouts, páginas y composables
- `server/api/` — endpoints públicos y de administración
- `server/middleware/` — middleware del servidor
- `server/utils/` — utilidades compartidas
- `server/db/` — cliente y esquema de Drizzle
- `i18n/locales/` — mensajes de traducción
- `drizzle/` — migraciones y seeds
