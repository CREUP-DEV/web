# CREUP Web — Agent Instructions

## Project Overview

This repository contains the public website for **CREUP** (Coordinadora de Representantes de Estudiantes de Universidades Públicas).

Goals:
- A fast, accessible, SEO-friendly public site.
- A compact admin area to manage the public content shown on the site.
- A localization strategy that is **Spanish-first**, but scalable to additional languages without rewrites.

Current admin scope includes:
- Access control for admins.
- Home carousel.
- "Qué es CREUP" hero content.
- Equality documents.
- Newsletter issues and subscribers.
- Press articles, press dossier, tags, and media outlets.
- Featured links.
- Financial reports.

---

## Tech Stack

- **Framework:** Nuxt 4 + Nitro server routes.
- **UI:** Nuxt UI v4 + Tailwind CSS.
- **i18n:** `@nuxtjs/i18n` (JSON message files).
- **SEO & a11y:** `@nuxtjs/seo` + `@nuxt/a11y`.
- **Database:** PostgreSQL + Drizzle ORM.
- **Auth (admin):** `better-auth` (Google OAuth), backed by Drizzle.
- **Icons:** `@iconify-json/circle-flags` and `@iconify-json/tabler`.

---

## Repository Structure

- `app/` — Vue components, layouts, pages, composables.
- `server/api/` — Public and admin Nitro route handlers.
- `server/middleware/` — Server middleware such as locale and admin auth.
- `server/utils/` — Shared server helpers.
- `server/db/` — Drizzle schema and database client.
- `i18n/locales/` — Public translation message files.
- `drizzle/` — Drizzle migrations and seed scripts.
- `shared/` — Runtime-safe shared constants and locale helpers.

---

## Language & Content Rules

### Code vs UI Text

- **All code and code comments MUST be written in English**.
- **Admin UI text MUST be Spanish** across admin pages, layouts, components, and admin-facing API error messages.

### Public Site i18n

- All public user-facing text MUST go through Nuxt i18n or locale-aware content selection.
- Supported locales today:
  - **Spanish (`es`)**: default and fallback.
  - **English (`en`)**: secondary.
- The implementation MUST stay scalable:
  - Do not hard-code binary `es/en` branching in business logic.
  - Resolve locales through shared helpers (`shared/utils/locale.ts`, `app/composables/useLocales.ts`, `server/utils/requestLocale.ts`).
  - When a locale-specific resource is missing, fallback to Spanish.

### Public Copy Outside JSON Messages

- Static public legal content, database translations, and public API messages must still resolve through the current locale plus Spanish fallback.
- If a feature cannot yet ship localized content for every locale, the fallback behavior must be explicit and stable.

### Emails

- Admin-facing and transactional emails currently remain **Spanish-only by design**.
- Do not introduce locale branching for email copy unless the feature explicitly requires localized email templates.

### Database-localized Content

- Localized database content uses translation tables (`*Translation` with `locale`).
- The translation for the configured default locale is required.
- Public reads must fallback to Spanish when a requested locale is missing.
- Use shared locale/default-locale helpers instead of scattering raw `'es'` checks.

---

## Engineering Principles

### Keep It Simple

- Prefer the simplest working solution.
- Avoid abstractions unless they clearly reduce duplication or risk.
- Keep changes minimal, readable, and easy to maintain.

### UI: Prefer Nuxt UI

- Use Nuxt UI components whenever possible.
- Never use browser `alert()` dialogs.
- Do not use `UBadge` with `size="xs"`.
- Use Tailwind for layout and small adjustments, not for building a parallel component library.
- Reuse shared admin definitions/patterns when the same sections or behaviors appear in multiple places.

### Accessibility

- Use semantic HTML first.
- Keep interactive elements keyboard accessible with visible focus states.
- Provide meaningful `alt` text where needed.
- Use ARIA only when necessary and keep labels accurate.

### Validation

- **All untrusted data MUST be validated with Zod**.
- This includes request bodies, query params, route params, multipart form fields, and uploaded file metadata.
- Prefer shared validation helpers in `server/utils/validation.ts`.

### Security

- Any admin-authored rich text that is rendered publicly must be sanitized with a strict allowlist before storage and before rendering.
- Do not expose raw untrusted HTML through `v-html`.
- Public endpoints must avoid leaking internal implementation details.
- Production assumes Nitro runs behind NGINX (or an equivalent trusted reverse proxy) that overwrites `x-forwarded-for`.
- Uploaded admin assets stored under `.data/admin-assets/` and `public/` are operational data and must be backed up outside Git.

---

## Server/API Conventions

### Keep Route Handlers Small

`server/api/**` files should primarily:
- Read params, query, and body.
- Validate input.
- Enforce auth where needed.
- Perform data access through Drizzle.
- Return a small, stable JSON payload.

If a handler becomes hard to read, extract helpers into `server/utils/`.

### Admin Auth

- `/api/admin/**` is protected globally by `server/middleware/admin-auth.ts`.
- `requireAuth(event)` is still the shared way to obtain the verified session inside handlers.
- The middleware and helper cache the session on `event.context.adminSession`; do not re-implement auth checks per route.
- **Authorization model**: Google OAuth controls who can authenticate (only accounts that pass Google's flow). Authorization (who may access the admin area) is controlled by two complementary mechanisms:
  1. `ADMIN_EMAILS` env var — a comma-separated list of emails that always have access, regardless of DB state.
  2. `admin_access` DB table — additional emails granted access by existing admins at runtime.
- There is no email domain allowlist. Do not re-introduce `ADMIN_EMAIL_DOMAIN` or similar domain-based checks.

### Locale Handling

- Server locale is read from `event.context.requestLocale`.
- Resolve request locale through shared helpers and always keep Spanish fallback behavior.

### Error Handling

- Use `createError` with the correct `statusCode`.
- Admin-visible messages should be Spanish.
- Public messages should stay generic and safe.

---

## Database & Drizzle

- Drizzle schema lives in `server/db/schema.ts`.
- Migrations live under `drizzle/`.
- When adding localized content, follow the existing translation-table pattern.

---

## Development Workflow

Common commands:
- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`

When changing DB schema:
1. Update `server/db/schema.ts`.
2. Generate migrations.
3. Apply migrations.
4. Update seeds if needed.

---

## Commit Guidelines

Follow Conventional Commits:

```text
feat: add scheduled publication for news
fix: correct timezone handling in calendar fetch
docs: update admin setup documentation
refactor: extract localized content helpers
perf: reduce admin dashboard SSR requests
test: add coverage for validation helpers
ci: run lint and tests on push
```

---

## Pull Request / Change Checklist

- Public UI text uses i18n or locale-aware fallback logic.
- Admin UI text is Spanish.
- Spanish remains the default and fallback locale.
- Default-locale database translations remain required.
- Rich text rendered publicly is sanitized.
- Admin auth still relies on the global middleware path.
- No `ADMIN_EMAIL_DOMAIN` or domain-based access checks were introduced.
- Added or updated translations when public copy changed.
- Accessibility was verified.
- Lint passes (`pnpm lint`).
