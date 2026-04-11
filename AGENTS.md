# CREUP Web — Agent Instructions

## Project Overview

Repository contains the public website for **CREUP** (Coordinadora de Representantes de Estudiantes de Universidades Públicas).

Goals:

- Fast, accessible, SEO-friendly public site.
- Compact admin area to manage public content shown on the site.
- Spanish-first localization strategy, scalable to additional languages without rewrites.

Current admin scope: access control, home carousel, "Qué es CREUP" hero, equality documents, newsletter issues and subscribers, press articles, press dossier, tags, media outlets, featured links, financial reports.

---

## Tech Stack

- **Framework:** Nuxt 4 + Nitro server routes
- **UI:** Nuxt UI v4 + Tailwind CSS
- **i18n:** `@nuxtjs/i18n` (JSON message files) + `@nuxtjs/seo`
- **Accessibility:** `@nuxt/a11y`
- **Database:** PostgreSQL + Drizzle ORM
- **Auth (admin):** `better-auth` (Google OAuth), backed by Drizzle
- **Icons:** `@iconify-json/circle-flags` and `@iconify-json/tabler`
- **Concurrency:** `p-limit` (newsletter batch sends)

---

## Repository Structure

```
app/
  components/       Vue components (admin/, home/, press/, members/, team/, events/)
  composables/      Shared Vue composables
  pages/            Route pages (admin/, conocenos/, prensa/, transparencia/, etc.)
  layouts/          default.vue + admin.vue
  middleware/       admin-auth.global.ts
server/
  api/              Nitro route handlers (admin/** protected, public routes)
  handlers/         admin-auth.ts (global admin middleware)
  middleware/       locale.ts
  plugins/          newsletter-delivery.ts, admin-asset-publication.ts
  routes/           Non-API server routes (health.ts, asset proxy routes)
  services/         pressArticleService.ts (complex mutations)
  utils/            All server helpers — see Key Helpers section below
  db/               schema.ts, index.ts (Drizzle client)
shared/
  utils/            locale.ts, date.ts, config.ts, apiError.ts, adminSchemas.ts
  constants/        assetPaths.ts, pressTypes.ts
i18n/locales/       es.json, en.json
drizzle/            Migrations and seed scripts
```

---

## Language & Content Rules

### Code vs UI Text

- **All code and code comments MUST be written in English**.
- **Admin UI text MUST be Spanish** — admin pages, layouts, components, admin-facing API error messages.

### Public Site i18n

- All public user-facing text MUST go through Nuxt i18n or locale-aware content selection.
- Supported locales: **`es`** (default, fallback) and **`en`** (secondary).
- **Do not hard-code binary `es/en` branching** in business logic.
- Resolve locales through shared helpers — see Locale Helpers section.
- When locale-specific resource is missing, fall back to Spanish.

### Emails

- All transactional and admin emails remain **Spanish-only by design**.
- Do not introduce locale branching for email copy unless explicitly required.

### Database-localized Content

- Localized DB content uses translation tables (`*Translations` with `locale` column).
- Translation for default locale (`es`) is required.
- Public reads must fall back to Spanish when requested locale is missing.
- Use shared locale helpers — never scatter raw `'es'` string checks.

---

## Key Helpers — Use These, Do Not Reinvent

### Locale Resolution (`shared/utils/locale.ts`)

```typescript
// Resolve a raw locale string (e.g. 'en-GB', 'es', 'fr') to a supported code:
resolveLocaleCode(input, locales, fallback)

// Strip region subtag (e.g. 'en-GB' → 'en'):
getBaseLanguage(value)

// Pick the right translation entry from an array:
pickLocalizedEntry(entries, locale, locales, fallbackCode)

// Pick a value from a locale-keyed object:
pickLocalizedValue(values, locale, fallbackLocale, defaultCode)

// Build hreflang alternates for a path:
buildLocalizedAlternates(path, locales, defaultLocale)
```

### Request Locale (`server/utils/requestLocale.ts`)

```typescript
// Get locale from the current request context (set by server/middleware/locale.ts):
const { locale, fallbackLocale } = getRequestLocaleContext(event)
```

### Public API Error Messages (`server/utils/apiErrorMessages.ts`)

All locale-aware public error messages live here. **Do not inline Spanish/English error strings in public route handlers.** Add a key and use:

```typescript
// Returns the right-locale message for the request:
getPublicApiErrorMessage(event, 'articleNotFound')
```

