# CREUP Web

Web pública de CREUP construida con Nuxt 4, Nitro, PostgreSQL, Redis, BullMQ y Drizzle ORM. Incluye un panel de administración para gestionar el contenido del sitio e integraciones con Google Calendar, una API externa y correo.

## Qué incluye

- Web pública SSR con SEO, accesibilidad e i18n.
- Panel de administración para accesos, carrusel, "Qué es CREUP", igualdad, newsletter, prensa, dossier de prensa, enlaces, etiquetas, medios e informes económicos.
- Integración con Google Calendar para la agenda pública y agendas individuales.
- Integración con una API externa para miembros, organigrama, comités, eventos y documentos.
- Caché SSR/API, caché SWR de integraciones externas y limitación de peticiones compartidas en Redis.
- Cola BullMQ para envío de newsletters y tareas periódicas de mantenimiento.
- Envío de correos mediante SMTP y Mailpit para revisarlos en local.

## Stack

- Nuxt 4 + Nitro
- Nuxt UI v4 + Tailwind CSS
- `@nuxtjs/i18n`
- `nuxt-security` (CSP, HSTS y cabeceras HTTP de seguridad)
- Redis + BullMQ
- PostgreSQL + Drizzle ORM
- `better-auth` con Google OAuth para el panel de administración

## Requisitos

- Node.js compatible con Nuxt 4
- `pnpm`
- Docker y Docker Compose para el entorno local (PostgreSQL, Redis, Adminer y Mailpit)
- En producción, un proxy inverso delante de Nitro. Configura `NUXT_TRUSTED_PROXY_CIDRS` con los CIDRs del proxy; solo las conexiones desde esos rangos tendrán `X-Forwarded-For` en cuenta. Por defecto, solo loopback (`127.0.0.1/32,::1/128`).

## Desarrollo local

1. Instala dependencias:

```sh
pnpm install
```

2. Crea tu `.env` basándote en `.env.example` y configura las variables necesarias.

3. Levanta los servicios auxiliares:

```sh
docker compose up -d postgres redis adminer mailpit
```

El init de PostgreSQL ejecuta `docker/postgres/init/001-extensions.sql`, que instala `pg_trgm` automáticamente en el primer arranque.

4. Arranca la aplicación:

```sh
pnpm dev
```

5. Si cambias el esquema de base de datos:

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

`pnpm db:migrate` carga `.env`, muestra progreso, adquiere el advisory lock de PostgreSQL y garantiza las extensiones necesarias antes de aplicar migraciones.

`pnpm db:seed` es destructivo: vacía y recarga las tablas de contenido dentro de una única transacción (si algo falla, revierte sin dejar la base a medias). El script ya incluye `--confirm` y solo se ejecuta si el host de `DATABASE_URL` es local (`localhost`, `127.0.0.1`, `::1` o el servicio Docker `postgres`); para un wipe intencionado contra otro host define `ALLOW_SEED_WIPE=true`. En producción exige además `ALLOW_PRODUCTION_SEED=true`. No borra las tablas de suscriptores de la newsletter (`newsletter_subscribers` / `newsletter_subscription_events`): conservan la evidencia de consentimiento RGPD.

En desarrollo local, `NUXT_SITE_URL` puede quedarse en `http://localhost:3000`. Si la imagen de producción debe compilarse incrustando otro origen público (por ejemplo al ejecutar `deploy.sh` desde una máquina cuyo `.env` sigue apuntando a localhost), define `NUXT_DEPLOY_SITE_URL`: `deploy.sh` y `deploy-local.sh` usarán esa variable solo como `--build-arg` del build; el runtime del contenedor sigue configurándose con `NUXT_SITE_URL` en el entorno donde arranca Compose (p. ej. el `.env` del VPS).

## Variables de entorno

Casi toda la configuración es runtime; la imagen no lleva secretos ni URLs baked por defecto y las variables se leen al arrancar el contenedor.

Excepción importante: `NUXT_SITE_URL`, `NUXT_UMAMI_HOST` y `NUXT_UMAMI_ID` también deben estar disponibles durante `pnpm build` o `docker build`, porque Nuxt las usa al compilar la configuración del sitio y del módulo de analítica.

