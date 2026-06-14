# CREUP Web — Agent Instructions

## Project Overview

Repository contains the public website for **CREUP** (Coordinadora de Representantes de Estudiantes de Universidades Públicas).

Goals:

- Fast, accessible, SEO-friendly public site.
- Compact admin area to manage public content shown on the site.
- Spanish-first localization strategy, scalable to additional languages without rewrites.

Current admin scope: access control, home carousel, "Qué es CREUP" hero, equality documents, newsletter issues and subscribers, press articles, optional per-type default press cover images (when an article has no hero image), press dossier, tags, media outlets, featured links, financial reports.

---

## Tech Stack

- **Framework:** Nuxt 4 + Nitro server routes
- **UI:** Nuxt UI v4 + Tailwind CSS
- **i18n:** `@nuxtjs/i18n` (JSON message files) + `@nuxtjs/seo`
- **Accessibility:** `@nuxt/a11y`
- **Security headers:** `nuxt-security` (CSP with nonce, HSTS, XFO, referrer policy, permissions policy; rate limiter disabled for `/_ipx/**`)
- **Database:** PostgreSQL + Drizzle ORM
- **Cache / Rate limiting:** Redis
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
  plugins/          background-jobs.ts, admin-asset-publication.ts, startup-config-validation.ts
  routes/           Non-API server routes (health.ts, asset proxy routes)
  services/         pressArticleService.ts, newsletterDeliveryService.ts (complex mutations)
  utils/            All server helpers — see Key Helpers section below
  db/               schema/ (table modules), index.ts (Drizzle client)
shared/
  utils/            locale.ts, date.ts, config.ts, apiError.ts, adminSchemas.ts
  constants/        assetPaths.ts, pressTypes.ts