Admin-facing error messages may be hardcoded Spanish strings (they are not locale-switched).

### Client-side API Error Messages (`shared/utils/apiError.ts`)

```typescript
// Extracts server's actual error message from a $fetch error, with fallback:
getApiErrorMessage(error, 'Fallback message')
```

Use this in all admin form catch blocks instead of hardcoded strings.

### Rate Limiting (`server/utils/rateLimit.ts`)

In-process, per-IP rate limiter. Use for all public mutation endpoints:

```typescript
enforceRateLimit(event, {
  namespace: 'my-endpoint', // unique string per endpoint
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  errorMessage: 'Demasiados intentos.',
})
```

**Note:** Store is process-local and clears on restart. Adequate for low-volume public forms; not suitable for multi-instance deployments without a Redis backend.

### Validation (`server/utils/validation.ts`)

**All untrusted input MUST be validated with Zod.** Use existing helpers:

```typescript
validateBody(schema, await readBody(event))
validateQuery(event, schema)
validateRouteParams(event, schema)
validateMultipartFile(formData)
```

Reuse existing schemas. Add new schemas to `server/utils/validation.ts`. Shared admin schemas (used by both server and client) go in `shared/utils/adminSchemas.ts`.

### Admin Image Upload (`server/utils/adminImageUpload.ts`)

```typescript
// Process and store an image (raster → WebP, SVG sanitized):
await saveAdminImage({ data, filename, uploadDir, publicPath, maxFileSizeBytes, slug, temporary })
// temporary=true → stores in .data/admin-assets/tmp/, returns a temp storagePath
// temporary=false → writes directly to uploadDir

// After DB record is saved, finalize (move temp → public or inactive):
finalizeAdminImage({ storagePath, uploadDir, publicPath, slug, publish, replaceStoragePath })
```

### Admin Document Upload (`server/utils/adminDocumentUpload.ts`)

```typescript
// Validate and store a PDF:
await saveAdminDocument({
  data,
  filename,
  uploadDir,
  publicPath,
  allowedExtensions,
  maxFileSizeBytes,
})
// Always returns a temp storagePath

finalizeAdminDocument({ storagePath, uploadDir, publicPath, slug, publish, replaceStoragePath })
```

### Admin Asset Lifecycle (temp → finalize)

This is the standard pattern for ALL admin file uploads. Never write files directly to `public/`:

1. Upload endpoint calls `saveAdminImage` or `saveAdminDocument` with `temporary: true` → returns a `storagePath` under `/api/admin/assets/tmp/`.
2. On create/update mutation, call `finalizeAdminImage` / `finalizeAdminDocument` inside the DB transaction. Pass `publish: data.active` so inactive records move to `/api/admin/assets/inactive/` instead of `public/`.
3. On publish/unpublish toggle, the asset publication plugin (`server/plugins/admin-asset-publication.ts`) handles moving assets between inactive and public directories.
4. On failure, call `cleanupAdminAssetFinalizationsSafely(cleanupTargets, ...)` to roll back moved files.
5. Track finalization with `trackAdminAssetFinalization(cleanupTargets, ...)`.

See `server/services/pressArticleService.ts` for a full working example.

### Rich Text Sanitization (`server/utils/pressTranslation.ts`)

Admin-authored rich text stored in the DB **must be sanitized before storage AND before public rendering**. Use the server-side sanitizer:

```typescript
sanitizeRichTextHtml(value) // returns cleaned HTML or null
hasMeaningfulRichTextHtml(value) // returns boolean
```

Allowed tags: `a, blockquote, br, em, h2, h3, li, ol, p, strong, ul`.
Allowed protocols in links: `http:`, `https:`, `mailto:`, `tel:`.
External links (`target="_blank"`) automatically get `rel="noopener noreferrer"`.

**Never use `v-html` with unsanitized content.** The `PressRichText` component handles safe rendering.

### SVG Sanitization (`server/utils/adminImageUpload.ts`)

SVGs uploaded by admins go through a two-stage sanitizer:

1. DOMPurify with `USE_PROFILES: { svg: true }` + blocklist (`script`, `foreignobject`, `iframe`, etc.)
2. Custom attribute scanner blocking external references in `href`, `src`, `style`, `fill`, `filter`.

Max file size (5 MB) is enforced before sanitization runs. Do not bypass this for SVG inputs.

