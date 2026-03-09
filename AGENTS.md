# CREUP Web — Agent Instructions

## Project Overview

This repository contains the public website for **CREUP** (Coordinadora de Representantes de Estudiantes de Universidades Públicas).

Goals:
- A fast, accessible, SEO-friendly public site.
- A small admin area to manage content shown on the pages (carousel, featured news, featured links, tags).
- A localization strategy that is **Spanish-first**, but scalable to more languages.

---

## Tech Stack

- **Framework:** Nuxt 4 (SSR/SSG capable) + Nitro server routes.
- **UI:** Nuxt UI v4 + Tailwind CSS.
- **i18n:** `@nuxtjs/i18n` (JSON message files).
- **SEO & a11y:** `@nuxtjs/seo` + `@nuxt/a11y`.
- **Database:** PostgreSQL + Drizzle ORM.
- **Auth (admin):** `better-auth` (Google OAuth), backed by Drizzle.
- **Icons:** `@iconify-json/circle-flags` for country flags, `@iconify-json/tabler` for UI icons.

---

## Repository Structure (High-level)

- `app/` — Vue components, layouts, pages, composables.
- `server/api/` — Nitro route handlers (public + admin endpoints).
- `server/middleware/` — Server middleware (e.g., locale resolution).
- `server/utils/` — Shared server helpers (auth, validation).
- `server/db/` — Drizzle ORM schema and database client.
- `i18n/locales/` — Translation message files.
- `drizzle/` — Drizzle migrations and seed scripts.

---

## Language & Content Rules (Mandatory)

### Code vs UI Text

- **All code and code comments MUST be written in English** across the entire repo.
- **Admin UI text MUST be Spanish** (everything under `app/pages/admin/`, `app/layouts/admin.vue`, and admin-related components). This includes:
  - Labels, buttons, headings, empty states, toast messages, and error copy.
  - API error messages that are shown directly to admins.

### Public Site i18n (Mandatory)

- The public site MUST use Nuxt i18n for all user-facing text.
- Supported languages (current):
  - **Spanish (`es`)**: default and **fallback**.
  - **English (`en`)**: secondary.
- The solution MUST remain scalable to additional languages:
  - Avoid hard-coded locale enums in business logic.
  - Keep locale validation flexible (string-based) and rely on configuration.
  - Ensure data models and UI patterns can add locales without rewriting features.

### Database-localized content

Content managed in the database uses translation tables (e.g., `*Translation` models with `locale`).
- **Spanish translation is required**.
- If a requested locale is missing, **fallback to Spanish**.

---

## Engineering Principles

### Keep It Simple

- Prefer the simplest working solution.
- Do not add abstractions, libraries, or patterns unless they are clearly needed.
- Avoid premature generalization; keep changes minimal and readable.

### UI: Prefer Nuxt UI

- Use Nuxt UI components whenever possible instead of custom UI.
- Never use browser `alert()` dialogs. Use a Nuxt UI modal/dialog component instead.
- Do not use `UBadge` with `size="xs"` because it is too small. Use `size="sm"` instead.
- Tailwind is allowed for layout and minor styling, but avoid building custom component libraries.
- Prefer consistent UI patterns already present in the project.
- Use the Nuxt UI theme system for colors, typography, and spacing.

### Accessibility (Must-have)

This site must be accessible.
- Use semantic HTML first (`header`, `nav`, `main`, `section`, `button`, etc.).
- All interactive elements must be keyboard accessible with clear focus states.
- Provide meaningful `alt` text for images; decorative images should use empty `alt`.
- Use ARIA only when necessary; keep labels accurate (`aria-label`, `aria-expanded`, etc.).
- Ensure readable color contrast and avoid conveying meaning by color alone.

### Data Validation (Mandatory)

- **All untrusted data MUST be validated with Zod**.
  - This includes request bodies, query params, route params, and any data that can be modified outside the current runtime.
  - Prefer using shared schemas and helpers in `server/utils/validation.ts`.
  - Never assume the client or the database contains valid data.

---

## Server/API Conventions

### Keep Route Handlers Small

`server/api/**` files should primarily:
- Read params/query/body.
- Validate input (Zod in `server/utils/validation.ts`).
- Enforce auth for admin endpoints (`server/utils/requireAuth.ts`).
- Perform data access through Drizzle ORM (`server/db/index.ts`).
- Return a small, stable JSON payload.

If a handler becomes hard to read or grows too large, extract helpers into `server/utils/`.

### Locale Handling (Server)

- Locale is resolved by server middleware and should be read from `event.context.requestLocale`.
- When selecting translations, always fallback to Spanish (`es`) when the requested locale is missing.

### Error Handling

- Use `createError` with correct `statusCode`.
- Admin-visible error messages should be Spanish.
- Public endpoints should avoid leaking internal error details.

---

## Database & Drizzle ORM

- Drizzle schema lives in `server/db/schema.ts`.
- Migrations live under `drizzle/`.
- When adding localized fields, follow the existing pattern of translation tables with `locale`.

---

## Development Workflow

Common commands:
- `pnpm dev` — run locally.
- `pnpm build` / `pnpm preview` — production build & preview.
- `pnpm lint` / `pnpm lint:fix` — lint and auto-fix.

When changing DB schema:
- Update `server/db/schema.ts`.
- Run `pnpm db:generate` to generate migrations.
- Run `pnpm db:migrate` to apply migrations.
- Run `pnpm db:seed` to seed the database.

---

## Commit Guidelines

Follow Conventional Commits:

```
feat: add scheduled publication for news
fix: correct timezone handling in calendar fetch
docs: add API usage examples for admin endpoints
chore(deps): upgrade nuxt and tailwind to latest patch
refactor: extract calendar logic to composable
perf: improve home page load by lazy-loading images
test: add unit tests for tags composable
ci: add workflow to run lint and tests on push
```

---

## Pull Request / Change Checklist

- UI uses Nuxt UI components where applicable.
- Admin UI text is Spanish; public UI text uses Nuxt i18n.
- Spanish remains default and fallback.
- Added/updated translations in `i18n/locales/es.json` and `i18n/locales/en.json` (and any new locales).
- Accessibility verified (keyboard navigation, labels, alt text, contrast).
- Lint passes (`pnpm lint`).