i18n/locales/       es.json, en.json, ca.json, eu.json, gl.json, val.json
drizzle/            Migrations and seed scripts
```

---

## Language & Content Rules

### Code vs UI Text

- **All code and code comments MUST be written in English**.
- **Admin UI is bilingual** (`es` default + `en`), like the public site. New admin pages, layouts,
  components, and admin-facing API error messages MUST be locale-aware — no new hardcoded Spanish.
  (Migration in progress: some admin pages still hold Spanish literals pending the page-by-page
  rollout; convert them as you touch them.)

### Admin i18n (URL-prefix mechanism)

- Admin uses the **same `prefix_except_default` URL mechanism as the public site**: `/admin/...`
  for `es`, `/en/admin/...` for `en`. Locale persists via the URL — no cookie. Do **not** add
  `defineI18nRoute(false)` to admin pages.
- The switcher in `app/layouts/admin.vue` uses `useSwitchLocalePath()` + `navigateTo` (mirrors the
  public header). Admin nav links go through `useLocalePath()` so they keep the active prefix.
- `app/middleware/admin-auth.global.ts` strips the locale prefix before its `/admin` guard so both
  `/admin/...` and `/en/admin/...` are protected; the login redirect goes through `localePath`.
  Both prefixes are excluded from indexing (`routeRules` + robots disallow).
- UI strings live under the `admin.*` i18n namespace (`admin.common.*` for shared actions,
  `admin.<page>.*` per page). The `x-request-locale` header is attached to `/api/admin/*` requests
  by `app/plugins/admin-fetch.client.ts` so the server resolves locale-aware error messages.

### Public Site i18n

- All public user-facing text MUST go through Nuxt i18n or locale-aware content selection.
- Supported locales: **`es`** (default, fallback) plus **`en`**, **`ca`**, **`eu`**, **`gl`**, **`val`** (Valencian; `code: 'val'`, hreflang `ca-ES-valencia`). Single-sourced in `LOCALE_DEFINITIONS` (`shared/constants/locales.ts`); adding one follows from that entry — never hard-code the locale list.
- **Do not hard-code binary `es/en` branching** in business logic.
- Resolve locales through shared helpers — see Locale Helpers section.
- When locale-specific resource is missing, fall back to Spanish.

### Emails

- All transactional and admin emails remain **Spanish-only by design**.
- Do not introduce locale branching for email copy unless explicitly required.

### Database-localized Content

- Localized DB content uses translation tables (`*Translations` with `locale` column).
- Translation for default locale (`es`) is required; public reads fall back to Spanish when the requested locale is missing.
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

### Request Locale (`server/utils/locale/requestLocale.ts`)

```typescript
// Get locale from the current request context (set by server/middleware/locale.ts):
const { locale, fallbackLocale } = getRequestLocaleContext(event)
```

### Public API Error Messages (`server/utils/locale/apiErrorMessages.ts`)

All locale-aware public error messages live here. Never inline Spanish/English strings in public route handlers — add a key and use:

```typescript
// Returns the right-locale message for the request:
getPublicApiErrorMessage(event, 'articleNotFound')
```

### Admin API Error Messages (`server/utils/locale/adminApiErrorMessages.ts`)

Admin server error messages are locale-aware (mirrors the public helper). Add a key and use:

```typescript
// Returns the right-locale admin message for the request:
getAdminApiErrorMessage(event, 'duplicateRecord')
```

`throwAdminMutationError(scope, error, event)` already resolves its messages through this helper —
pass `event` so the 409/500 envelopes localize. CRUD configs, handlers, `adminReorder`, the upload
handlers (`assertUploadedFileSize`/`assertUploadRequestSize` messages) and the asset/image pipelines
all resolve their copy through this map; thread `event` to any new throw site. Admin emails,
background-job/delivery error reasons, and deep raster-metadata edge messages stay Spanish-only.

### Client-side API Error Messages (`shared/utils/apiError.ts`)

```typescript
// Extracts server's actual error message from a $fetch error, with fallback:
getApiErrorMessage(error, 'Fallback message')
```

Use this in all admin form catch blocks instead of hardcoded strings.

### Rate Limiting (`server/utils/public/rateLimit.ts`)

Redis-backed, per-IP rate limiter. Use for all public mutation endpoints:

```typescript
await enforceRateLimit(event, {
  namespace: 'my-endpoint', // unique string per endpoint
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  errorMessage: 'Demasiados intentos.',
})
```

Redis is required. Limits survive restarts and apply across all Nitro instances via `NUXT_REDIS_URL`.

### Validation (`server/utils/validation/`)

**All untrusted input MUST be validated with Zod.** Use existing helpers (the admin body/input family
takes `event` first so the rejection message is locale-aware):

```typescript
validateBody(event, schema, await readBody(event))
validateQuery(event, schema)
validateRouteParams(event, schema)
validateMultipartFile(event, formData)
```

Reuse existing schemas. Add new schemas to the appropriate file under `server/utils/validation/`. **All admin zod schemas have a single definition in `shared/utils/adminSchemas.ts`** — import them directly from there (server handlers get the `validate*` helpers separately from the `server/utils/validation` barrel). Do not redefine an admin schema elsewhere.

**Validation messages are i18n keys (message-as-key).** Zod `message`s in `adminSchemas.ts` (and the
press client validator) are `admin.validation.*` keys, not literals — e.g.
`z.string().min(1, 'admin.validation.nameRequired')`. The client (`useFormValidation`) translates each
`issue.message` via `te(msg) ? t(msg) : msg` (known keys translate; stray literals pass through, never
hitting the vue-i18n compiler). The server `validateAdmin*` backstop does **not** echo per-field keys —
it returns a generic locale-aware `getAdminApiErrorMessage(event, 'invalidInput')`. So: add a new
`admin.validation.<key>` to `es.json` **and every other locale file** (`en`, `ca`, `eu`, `gl`, `val` — `pnpm i18n:check` enforces parity), then reference it from the schema.

Admin forms import these same zod schemas client-side and validate against them via `useFormValidation` (zod is shipped in the admin bundle, which is acceptable for the non-public panel). The one exception is the press article form: the server press schema validates rich text through a server-only sanitization helper, so it can't be single-sourced — its client validator lives co-located at `app/components/admin/pressArticleFormSchema.ts` (UX only; the server remains authoritative).

### Admin Image Upload (`server/utils/admin/adminImageUpload.ts`)

```typescript
// Process and store an image (raster → WebP, SVG sanitized):
await saveAdminImage({ data, filename, uploadDir, publicPath, maxFileSizeBytes, slug, temporary })
// temporary=true → stores in .data/admin-assets/tmp/, returns a temp storagePath
// temporary=false → writes directly to uploadDir

// After DB record is saved, finalize (move temp → public or inactive):
finalizeAdminImage({ storagePath, uploadDir, publicPath, slug, publish, replaceStoragePath })
```

### Admin Document Upload (`server/utils/admin/adminDocumentUpload.ts`)

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

### Asset-backed CRUD Factory (`server/utils/admin/defineAssetBackedTranslatableCrud.ts`)

For simple image/document-backed resources with optional translations, do NOT hand-write the create/update choreography. Call the factory instead — it owns the full sequence (validate → finalize asset + track → transaction: delete translations, optimistic-locked update, re-insert translations, refetch → conditional unused-asset cleanup → cache invalidation → catch: rollback finalizations + `throwAdminMutationError`).

```typescript
// server/utils/admin/crud/<resource>.ts
export const <resource>Crud = defineAssetBackedTranslatableCrud({
  schema: { create, update },          // shared Zod schemas
  validate,                            // optional post-schema assertion (e.g. required ES title)
  asset: {
    uploadDir, publicPath, fallbackBaseName,
    finalize: finalizeAdminDocument,   // optional; defaults to finalizeAdminImage
    getSource: (v) => v.image,         // incoming temp storagePath, or null
    deriveSlug, getPublish,            // optional
  },
  main: { table, idColumn, updatedAtColumn, buildValues, loadExisting, refetch },
  translations: { table, fkColumn, buildRows },  // omit for single-language resources
  invalidate, messages, scope,
})
// route files are one-liners:
// index.post.ts → export default <resource>Crud.createHandler
// [id].put.ts   → export default <resource>Crud.updateHandler
```

Config modules live in `server/utils/admin/crud/` (outside `server/api/` so Nitro does not route them). Used by carousel, links, equality, financial-reports, media. Returns `{ data }` envelopes. Document-backed resources pass `finalize: finalizeAdminDocument`; response shaping (e.g. date normalization) goes in `refetch`.

For collection reorder endpoints, use `reorderCollection(event, { table, idColumn, orderColumn, invalidate, scope })` from `server/utils/admin/adminReorder.ts` — it owns the validate → row-lock → `assertCompleteReorderSet` → bulk update → invalidate sequence inside a wrapped try/catch, so reorder failures return a normalized `{ message }` error instead of a raw 500. Each `reorder.post.ts` is a one-line call.

### Runtime-served Admin Assets

When adding a new admin-managed upload location under `public/`, verify how that public path is served in production. Files uploaded after Docker build are not automatically part of Nitro's generated `.output/public`.

For any new public asset base path used by admin uploads:

1. Add it to the appropriate shared asset path constants if it may be consumed by IPX or public URLs.
2. Add a matching `server/routes/**/[...path].ts` handler using the shared public asset helpers, unless an existing route already covers that base path.
3. Add or verify route rules needed for public asset delivery, such as disabling rate limiting for image proxy paths.
4. Add the matching bind mount / host directory setup anywhere production or local deployment persists uploads (`docker-compose*.yml`, `deploy.sh`, deployment docs, and related env examples when applicable). The container path must match the finalized public path under `/app/.output/public/...`.
5. Confirm the upload preview URL and the saved public URL both work after the record is persisted and after the app container is recreated.

### Rich Text Sanitization (`server/utils/press/pressTranslation.ts`)

Admin-authored rich text stored in the DB **must be sanitized before storage AND before public rendering**. Use the server-side sanitizer:

```typescript
sanitizeRichTextHtml(value) // returns cleaned HTML or null
hasMeaningfulRichTextHtml(value) // returns boolean
```

Allowed tags: `a, blockquote, br, em, h2, h3, li, ol, p, strong, ul`.
Allowed protocols in links: `http:`, `https:`, `mailto:`, `tel:`.
External links (`target="_blank"`) automatically get `rel="noopener noreferrer"`.

**Never use `v-html` with unsanitized content.** The `PressRichText` component handles safe rendering.

### SVG Sanitization (`server/utils/admin/adminImageUpload.ts`)

SVGs uploaded by admins go through a two-stage sanitizer:

1. DOMPurify with `USE_PROFILES: { svg: true }` + blocklist (`script`, `foreignobject`, `iframe`, etc.)
2. Custom attribute scanner blocking external references in `href`, `src`, `style`, `fill`, `filter`.

Max file size (5 MB) is enforced before sanitization runs.

### External API Cache (`server/utils/cache/externalApiCache.ts`)

Redis-backed stale-while-revalidate cache for external API calls. Avoids hammering external dependencies:

```typescript
await withExternalApiSWRCache(
  'cache-key',
  () => fetchSomething(),
  getExternalApiCacheOptions(event)
)
```

Cache is shared through Redis and coordinates refreshes with Redis locks so stale values can be served while one request refreshes upstream data.

### Newsletter Delivery (`server/services/newsletterDeliveryService.ts`)

- Delivery state machine: `queued → sending → sent | failed`
- Worker token claimed atomically via DB UPDATE with stale-heartbeat check — safe for concurrent instances
- Batches claimed with `SELECT ... FOR UPDATE SKIP LOCKED` — no duplicate sends
- Sends run in parallel with `p-limit(5)` concurrency per batch
- Subscribers with ≥ 3 total failed deliveries are auto-deactivated (`deactivateSubscriberOnBounce`)
- Stale `sending` rows (older than 2 min) are reset to `queued` on next batch claim
- Newsletter sending and maintenance scheduling run through BullMQ via `server/plugins/background-jobs.ts`

`server/utils/newsletters.ts` contains shared constants and month-key helper utilities used by delivery and API layers.

`server/plugins/background-jobs.ts` initializes schedulers with retry (`max 5` attempts, exponential backoff from `1s` up to `30s`) and re-triggers initialization on worker `ready` events when startup timing races occur.

Never bypass the worker token system — use `sendNewsletterById` or `claimNewsletterForSending`.

### Optimistic Locking (Admin Mutations)

Press article updates include an `updatedAt` timestamp sent from the client. The server rejects with `409` if the row was modified by another admin since the client last fetched:

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

Follow this pattern for any resource that adds optimistic locking. `updatedAt` is set automatically in the DB schema via `.$onUpdate(() => new Date())`.

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

### Admin Newsletters (`app/composables/admin/useAdminNewsletters.ts`)

Data + send/cancel layer for the newsletter admin list: owns the list fetch, the mutable collection (`items` + mutators), `maxDeliveryAttempts`, the `Newsletter` type and `toNewsletterListItem` normalizer, the manual-send and cancel flows (state + handlers), and the polling timer that refreshes while any newsletter is sending. The page keeps form/modal/submit/delete logic and reaches the collection mutators through this composable's return. Mirrors the per-resource pattern of `useAdminPress`.

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

### Zod Form Validation (`app/composables/useFormValidation.ts`)

Client-side Zod validation with per-field error display:

```typescript
const { validate, getFieldError, clearErrors } = useFormValidation()