### External API Cache (`server/utils/externalApiCache.ts`)

Stale-while-revalidate cache for external API calls. Avoids hammering external dependencies:

```typescript
await withExternalApiSWRCache(
  'cache-key',
  () => fetchSomething(),
  getExternalApiCacheOptions(event)
)
```

Cache is in-process LRU (max 500 entries, evicts by last-access time via Map ordering).

### Newsletter Delivery (`server/utils/newsletters.ts`)

- Delivery state machine: `queued → sending → sent | failed`
- Worker token claimed atomically via DB UPDATE with stale-heartbeat check — safe for concurrent instances
- Batches claimed with `SELECT ... FOR UPDATE SKIP LOCKED` — no duplicate sends
- Sends run in parallel with `p-limit(5)` concurrency per batch
- Subscribers with ≥ 3 total failed deliveries are auto-deactivated (`deactivateSubscriberOnBounce`)
- Stale `sending` rows (older than 2 min) are reset to `queued` on next batch claim
- Startup recovery runs immediately via `server/plugins/newsletter-delivery.ts`

Do not bypass the worker token system when triggering newsletter sends. Use `sendNewsletterById` or `claimNewsletterForSending`.

### Optimistic Locking (Admin Mutations)

Press article updates include an `updatedAt` timestamp sent from the client. The server rejects with `409` if the DB row was modified by another admin since the client last fetched:

```typescript
if (data.updatedAt) {
  const clientTs = new Date(data.updatedAt).getTime()
  const serverTs = existingItem.updatedAt ? new Date(existingItem.updatedAt).getTime() : 0
  if (clientTs !== serverTs) {
    throw createError({
      statusCode: 409,
      message: 'El artículo fue modificado por otro usuario...',
    })
  }
}
```

Follow this pattern when adding optimistic locking to other resources. The `updatedAt` field in the DB schema is set automatically via `.$onUpdate(() => new Date())`.

---

## Frontend Composables — Use These, Do Not Reinvent

### Admin Collection State (`app/composables/useAdminCollectionState.ts`)

Manages create/edit modal state, delete confirmation, and drag-to-reorder for any list-based admin resource:

```typescript
const {
  openCreate,
  openEdit,
  closeModal,
  confirmDelete,
  closeDeleteModal,
  editingItem,
  showModal,
  showDeleteModal,
  itemToDelete,
  localItems,
  hasOrderChanges,
  isSavingOrder,
  listRef,
  cancelOrderChanges,
  persistOrder,
} = useAdminCollectionState({ items, persistOrder, prepareCreate, prepareEdit })
```

Use this for any admin page with a list + create/edit modal pattern.

### Admin File Upload (`app/composables/useAdminFileUpload.ts`)

Handles file picker, upload POST, preview, and error toasts:

```typescript
const { inputRef, preview, isUploading, triggerFileDialog, handleFileSelect } = useAdminFileUpload({
  endpoint: '/api/admin/press/upload',
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    form.image = storagePath
  },
  getFallbackPreview: () => form.image || null,
})
```

### Zod Form Validation (`app/composables/useZodFormValidation.ts`)

Client-side Zod validation with per-field error display:

```typescript
const { validate, getFieldError, clearErrors } = useZodFormValidation()

// In submit handler:
if (!validate(mySchema, payload)) return
```

### Locale Composables (`app/composables/useLocales.ts`)

```typescript
const {
  locales,
  defaultLocale,
  isDefaultLocale,
  getLocaleFlag,
  getLocaleName,
  createEmptyTranslations,
  mapTranslationsToForm,
  filterNonEmptyTranslations,
} = useLocales()
```

Use `createEmptyTranslations` to initialize form translation arrays. Use `filterNonEmptyTranslations(array, 'title')` before submitting — strips empty optional-locale entries.

---

## Server/API Conventions

### Route Handler Size

`server/api/**` files should primarily:

- Parse params, query, body
- Validate input (always via Zod helpers)
- Enforce auth if needed
- Call a utility or perform a DB query
- Return a small, stable JSON payload

If handler exceeds ~50 lines of logic, extract to `server/utils/` or `server/services/`.

### Response Envelopes

- New JSON endpoints should prefer a consistent envelope shape: `{ data }` for single resources and `{ data, meta }` for lists or paginated results.
- Keep existing endpoint payload shapes stable; adopt envelope constructors in the handler when introducing or migrating endpoints gradually.
- Do not mass-change existing endpoint payloads just to match the convention; keep payload churn isolated and safe.

