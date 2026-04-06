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
- `better-auth` con Google OAuth para el admin

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
- Adminer: `http://localhost:8080` por defecto
- Mailpit web: `http://localhost:8025` por defecto
- Mailpit SMTP: `localhost:1025` por defecto

## Estructura principal

- `app/` — componentes, layouts, páginas y composables
- `server/api/` — endpoints públicos y de administración
- `server/middleware/` — middleware del servidor
- `server/utils/` — utilidades compartidas
- `server/db/` — cliente y esquema de Drizzle
- `i18n/locales/` — mensajes de traducción
- `drizzle/` — migraciones y seeds