// In submit handler:
if (!validate(mySchema, payload)) return
```

Use this pattern for admin forms and internal tooling flows — pass the shared zod schema from `shared/utils/adminSchemas.ts` directly (its `safeParse` plugs into `validate`). `validate` translates each issue message through `te()?t():literal`, so schema messages must be `admin.validation.*` i18n keys (see Validation). For **public** pages under strict CSP, keep Zod at the server boundary and use CSP-safe manual client checks for UX feedback instead of importing Zod into the public bundle.

Admin toasts: use `useAdminToast()` (not `useToast()`) — its `add()` auto-assigns a colored icon from the toast `color`. Wrap admin navigation targets in `useLocalePath()` so links keep the active `/en` prefix.

### Locale Composables (`app/composables/useLocales.ts`)

```typescript
const {
  availableLocales,
  localeConfigs,
  defaultLocale,
  fallbackLocale,
  isDefaultLocale,
  getLocaleConfig,
  getLocaleFlag,
  getLanguageTag,
  getLocaleName,
  getTranslation,
  getTranslationValue,
  getDefaultTranslation,
  getDefaultTranslationValue,
  createEmptyTranslations,
  mapTranslationsToForm,
  filterNonEmptyTranslations,
} = useLocales()
```

Use `createEmptyTranslations` to initialize form translation arrays. Use `filterNonEmptyTranslations(array, 'title')` before submitting — strips empty optional-locale entries.

### Paginated Content Transition (`app/composables/usePaginatedTransition.ts`)

Handles the loading/refreshing state split for paginated lists so skeleton only shows on initial load and existing content dims in-place on page change:

```typescript
const { resultsRef, isLoading, isRefreshing } = usePaginatedTransition(pending, items, error)
```

- `isLoading` — `true` only when `pending && items.length === 0 && !error` (first load, nothing to show yet)
- `isRefreshing` — `true` when `pending && items.length > 0` (page change, old items still visible)
- `resultsRef` — attach to the wrapper `div` to get smooth height animation when new page data arrives

Template pattern:

```html
<div ref="resultsRef" aria-live="polite" :aria-busy="pending || undefined">
  <div v-if="isLoading" aria-hidden="true"><!-- skeletons --></div>
  <div v-else-if="error"><!-- error state --></div>
  <div v-else-if="!items.length"><!-- empty state --></div>
  <TransitionGroup
    v-else
    :class="isRefreshing ? 'opacity-60 transition-opacity duration-200' : ''"
  ><!-- items --></TransitionGroup>