### Admin Auth

- `/api/admin/**` protected globally by `server/handlers/admin-auth.ts` (configured in `nuxt.config.ts`).
- `requireAuth(event)` returns the verified session inside handlers — do not re-check auth per route.
- Session cached on `event.context.adminSession`.
- **Authorization**: `ADMIN_EMAILS` env var (comma/whitespace separated) always grants access. `admin_access` DB table grants additional access at runtime.
- No email domain allowlist. Do not re-introduce domain-based checks.

### Upload Handlers

Every upload handler must:

1. Require `Content-Length` and reject with `411` if it is missing/invalid; reject with `413` if it exceeds the route cap (before reading body).
2. Call `saveAdminImage` or `saveAdminDocument` — never write files directly.
3. Return the `storagePath` for the frontend to pass back during create/update.

Production deployments should also enforce the outer body-size limit at the reverse proxy (NGINX `client_max_body_size` or equivalent). App-level checks are defense in depth, not the primary protection.

See `server/api/admin/press/upload.post.ts` for reference.

### Error Handling

- Use `createError({ statusCode, message })` — never throw plain errors in handlers.
- Public endpoint errors: use `getPublicApiErrorMessage(event, key)`.
- Admin endpoint errors: Spanish strings are acceptable. Complex admin resources may use `throwAdminMutationError`.
- 409 Conflict for optimistic locking violations.
- 413 for oversized uploads.
- 429 for rate limit violations (thrown automatically by `enforceRateLimit`).

### Health Check

`GET /health` — checks DB connectivity and external API reachability, returns `{ status: 'ok' | 'degraded' | 'error', timestamp, checks }` with 200/503. Rejects requests that carry an `X-Forwarded-For` header (404) so only direct health checks reach it.

---

## Database & Drizzle

### Schema Conventions

- All tables use CUID2 as primary key (`text('id').primaryKey().$defaultFn(cuid)`).
- `createdAt` + `updatedAt` on every mutable table. `updatedAt` uses `.$onUpdate(() => new Date())`.
- Locale columns always have a CHECK constraint against `SUPPORTED_LOCALE_CODES`.
- Localized content uses a separate translation table, never JSON columns.
- Unique constraint on `(locale, parentId)` in all translation tables.

### Translation Table Pattern

```typescript
// Parent table
export const widgets = pgTable('widgets', { id, ..., updatedAt })

// Translation table
export const widgetTranslations = pgTable('widget_translations', {
  id,
  locale,
  name,
  createdAt,
  updatedAt,
  widgetId,
}, (t) => [
  unique().on(t.locale, t.widgetId),
  check('widget_translations_locale_check', buildSupportedLocaleCheck(t.locale)),
  index('idx_widget_translations_widget_id').on(t.widgetId),
])
```

### JSONB Shape Validation

- `organization_members.socials` is stored as JSONB and does not have a DB-level shape CHECK.
- Shape is validated at the app boundary via Zod schemas before write operations.
- Treat this as an accepted tradeoff for JSONB flexibility unless explicit DB constraints are required.

### Migration Workflow

1. Edit `server/db/schema.ts`.
2. `pnpm db:generate` — creates migration file under `drizzle/`.
3. `pnpm db:migrate` — applies migrations.
4. `pnpm db:seed` — if seed data needs updating.

Never edit existing migration files.

### i18n Key Parity

Run `pnpm i18n:check` to verify that `en.json` has identical leaf keys to the base `es.json`. This script fails with a non-zero exit code if keys diverge. Add it to CI to catch parity regressions early.

---

## SEO & i18n Conventions

### hreflang on Detail Pages

The default layout injects hreflang alternates for all configured locales via `useLocaleHead`. But if a detail page's content only exists in one locale, the other-locale URL would return fallback content with a valid hreflang pointing to it — which confuses search engines.

Pattern for locale-dependent detail pages:

1. Include `translatedLocales: string[]` in the API response (list of locales that have real translations).
2. Compute `hasNativeTranslation` by checking if current locale's base code is in `translatedLocales`.
3. If false: inject `<meta name="robots" content="noindex,follow">` and override layout hreflang with only the locales that have real content.

See `app/pages/prensa/comunicados/[slug].vue` for full reference implementation.

### Public Page SEO