El bloque completo de variables con descripciones y valores de ejemplo está en [`DEPLOYMENT.md`](./DEPLOYMENT.md#6-preparar-el-archivo-de-entorno-de-producción).

En resumen:

- **Obligatorias al arrancar:** `NUXT_SITE_URL`, `DATABASE_URL`, `APP_SECRET`, `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NUXT_REDIS_URL`, `NUXT_EXTERNAL_API_BASE_URL`, `NUXT_GOOGLE_CALENDAR_API_KEY`, `NUXT_GOOGLE_CALENDAR_ID`, `NUXT_SMTP_HOST/PORT/SECURE/USER/PASS`
- **Necesarias también en build:** `NUXT_SITE_URL` y, si activas Umami, `NUXT_UMAMI_HOST` + `NUXT_UMAMI_ID`
- **Opcionales según funcionalidad:** `NUXT_EXTERNAL_ASSET_BASE_URL`, `NUXT_SMTP_FROM_EMAIL`, `NUXT_SMTP_TO_EMAIL`, `NUXT_SMTP_PRESS_EMAIL`, `NUXT_EXTERNAL_ASSET_PROXY_*`, `NUXT_EXTERNAL_API_CACHE_*`, `NUXT_TURNSTILE_*`, `NUXT_UMAMI_*`, `NUXT_TRUSTED_PROXY_CIDRS`
- **Solo en local (compose):** `POSTGRES_USER/PASSWORD/DB/PORT`, `REDIS_PORT`, `ADMINER_PORT`, `MAILPIT_SMTP_PORT`, `MAILPIT_WEB_PORT`

`DATABASE_URL` va sin prefijo `NUXT_` porque se lee con `process.env` directamente. Cambiar de dominio no requiere reconstruir la imagen; basta con actualizar `NUXT_SITE_URL` y recrear el contenedor.

### Notas de producción

- Redis es obligatorio para caché de handlers, SWR de APIs externas, rate limiting, almacenamiento de Better Auth y colas BullMQ.
- Al menos una instancia de Nitro debe permanecer activa para procesar la cola de newsletters.
- Los archivos subidos desde administración viven en `.data/admin-assets/` y subdirectorios de `public/`. No están versionados y deben incluirse en el plan de copias de seguridad.
- Configura un límite de cuerpo en el proxy frontal alineado con el mayor upload permitido. La app usa un techo duro de 22 MB por petición, exige `Content-Length` y también cuenta los bytes realmente recibidos antes de procesar el multipart.
- La ruta `/health` rechaza peticiones con `X-Forwarded-For` (devuelve 404), así que los health checks solo funcionan directamente, sin pasar por proxy.
- La CSP envía informes a `/api/csp-report`. El endpoint valida el cuerpo, aplica rate limiting y escribe un resumen en logs para poder endurecer directivas como `style-src` con datos reales.

## Scripts útiles

| Script                        | Descripción                                            |
| ----------------------------- | ------------------------------------------------------ |
| `pnpm dev`                    | Servidor de desarrollo                                 |
| `pnpm build`                  | Construir para producción                              |
| `pnpm preview`                | Previsualizar build                                    |
| `pnpm lint` / `pnpm lint:fix` | Lint                                                   |
| `pnpm i18n:check`             | Verifica paridad de claves entre `es.json` y `en.json` |
| `pnpm i18n:audit-identical`   | Detecta traducciones idénticas en ambos idiomas        |
| `pnpm db:generate`            | Genera migración tras cambios en el esquema            |
| `pnpm db:migrate`             | Aplica migraciones pendientes                          |
| `pnpm db:studio`              | Abre Drizzle Studio                                    |
| `pnpm db:seed`                | Carga datos de prueba                                  |

## Servicios locales

| Servicio     | URL                                   |
| ------------ | ------------------------------------- |
| Aplicación   | `http://localhost:3000`               |
| Health check | `http://localhost:3000/health`        |
| Adminer      | `http://localhost:8088` (por defecto) |
| Mailpit web  | `http://localhost:8025` (por defecto) |
| Mailpit SMTP | `localhost:1025` (por defecto)        |

## Estructura principal

- `app/` componentes, layouts, páginas y composables
- `server/api/` endpoints públicos y de administración
- `server/middleware/` middleware del servidor
- `server/utils/` utilidades compartidas
- `server/db/` cliente y esquema de Drizzle
- `i18n/locales/` mensajes de traducción
- `drizzle/` migraciones y seeds

## Deploy en producción

El build siempre ocurre en local o CI; el VPS solo hace pull de la imagen y la ejecuta.

```sh
bash ./deploy.sh
```

El script construye la imagen, la publica en GHCR, conecta al VPS por SSH, aplica migraciones y recrea los contenedores.

Para el flujo completo (VPS, NGINX, TLS, migraciones, backups), consulta [`DEPLOYMENT.md`](./DEPLOYMENT.md).

### Prueba local del stack de producción

Para validar cómo queda la web desplegada sin necesitar un VPS, usa el stack local con NGINX:

```sh
bash ./deploy-local.sh
```

Comandos útiles:

```sh
bash ./deploy-local.sh status
bash ./deploy-local.sh logs [app|nginx|postgres|redis|mailpit|all]
bash ./deploy-local.sh doctor [/ruta/publica.webp]
bash ./deploy-local.sh down
pnpm cache:purge
```

El stack exporta `NODE_OPTIONS=--enable-source-maps --trace-uncaught` por defecto para que los errores del contenedor `app` sean más útiles en modo producción local. Puedes sobreescribirlo con `LOCAL_DEPLOY_NODE_OPTIONS=...` en `.env.local-deploy`.