</div>
```

Use for any public page with a `useFetch` + `UPagination` list. **Do not re-implement inline** — see `PolicyDocumentList.vue` and `informes-economicos.vue` as reference.

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

- New JSON endpoints must use `{ data }` for single resources and `{ data, meta }` for lists or paginated results.
- Do not mass-change existing endpoint payloads in isolation — keep churn isolated to tasks that already touch those files.
- **Touch-and-clean rule:** when you modify an admin endpoint that still returns legacy duplicate keys (e.g. `{ data: item, item }` or `{ data: items, items, total, meta }`), remove the redundant top-level keys in the same change and update any frontend consumer in the same commit. This is the only safe migration path.
- Admin pages should read `data.value?.data` and `data.value?.meta`. Do not add new top-level aliases like `item`, `items`, or `total`.

### Admin Auth

- `/api/admin/**` protected globally by `server/handlers/admin-auth.ts` (configured in `nuxt.config.ts`).
- `requireAuth(event)` returns the verified session inside handlers — do not re-check auth per route.
- Session cached on `event.context.adminSession`.
- Better Auth cookie session cache is intentionally disabled for admin auth. Admin session checks must read from the DB so revoked sessions and allowlist changes take effect immediately.
- **Authorization**: `NUXT_ADMIN_EMAILS` env var (comma/whitespace separated) always grants access. `admin_access` DB table grants additional access at runtime.
- No email domain allowlist. Do not re-introduce domain-based checks.
- **OAuth-time gate**: `betterAuth.databaseHooks.user.create.before`, `account.create.before`, and `session.create.before` enforce the same allowlist at OAuth callback time — non-authorized accounts are rejected before any user, account, or session row is persisted. Do not add a `callbacks: { signIn }` block; it is a NextAuth pattern silently ignored by better-auth.

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
- Public unexpected errors: use `throwSafePublicError(event, scope, error)` from `server/utils/publicErrors.ts` to log internals and return a safe localized `500`.
- Admin endpoint errors: Spanish strings are acceptable. Complex admin resources may use `throwAdminMutationError`.
- 409 Conflict for optimistic locking violations.
- 413 for oversized uploads.
- 429 for rate limit violations (thrown automatically by `enforceRateLimit`).

### Health Check

`GET /health` — checks DB connectivity, Redis (`PING`), external API reachability, and SMTP (`verify`), returns `{ status: 'ok' | 'degraded' | 'error', timestamp, checks }` with 200/503. DB failure sets overall `error`; Redis/External API/SMTP failures set `degraded` when DB is healthy. Rejects requests that carry an `X-Forwarded-For` header (404) so only direct health checks reach it.

---

## Database & Drizzle

### Schema Conventions

- All tables use CUID2 as primary key (`text('id').primaryKey().$defaultFn(cuid)`).
- Instant timestamps (`createdAt`, `updatedAt`, expirations, delivery timestamps, etc.) use `timestamp(..., { withTimezone: true, mode: 'date' })`.
- `updatedAt` uses `.$onUpdate(() => sql\`now()\`)` so writes stay in the DB timezone instead of mixing app-side clocks.
- Use `date(...)` only for true date-only values.
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

1. Edit the relevant table module under `server/db/schema/`.
2. `pnpm db:generate` — creates migration file under `drizzle/`.
3. `pnpm db:migrate` — applies migrations via the project runner, which loads `.env`, logs progress, acquires the advisory lock, and creates required PostgreSQL extensions (currently `pg_trgm`) before running Drizzle migrations.
4. `pnpm db:seed` — if seed data needs updating. In development it runs without confirmation; in production it requires `--confirm` and `ALLOW_PRODUCTION_SEED=true`. **Destructive** (wipes and recreates content tables).
5. `pnpm db:seed:content` — idempotent backfill of the seed-originated content translations (tags, carousel, featured links, equality documents) onto existing rows via `onConflictDoNothing`. Non-destructive; this is the tool for adding a new locale's content translations to a live DB, and it runs automatically on deploy after migrations (`ops/seed-content.mjs`). Source of truth: `drizzle/seed/data/seedContentTranslations.ts`.

Never edit existing migration files.

### i18n Key Parity

Run `pnpm i18n:check` to verify that every non-base locale file (`en`, `ca`, `eu`, `gl`, `val`) has identical leaf keys and placeholders to the base `es.json`. The locale list derives from `LOCALE_DEFINITIONS`, so new locales are checked automatically. This script fails with a non-zero exit code if keys diverge; it runs in CI to catch parity regressions early.

---

## SEO & i18n Conventions

### hreflang on Detail Pages

The default layout injects hreflang alternates for all configured locales via `useLocaleHead`. But if a detail page's content only exists in one locale, the other-locale URL would return fallback content with a valid hreflang pointing to it — which confuses search engines.

Pattern for locale-dependent detail pages:

1. Include `translatedLocales: string[]` in the API response (list of locales that have real translations).
2. Compute `hasNativeTranslation` by checking if current locale's base code is in `translatedLocales`.
3. If false: inject `<meta name="robots" content="noindex,follow">` and override layout hreflang with only the locales that have real content.

See `app/pages/prensa/comunicados/[slug].vue` for full reference implementation.

**Ownership:** split the `useLocaleHead({ seo: true })` output between the two files so nothing is emitted twice:
- `app/app.vue` owns `htmlAttrs` and the locale **meta** (`og:locale`, `og:locale:alternate` — already in correct OG format from `useLocaleHead`; do not add them manually). It drops `canonical` and `alternate` **links** from its spread.
- `app/layouts/default.vue` owns the i18n canonical + `rel="alternate"` hreflang **links** only (returns just `link`, never `...resolvedHead`), so the detail-page alternate override (`seo-alternate-links-override`) wins and ES-only pages don't leak a `hreflang="en"` entry.

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

### Protected Records

The built-in `all` meta-tag (`RESERVED_TAG_SLUG` in `shared/constants/tags.ts`) is protected: it cannot be created with that slug, edited, or deleted. The guard is server-side and authoritative — `assertTagMutable` (`server/utils/admin/tagMutations.ts`) reads the stored slug in tags PUT/DELETE before mutating; the admin UI also hides its row actions. Don't remove the guard.

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

Before writing a new utility, check `server/utils/`, `shared/utils/`, and `app/composables/`. There are already helpers for locale resolution, file upload, rich text sanitization, rate limiting, validation, error messages, admin collection state, form validation, and more. For image/document-backed admin resources, use `defineAssetBackedTranslatableCrud` instead of re-implementing the finalize/transaction/cleanup choreography.

### Import Aliases

- Use `@/` for app-layer imports (`app/**` composables, components, types, pages).
- Use `~~/` for root/shared imports (`shared/**`, root-level paths, other cross-layer imports).
- Do not add new `~/` app-layer imports.

### Keep Related Files Updated

When you change code, review the related files that describe, constrain, or expose that behavior and update them in the same task when needed. This includes files such as `AGENTS.md`, `README.md`, i18n messages, migrations, schemas, config comments, and admin/public UI copy.

### Abstract When It Has Real Reuse

Extract to `server/utils/` when a handler exceeds ~50 lines of logic. Extract to a composable when the same stateful pattern appears in 2+ pages. Don't extract one-time code.

### Validation at Boundaries

Validate at the HTTP boundary (request body, query, params, multipart files). Trust internal service calls and DB results after Drizzle + schema constraints. Don't re-validate inside utilities that only receive already-validated data.

### Concurrency in Batches

For processing arrays of async tasks (email sends, file moves): use `Promise.allSettled` + `p-limit` to bound concurrency. Sequential `for...await` loops are acceptable only when each iteration depends on the previous result.

### Avoid Security Regressions

- All admin-authored HTML rendered publicly must go through `sanitizeRichTextHtml`.
- All uploaded SVGs must go through the SVG sanitizer in `saveAdminImage`.
- All public mutation endpoints need `enforceRateLimit`.
- Never expose raw stack traces or DB errors in public API responses.
- HTTP security headers (CSP with nonce, HSTS, XFO, referrer policy) are handled by `nuxt-security` in `nuxt.config.ts`. Do not add a separate CSP plugin or duplicate these headers in NGINX — the app already sends them.
- `/_ipx/**` has `security.rateLimiter: false` in routeRules — do not remove this or IPX image routes will hit the global rate limit under normal page load.

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