- `useSeoMeta` for title, description, og:image.
- `useI18n().t(...)` for all static copy.
- Canonical URLs handled automatically by `@nuxtjs/seo`.

---

## Skeleton Loaders & Error States

Every page/section that loads async data must have:

1. `v-if="pending"` — skeleton block using `USkeleton` components, matching the layout of real content.
2. `v-else-if="error"` — `UAlert` or text error message.
3. `v-else` — actual content.

`PublicAgenda.vue` and `app/pages/conocenos/equipo/index.vue` are reference implementations. Do not show empty states during loading — always use skeletons to prevent layout shift.

---

## Admin UI Patterns

### Form Mutations (Modal-based)

Pattern used across links, media, carousel, tags, etc.:

```
submit → call $fetch → on success: toast.add({ color: 'success' }) + closeModal() + refresh()
                      on error: toast.add({ title: getApiErrorMessage(e, fallback), color: 'error' })
```

Never redirect from a modal form. Use `closeModal()` + `refresh()` instead.

### Form Mutations (Full-page edit)

Pattern used by press article edit:

```
submit → call $fetch → on success: toast.add({ color: 'success' }) + router.push('/admin/...')
                      on 409: toast.add({ color: 'warning', specific conflict message })
                      on other error: toast.add({ title: getApiErrorMessage(e, fallback), color: 'error' })
```

### Passing `updatedAt` for Optimistic Locking

When a full-page edit page supports optimistic locking, always include `updatedAt` from the loaded record in the submit payload:

```typescript
await $fetch(`/api/admin/resource/${id}`, {
  method: 'PUT',
  body: { ...payload, updatedAt: record.value?.updatedAt },
})
```

### Never Use `alert()`

Use `toast.add(...)` from `useToast()` for all user feedback.

---

## Engineering Principles

### Do Not Repeat Logic

Before writing a new utility, check `server/utils/`, `shared/utils/`, and `app/composables/`. The codebase has helpers for: locale resolution, file upload, rich text sanitization, rate limiting, validation, error messages, admin collection state, form validation, file preview, and more.

### Import Aliases

- Use `@/` for app-layer imports (`app/**` composables, components, types, pages).
- Use `~~/` for root/shared imports (`shared/**`, root-level paths, other cross-layer imports).
- Do not add new `~/` app-layer imports.

### Keep Related Files Updated

When you change code, review the related files that describe, constrain, or expose that behavior and update them in the same task when needed. This includes files such as `AGENTS.md`, `README.md`, i18n messages, migrations, schemas, config comments, and admin/public UI copy.

### Abstract When It Has Real Reuse

Extract to `server/utils/` when a handler exceeds ~50 lines of logic. Extract to a composable when the same stateful pattern appears in 2+ admin pages. Do not extract one-time code.

### Validation at Boundaries

Validate at HTTP boundary (request body, query, params, multipart files). Trust internal service calls and DB results after they've been through Drizzle + schema constraints. Do not add defensive re-validation inside utility functions that only receive already-validated data.

### Concurrency in Batches

For processing arrays of async tasks (email sends, file moves): use `Promise.allSettled` + `p-limit` to bound concurrency. Sequential `for...await` loops are acceptable only when each iteration depends on the previous result.

### Avoid Security Regressions

- All admin-authored HTML rendered publicly must go through `sanitizeRichTextHtml`.
- All uploaded SVGs must go through the SVG sanitizer in `saveAdminImage`.
- All public mutation endpoints need `enforceRateLimit`.
- Never expose raw stack traces or DB errors in public API responses.

---

## Commit Guidelines

Follow Conventional Commits:

```
feat: add scheduled publication for news
fix: correct timezone handling in calendar fetch
refactor: extract localized content helpers
perf: reduce admin dashboard SSR requests
```

---

## Pull Request Checklist

- Public UI text uses i18n or locale-aware fallback logic.
- Admin UI text is Spanish.
- Spanish remains default and fallback locale.
- Default-locale DB translations remain required.
- Rich text rendered publicly is sanitized.
- Admin auth still relies on global middleware path.
- No domain-based access checks introduced.
- Translations added/updated when public copy changed.
- Skeleton loaders and error states present for async sections.
- Accessibility verified (semantic HTML, keyboard nav, `alt` text).
- Lint passes (`pnpm lint:fix`).
- i18n key parity verified (`pnpm i18n:check`).
- If DB schema changed: migration generated and applied.
