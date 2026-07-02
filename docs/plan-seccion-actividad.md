# Plan — Nueva sección «Actividad» (sustituye a las newsletters)

> Estado: borrador para revisión. Pensado para discutirlo y afinarlo antes de implementar.
> Contexto: descontinuar la newsletter mensual (PDF) y trasladar su contenido a una sección web
> nativa, gestionable desde el panel de admin, multilingüe y coherente con el estilo actual.

---

## 1. Objetivo y alcance

**Objetivo.** Crear una sección **«Actividad»** que recoja, como entradas web nativas:

- **Eventos/actividades de CREUP** — reuniones institucionales, representaciones, asistencia a
  jornadas/congresos, presentaciones de informes, etc. (todo lo que hoy ocupa el grueso de la
  newsletter).
- **Eventos de miembros** — actividades organizadas por una entidad miembro de CREUP (sectorial o
  asociado), p. ej. *RITSI — XV Jornadas de Formación*, *Paellas 2026 (Consell UJI)*.
- **Informes mensuales de áreas** — el bloque «Informe mensual de áreas» de la newsletter, una
  entrada de texto por área y por mes.

**Dentro de alcance**
- Modelo de datos + API (pública e interna de admin) + panel de admin + UI pública.
- Fila compacta en la home, listado bajo Transparencia, dos plantillas de detalle, y página de
  informes de áreas por mes.
- i18n completo (es, en, ca, eu, gl, val) siguiendo el patrón actual.
- **Migración del contenido de Febrero 2026** vía seed idempotente (decidido).

**Fuera de alcance (lo defines aparte)**
- El *desmantelamiento* de la feature de newsletter actual (PDF + envío de email + suscriptores con
  consentimiento RGPD). Este plan **no toca** `newsletters`, `newsletterSubscribers`,
  `newsletterDeliveries` ni sus endpoints. La migración de contenido de Feb 2026 no necesita tocar
  esa feature: se hace por seed independiente.

---

## 2. Decisiones ya tomadas (recapitulación)

| Tema | Decisión |
|------|----------|
| Newsletter actual | Fuera de alcance aquí; se decide en mensaje aparte. |
| Migración de contenido | **Solo Febrero 2026**, vía seed idempotente, en los 6 locales. |
| Identidad del organizador (eventos de miembro) | **Solo** de las listas externas (`asociados` + `sectoriales`). Sin texto libre. Snapshot de siglas/logo al publicar. |
| Badges de categoría | **No se incluyen.** La metadata de tarjeta/detalle es **lugar** (puede ser «Online») + fecha(s). |
| Eventos de miembro | Se marcan con un **overlay de logo sobre la imagen**, igual que las apariciones en medios (`PressMediaOutletLogoOverlay`, reutilizable tal cual). |
| Área en actividades | **No.** Las actividades CREUP **no** tienen área; el área vive **solo** en los informes de áreas. |
| Ruta de detalle | **Única** `/transparencia/actividad/[slug]`, con layout y migas según `kind`. |
| Admin | **Una** sección «Actividad» con dos sub-vistas (entradas / informes). |
| Migración Feb 2026 | **Todas** las piezas del PDF, **con imágenes extraídas del propio PDF**. |
| Fallback de imagen | Imagen de la entrada → **imagen por defecto configurable** en `/admin/imagenes-por-defecto` → **icono**. Igual que prensa/newsletter (`siteDefaultImages`). |
| Navegación de informes | **Selector de mes + banner**, sin página índice de meses. |
| Programación | **No** hay publicación programada; solo el toggle `active`. |
| Organizadores | UJI/UIB de `asociados`, RITSI de `sectoriales`; el desplegable mezcla ambas. |
| Re-snapshot | Solo al crear o al **cambiar la referencia** (área/organizador), o vía botón explícito «Actualizar desde el organigrama». Editar otros campos no altera el snapshot histórico. |
| Periodos de informe | `covers_from` vive en **`area_report_editions`** (por edición, no por área); cubre **todo el rango** `covers_from…month_key` (cruza año); cabecera localizada. Sin `period_label`. |
| Frescura del snapshot | El snapshot usa **datos cacheados recientes** del SWR externo. Ventana = la configurada por `NUXT_EXTERNAL_API_CACHE_MAX_AGE_SECONDS` / `NUXT_EXTERNAL_API_CACHE_STALE_SECONDS` (hoy 60/300 en local; prod puede diferir). **Sin** force-fresh, sin `warnings`. |
| Invariantes del modelo | CHECKs DB además de Zod: kind↔organizador, is_online↔location, fechas; **formato `YYYY-MM`** y `covers_from<=month_key` en ediciones. |

---

## 3. Respuestas a tus tres preguntas sobre áreas

### 3.1 ¿Nuevo endpoint de la API externa solo con las áreas actuales?

**No hace falta tocar la API externa.** Ya expone `/api/organigrama`, que devuelve por área:
`area_id` (numérico, estable), `area_name`, `area_name_translations` (mapa `locale → nombre`) y
`area_order` (ver `server/utils/validation/external.ts:89-95`). El proxy interno
`server/api/org-chart.ts` ya lo consume y cachea.

Lo que sí conviene es un **endpoint interno ligero de admin** que recorte el payload (sin `members`)
para alimentar el desplegable:

- `GET /api/admin/areas` → reutiliza `getTeamAreasResponse(event)` y devuelve solo
  `{ id, name, nameTranslations, order }` por área.
- `GET /api/admin/member-orgs` → mezcla `asociados` + `sectoriales` (ambas listas externas tienen
  `denomination`, `initials`, `web_logo_light/dark`), descarta `socialNetworks`, y devuelve
  `{ source, id, denomination, initials, logoLight, logoDark, order }`.

Son rutas **Nitro internas** (no es un cambio en la API externa). **HTTP `no-store`** (sin cache de la
respuesta del endpoint), pero los **loaders externos siguen cacheados** intencionalmente (SWR Redis);
el `no-store` no salta Redis. Frescura del snapshot: ver §5.5.

### 3.2 Las áreas cambian sin romper lo ya publicado → *snapshot al publicar*

El `area_id` externo no es una FK local (las áreas son lectura del organigrama). El área aplica
**solo a los informes de áreas** (las actividades CREUP no llevan área). Para que cambiar el
organigrama no afecte a lo publicado:

- Al **crear** un informe, el formulario carga las **áreas actuales** (`/api/admin/areas`).
- Al **guardar**, el servidor **congela un snapshot** en la fila: `areaId` (handle estable) +
  `areaNameSnapshot` (JSON con `area_name_translations` del momento) + `areaOrderSnapshot`.
- La UI pública muestra **siempre el snapshot**, nunca re-resuelve contra el organigrama vivo.

**Cuándo se re-snapshotea (revisado para no alterar histórico sin querer).** El snapshot se captura
al crear y **solo se vuelve a tomar si cambia la referencia** (el `areaId` seleccionado, o el
organizador en eventos de miembro). Editar otros campos (corregir una errata en el cuerpo, cambiar la
imagen…) **NO** re-snapshotea: así corregir un informe antiguo no le cambia el nombre/orden de área ni
el logo/siglas del organizador. Para refrescar a propósito, hay una **acción explícita «Actualizar
datos desde el organigrama»** en el formulario, que re-resuelve el snapshot contra las áreas/listas
actuales. (Esto sigue cumpliendo «el contenido que se publique al momento se basa en las áreas
actuales»: lo nuevo se crea con lo vigente; lo viejo solo cambia si tú lo pides.)

Lo mismo aplica a la **identidad del organizador** en eventos de miembro: se congela
`{ denomination, initials, logoLight, logoDark, source, id }` al crear/cambiar de organizador (las
listas externas no tienen id realmente estable —su id es un slug derivado del texto—, así que el
snapshot es imprescindible).

**Histórico de áreas.** El listado de actividad **no** filtra por área (las actividades no la llevan).
En la página de informes, cada mes muestra los informes de las áreas que existían entonces (vía
snapshot), por lo que un cambio de organigrama no altera meses pasados. El nombre mostrado sale
siempre del snapshot.

### 3.3 ¿Cómo encajan las traducciones?

Mismo patrón que el resto del proyecto: **tabla de traducciones por `(locale, parentId)`**, `es`
obligatorio, fallback al resolver (ver `pressArticleTranslations` y `financialReportTranslations`).

- **Contenido de la entrada** (título, extracto, cuerpo HTML, pie de foto, alt): tabla
  `activity_entry_translations` / `area_report_translations`.
- **Nombre del área**: del **snapshot** (`areaNameSnapshot[locale]` con fallback). No se crea tabla de
  traducción para nombres de área.
- **Etiquetas de UI** (título de sección, pestañas, filtros, «Online», banner de miembro, etc.):
  en los JSON de i18n (`i18n/locales/*.json`).
- **Migración Feb 2026**: las traducciones se cargan vía el seed idempotente de contenido
  (`drizzle/seed/content.ts` + `onConflictDoNothing` sobre `(locale, parentId)`), que ya corre en
  cada deploy (`deploy.sh`).

---

## 4. Modelo de datos

Dos entidades nuevas. La distinción CREUP-vs-miembro va en **una sola tabla** con un discriminador
`kind` (igual que `pressArticles.type`), porque comparten casi todo (slug, imagen, fechas, lugar,
cuerpo, traducciones) y el listado las muestra unificadas.

### 4.1 `activity_entries` (+ `activity_entry_translations`)

Plantilla a clonar: **stack de prensa** (`server/db/schema/press.ts`,
`server/services/pressArticleService.ts`), por su complejidad (imagen opcional, overlay de logo,
contenido rico, traducciones, finalización de assets con versionado).

```
activity_entries
  id            text PK (cuid)
  kind          enum('creup','member')        -- discriminador
  slug          text unique
  image         text null
  start_date    date not null                 -- fecha del evento (o inicio del rango)
  end_date      date null                     -- fin del rango (p. ej. "3–6 feb")
  is_online     boolean default false          -- "Online" en lugar de lugar
  location      text null                      -- lugar físico (null si is_online)
  -- (sin área: las actividades CREUP no llevan área)
  -- solo kind='member':
  member_org_source  enum('asociado','sectorial') null
  member_org_id      text null                  -- slug-id externo (referencia débil)
  member_org_snapshot jsonb null                -- { denomination, initials, logoLight, logoDark }
  active        boolean default true
  created_at    timestamptz
  updated_at    timestamptz
  -- índices: (active, start_date desc), (slug, active), (kind)
  -- CHECK de invariantes (no fiarse solo de Zod):
  --   kind='member'  ⟹ member_org_source/id/snapshot NOT NULL
  --   kind='creup'   ⟹ member_org_source/id/snapshot NULL
  --   is_online=true ⟹ location NULL
  --   end_date IS NULL OR end_date >= start_date

activity_entry_translations
  id, locale, title (not null), excerpt null, content_html null,
  image_caption null, alt null,
  activity_entry_id  FK→activity_entries (cascade)
  unique(locale, activity_entry_id) + check de locale soportado + índices trigram en title/excerpt
```

Notas:
- **Orden y visibilidad**: gate por `active`; orden del listado y de la home por `start_date desc`.
  (No se replica el `publishedAt ≤ hoy` de prensa: la actividad es retrospectiva. Se puede añadir
  `published_at` para programación diferida si lo quieres —punto abierto 6.)
- `image_caption` cubre los pies de foto de los mockups («Foto cedida por RITSI», «Foto del encuentro»).
- `excerpt` = la descripción corta de la tarjeta; `content_html` = el cuerpo del detalle.

### 4.2 `area_report_editions` + `area_reports` (+ `area_report_translations`)

Referencia de patrones (no clon directo — ver nota al final de §4.2): **informes económicos**
(`financialReports`), que usa `defineAssetBackedTranslatableCrud` + `definePublicPaginatedListHandler`
+ `withTranslationRules`.

**Clave del diseño (corrección):** el «Informe mensual de áreas» es una **edición mensual** con varias
áreas como hijas. El rango cubierto (`covers_from`) es propiedad de **la edición**, no de cada área
—si fuera por fila, dentro de un mismo `month_key` unas áreas podrían cubrir ene–feb y otras solo feb,
y filtrar enero llevaría a una página con áreas que no cubren enero—. Por eso `covers_from` vive en una
tabla de edición por `month_key`.

```
area_report_editions               -- una fila por edición mensual
  month_key     text PK             -- 'YYYY-MM' (mes ancla = fin del rango)
  covers_from   text null           -- 'YYYY-MM' (inicio del rango; null = solo month_key)
  created_at, updated_at
  -- CHECK formato:  month_key   ~ '^\d{4}-(0[1-9]|1[0-2])$'
  -- CHECK formato:  covers_from IS NULL OR covers_from ~ '^\d{4}-(0[1-9]|1[0-2])$'
  -- CHECK rango:    covers_from IS NULL OR covers_from <= month_key   (lexicográfico, válido por el formato)

area_reports                        -- una fila por (edición, área)
  id            text PK (cuid)
  month_key     text not null  FK→area_report_editions(month_key)  (cascade)
  area_id       integer not null
  area_name_snapshot  jsonb not null
  area_order_snapshot integer null
  image         text null
  active        boolean default true
  created_at, updated_at
  unique(month_key, area_id)        -- un informe por área y edición

area_report_translations
  id, locale, content_html (not null), image_caption null, alt null,
  area_report_id  FK→area_reports (cascade)
  unique(locale, area_report_id) + check de locale
```

Notas:
- **No tiene título propio**: el título de cada tarjeta de informe = nombre del área (del snapshot).
- La página de informes carga la **edición** (`month_key` + `covers_from`) y sus `area_reports`
  (ordenados por `area_order_snapshot`).
- **Periodos que cubren uno o más meses saltados** (caso real: uno o varios meses sin informe se
  recogen en el siguiente). `month_key` = fin del rango; `covers_from` (en la **edición**) = inicio. La
  edición cubre **todo el rango** `covers_from … month_key` (puede ser >2 meses y cruzar de año). La
  cabecera deriva la etiqueta, genérica y localizada:
  - `covers_from` null → «Febrero 2026».
  - **mismo año** → «Enero–Marzo 2026».
  - **distinto año** → «Diciembre 2025 – Febrero 2026».
- **Selector vs banner** (ver §7.2/§7.5): el **selector** lista solo **ediciones** (meses ancla,
  etiquetados con su rango). El **banner** del listado resuelve el **mes seleccionado** a la edición que
  lo cubra (mapa cubierto→ancla de `/api/area-reports/months`), para no ocultar el informe al filtrar
  por un mes intermedio. Como `covers_from` es por edición, todas sus áreas comparten rango (sin la
  inconsistencia per-área). Sin texto libre.
- **Sin solapes entre ediciones (regla nueva).** Para que el mapa cubierto→ancla sea inequívoco, el
  rango `covers_from … month_key` de una edición **no puede solaparse** con el de otra (p. ej. edición
  marzo cubre ene–mar y edición febrero cubre ene–feb → ¿a qué ancla apunta enero?). La regla del mes
  ancla propia (§5.1) queda subsumida: sin solapes, cada mes cubierto pertenece a una sola edición.
  - **Seguro ante concurrencia (no basta un SELECT previo).** Dos guardados simultáneos podrían crear
    un solape si solo se comprueba con un SELECT. Opciones, en orden de preferencia:
    1. **Constraint DB de exclusión** (la más fuerte): añadir una columna generada con el rango de meses
       como enteros (`year*12 + month`). Como `covers_from` es nullable, el inicio del rango usa
       `coalesce(covers_from_idx, month_key_idx)` → `int4range(coalesce(covers_from_idx, month_key_idx), month_key_idx, '[]')` y un
       `EXCLUDE USING gist (range WITH &&)`. Garantiza no-solape a nivel de motor, sin depender del código.
       - **Implementación**: Drizzle puede no expresar `EXCLUDE USING gist` ni la columna generada de
         forma nativa; en ese caso se escribe como **SQL raw** en la migración (bloque `sql\`…\``/`.sql`
         a mano) e incluye `CREATE EXTENSION IF NOT EXISTS btree_gist` si hace falta. El **error de
         constraint** (`23P01`) se **mapea a 409** en el handler admin (mensaje accionable).
    2. Si no se usa el constraint: validar **dentro de una transacción** con bloqueo suficiente
       (`SELECT … FOR UPDATE` sobre las ediciones afectadas o un *advisory lock* por scope `area-report`),
       no un SELECT suelto. Devolver 409 al detectar solape.

> Detalle de implementación: el CRUD de informes **no** es un clon directo de la factoría
> `defineAssetBackedTranslatableCrud` (informes económicos): hay upsert de `area_report_editions`,
> posible cambio de `month_key`, unicidad `(month_key, area_id)`, validación de no-solape, imagen
> **opcional** (la factoría asume asset obligatorio) y limpieza de ediciones huérfanas. Se hará un
> **handler propio inspirado** en financial-reports, reutilizando piezas (traducciones, finalize de
> imagen) donde encaje.

### 4.3 Migración (drizzle)
- Nueva migración con las **5 tablas** (`activity_entries` + `activity_entry_translations`,
  `area_report_editions` + `area_reports` + `area_report_translations`) + enums + índices + checks de
  locale (`buildSupportedLocaleCheck`) + los CHECK de invariantes (§4.1), de **formato `YYYY-MM`** y de
  **rango `covers_from <= month_key`** (§4.2), y la constraint de no-solape (§4.2, posible SQL raw).
- Esquemas en `server/db/schema/` (las de prensa en `press.ts`; las simples pueden ir en
  `shared.ts` junto a `financialReports`, o en un `activity.ts` nuevo — preferible `activity.ts`).

---

## 5. API

### 5.1 Pública (cacheada, locale-aware vía `x-request-locale`)
- `GET /api/activity` — listado. Query: `kind` (creup|member), `month` (YYYY-MM),
  `q` (búsqueda), `limit` (≤50, def. 12), `offset`. Filtro `active`, orden `start_date desc`.
  (Sin filtro de área: las actividades no llevan área.)
  Cache `PUBLIC_ROUTE_CACHE_OPTIONS` + `buildPublicRouteCacheKey('public-activity', { queryKeys })`;
  **la búsqueda (`q`) bypassa cache** (igual que prensa).
- `GET /api/activity/[slug]` — detalle (incluye el snapshot del **organizador** si `kind=member`; las
  actividades no llevan área).
- `GET /api/area-reports?month=YYYY-MM` — la **edición** de ese mes (`covers_from` + etiqueta) y sus
  `area_reports` activos (orden por `area_order_snapshot`).
- `GET /api/area-reports/months` — derivado de `area_report_editions` (con ≥1 informe activo). Devuelve:
  1. `anchors`: ediciones (meses ancla) con su etiqueta de rango → para el **selector**.
  2. `coveredToAnchor`: mapa **mes cubierto → mes ancla** (expandiendo `covers_from … month_key` de cada
     edición) → para el **banner**. La **regla de no-solape entre ediciones** (§4.2) garantiza que cada
     mes cubierto pertenece a **una sola** edición, así que el mapa es inequívoco (sin desempates).
- `GET /api/home` — **extender** el payload con `recentActivity: { items }` (últimas 4 por
  `start_date desc`). Es lo más simple y reutiliza el cache de home (ver `server/api/home.ts:232-239`).

### 5.2 Admin (CRUD)
Actividades: clonar el patrón de prensa (`server/api/admin/press/*`). Informes: **handler propio
inspirado** en financial-reports (ver §4.2 — hay edición + no-solape + imagen opcional, no encaja la
factoría tal cual):
- `GET/POST /api/admin/activity`, `GET/PUT/DELETE /api/admin/activity/[id]`, `POST /api/admin/activity/upload`.
- `GET/POST /api/admin/area-reports`, `GET/PUT/DELETE /api/admin/area-reports/[id]`, `POST /api/admin/area-reports/upload`.
  - Lógica extra (todo en **una transacción**):
    - **Upsert de `area_report_editions`** al guardar; `covers_from` con **validación de no-solape** (409).
    - **Cambio de `month_key`**: NO se actualiza la PK de la edición. Estrategia: (a) upsert de la
      **edición destino**, (b) `UPDATE area_reports SET month_key = destino WHERE id = …`, (c) **limpiar
      la edición origen si queda sin áreas**. (Alternativa equivalente: FK `ON UPDATE CASCADE`, pero se
      prefiere el upsert+move explícito para no renombrar PKs en uso.)
    - **Limpieza de ediciones huérfanas** (sin áreas) tras delete/move.
- Reutilizan: validación Zod (`createActivitySchema`/`updateActivitySchema` con `withTranslationRules`),
  bloqueo optimista (`assertOptimisticLock` / `updatedAt` en WHERE), finalización de assets
  (`finalizeAdminImage`), autenticación + CSRF + locale (plugin `admin-fetch.client.ts`), e
  invalidación de cache.

### 5.3 Interna de admin (desplegables)
- `GET /api/admin/areas` y `GET /api/admin/member-orgs` (descritos en 3.1).

### 5.4 Snapshot en el servidor
El cliente solo envía la **referencia** (`areaId`, o `memberOrgSource+id`), nunca el snapshot.
- **POST (crear)**: el servidor resuelve las áreas/organizaciones actuales (loaders internos) y
  serializa el snapshot a `area_name_snapshot` / `member_org_snapshot`.
- **PUT (editar)**: el servidor **solo recalcula el snapshot si la referencia cambió** respecto a la
  fila existente (o si llega el flag `refreshSnapshot` del botón «Actualizar desde el organigrama»).
  Si la referencia no cambia, **conserva el snapshot almacenado** (no toca histórico — ver §3.2).

### 5.5 Frescura del organigrama/miembros en el snapshot (decisión simple)

**Se acepta el snapshot con cache SWR.** Desplegables y snapshot usan **los mismos loaders cacheados**
(`getTeamAreasResponse`, sectoriales, asociados). «Reciente» = la **ventana SWR configurada** por
`NUXT_EXTERNAL_API_CACHE_MAX_AGE_SECONDS` y `NUXT_EXTERNAL_API_CACHE_STALE_SECONDS` (hoy **60/300** en
el entorno local; producción puede cambiarlos). Al crear o re-snapshotear, el servidor **congela lo que
devuelva el loader en ese momento**.

- **No** hace falta `fetchExternalApiFresh`, ni variantes `forceRefresh`, ni contrato `warnings`, ni
  fallback especial.
- `Cache-Control: no-store` en el endpoint admin evita el cache **HTTP** de la respuesta, pero **no**
  salta Redis — y es **intencional**.
- Si el upstream está caído y hay **cache stale válida**, se guarda con esa cache. Si **no hay** cache,
  el guardado **falla igual que fallan hoy** los loaders externos (sin manejo especial nuevo).

**Tradeoff aceptado**: se pierde exactitud «al instante» si el organigrama cambia justo antes de
publicar, pero el snapshot sigue siendo coherente y reciente (≤ ventana SWR). El botón «Actualizar
desde el organigrama» (§5.4) permite re-snapshotear a propósito cuando interese.

---

## 6. Panel de admin

Nueva sección **«Actividad»** registrada en `shared/constants/adminRoutes.ts` y
`shared/constants/adminSections.ts` (icono p. ej. `i-tabler-activity`). Una sección con dos
sub-vistas (pestañas o subnav):

- **Entradas de actividad** — `/admin/actividad`, `/admin/actividad/crear`, `/admin/actividad/[id]`.
  - Formulario clonado de `AdminPressForm.vue` + subcomponentes (`AdminPressCoverImagePanel`,
    `AdminPressTranslationCard`, `AdminPressConfigPanel`, `AdminPressCancelModal`).
  - Campos: `kind` (toggle CREUP/Miembro), imagen + pie/alt por locale, `start_date` + `end_date`
    opcional, `is_online` + `location`, **desplegable de organizador** (solo si `kind=member`, de
    `/api/admin/member-orgs`, con logo), traducciones por locale (título, extracto, cuerpo
    rich-text), `active`. (Sin área en actividades.)
- **Informes de áreas** — `/admin/actividad/informes`, `.../crear`, `.../[id]`. Modelo en **dos
  niveles**: la **edición** (`month_key` + `covers_from`) y sus **áreas**.
  - **Edición**: al elegir/crear un mes se hace **upsert** de `area_report_editions`. El campo
    `covers_from` (rango que cubre la edición; por defecto = solo ese mes) se edita **una vez a nivel de
    edición** —no por área—, garantizando rango común. UI: en el selector de mes o un panel de edición.
  - **Área**: formulario clonado de `app/pages/admin/informes-economicos.vue` con **desplegable de
    área**, imagen opcional, cuerpo rich-text por locale, `active`. Unicidad `(month_key, area_id)`
    validada (409 si choca). Botón **«Actualizar datos desde el organigrama»** (re-snapshot a petición).

---

## 7. UI pública (mapeo con tus imágenes)

Estilo: Nuxt UI + Tailwind 4, variables CSS de marca (`--ui-primary` = CREUP red), clases de
animación existentes (`motion-card`, `motion-link-card`, `motion-link-media`). Se reutilizan tal cual
`PressMediaOutletLogoOverlay` (overlay de logo) y `PressRichText` (cuerpo HTML).

### 7.1 `A _ Fila de tarjetas (compacta).png` → Home
- Componente nuevo `app/components/home/RecentActivity.vue` (clona la rejilla de `FeaturedLinks.vue`).
- **Inserción**: en `app/pages/index.vue`, **entre** el cierre de la sección noticias+agenda (≈línea
  86) y `<HomeFeaturedLinks>` (≈línea 88).
- Datos: `home.value.data.recentActivity.items` (extensión de `/api/home`). CTA «Ver todo el trabajo
  reciente» → `/transparencia/actividad`.
- Las tarjetas de miembro muestran el **overlay de logo** sobre la imagen.

### 7.2 `Versión combinada (B + filtros de A).png` → Listado bajo Transparencia
- Página nueva `app/pages/transparencia/actividad.vue` (clona `app/pages/prensa/noticias.vue`).
- **Pestañas**: «Toda la actividad» / «CREUP» / «Eventos de miembros» = filtro por `kind`.
- **Filtros**: selector de **mes** (por `start_date`) y **búsqueda** con debounce 300 ms.
  > Cambio respecto al mockup: el desplegable «Área» del mockup **se elimina** del listado, porque las
  > actividades no llevan área. El área solo aparece en la página de informes de áreas.
- **Banner** «Informe mensual de áreas · {etiqueta} — Ver informe»: aparece si el **mes seleccionado
  está cubierto** por algún informe (no solo si es un mes ancla). Usa el **mapa cubierto→ancla** de
  `/api/area-reports/months`: si el usuario filtra por enero y existe un informe anclado en febrero con
  `covers_from=enero`, el banner aparece con la etiqueta del rango y enlaza al ancla
  (`/informes/2026-02`). Sin mes seleccionado → muestra el ancla más reciente.
  - **Diseño**: tarjeta horizontal a ancho de contenedor con **barra de acento izquierda en rojo de
    marca** (como el mock), fondo sutil `bg-primary/5`, `rounded-xl`, `ring-1 ring-default`, icono de
    documento (`i-tabler-file-text`) en pastilla, título a la izquierda y CTA «Ver informe →» a la
    derecha (`i-tabler-arrow-right`). Hover con `motion-card`. Responsive: en móvil el CTA baja debajo
    del título. Reactivo al **filtro de mes** del listado (cambia o se oculta según el mes elegido).
- Tarjetas: imagen (o imagen por defecto del slot / icono, ver §7 *Fallback de imagen*), fecha(s),
  lugar/«Online»; miembro → overlay de logo. **Sin badges de categoría.**

### 7.3 `A _ Artículo.png` → Detalle de evento CREUP
- `app/pages/transparencia/actividad/[slug].vue` (clona `PressArticleDetail.vue`), layout según `kind`.
- Migas: `Transparencia › Actividad › {título}`. Metadata: fecha(s) · lugar/«Online». Imagen con pie,
  cuerpo rich-text. (Sin área — cambio respecto al mockup de Sumar, que mostraba «Área de Presidencia».)

### 7.4 `Detalle de evento de miembro.png` → Detalle de evento de miembro
- Misma ruta `[slug]`, variante `kind=member`.
- Migas: `Transparencia › Eventos de miembros › {título}`. Banner superior «Actividad de un miembro de
  CREUP» con logo + descripción del organizador (del snapshot). Imagen con **overlay de logo** y pie
  («Foto cedida por …»). Metadata: fecha(s) · lugar. (Sin área.)

### 7.5 `Informe de áreas _ Febrero 2026.png` → Página de informes
- `app/pages/transparencia/actividad/informes/[monthKey].vue` + **`informes.vue`** (sin mes → redirige
  al mes más reciente con informes; ver §7.5 *UX*).
- Migas: `Inicio › Transparencia › Actividad de CREUP › Informe de áreas`.
- Encabezado «INFORME MENSUAL · N ÁREAS» (**N dinámico**: solo áreas con informe ese mes — el mock dice
  «4 ÁREAS» pero el PDF traía 7).
- Rejilla de tarjetas: por área (nombre del snapshot) + imagen opcional + extracto/cuerpo.

#### Navegación de meses (decidido: selector + banner, sin página índice) — UX

Se llega desde el **banner** del listado de Actividad. Dentro de la página, un **selector de mes** —
poblado por `/api/area-reports/months` (solo meses con informes)— permite saltar a otros meses.
Objetivos: agradable, cómodo y bien integrado con el diseño actual.

- **Componente**: `USelectMenu` (Nuxt UI) presentado como **pastilla** a juego con el mock —
  `UButton` con icono `i-tabler-calendar`, etiqueta «{Mes} {Año}» localizada y chevron; `rounded-lg`,
  `ring-1 ring-default`, hover `motion-card-subtle`. Coherente con el estilo de filtros del listado de
  prensa, para que ambas vistas se sientan iguales.
- **Colocación**: alineado a la derecha del encabezado de página en desktop (como el mock); a ancho
  completo bajo el título en móvil.
- **Comodidad**: flanqueado por **flechas ‹ ›** (`i-tabler-chevron-left/right`) para saltar al mes
  contiguo *con informes* (se deshabilitan en los extremos). El mes vigente queda marcado en la lista.
- **URL**: el mes vive en la ruta (`/informes/2026-02`), así es enlazable y navegable con atrás/adelante.
  Cambiar de mes hace `navigateTo` a la nueva ruta (transición suave de la rejilla, `motion`/fade).
- **Defecto y bordes**: `/informes` sin mes → redirige al **mes más reciente** con informes. Un
  `monthKey` directo sin informes → estado vacío amable + enlace al mes más reciente (evita 404 seco).
- **Accesibilidad**: `aria-label` en el selector y las flechas; foco visible; lista navegable por
  teclado (lo aporta Nuxt UI). Etiquetas de mes vía formateo i18n del locale activo.

**Fallback de imagen (decidido).** Misma mecánica que prensa/newsletter, vía la tabla
`siteDefaultImages` (keyed por `(scope, slot)`, configurable en `/admin/imagenes-por-defecto`):

1. Imagen de la entrada (si la hay).
2. Si no, **imagen por defecto configurable** del slot correspondiente.
3. Si no hay default subido, **icono** de fallback.

Se añaden slots nuevos: scope `activity` con slots `creup` y `member`, y scope `area_report`. Añadir
un slot toca **todo** este conjunto (si falta alguno, la UI no valida o no persiste):

1. **`shared/constants/siteDefaultImages.ts`** — `SITE_DEFAULT_IMAGE_SCOPE`, `SITE_DEFAULT_IMAGE_SLOT`
   y una entrada por slot en `SITE_DEFAULT_IMAGE_SLOT_DEFINITIONS` (`uploadDir`, `publicPath`,
   `proxyPublicBase`, `finalizeSlug`).
2. **Esquema + migración** — ampliar el CHECK `(scope, slot)` de `site_default_images` y **sembrar las
   filas** de los nuevos slots (`drizzle/seed.ts` siembra una fila por slot conocido; replicar).
3. **`shared/utils/adminSchemas.ts`** — `updateSiteDefaultImagesSchema` (campos del payload nuevos).
4. **`server/api/admin/site-default-images/index.{get,put}.ts`** — mapas GET/PUT y tipos del payload
   (`activityCreupImage`, `activityMemberImage`, `areaReportImage`).
5. **`app/pages/admin/imagenes-por-defecto.vue`** — nueva sección de subida para los slots.
6. **Cache** — invalidar caches de actividad/informes al guardar los default (no solo el de su scope).
7. **Rutas públicas/montajes** de la carpeta de default (ver §9.1) + claves i18n.

---

## 8. i18n, navegación y migración

### 8.1 Navegación
- `app/composables/home/usePublicHeaderNavigation.ts`: añadir «Actividad» a los hijos de
  Transparencia (desktop ≈204-225 y móvil ≈335-362) → `/transparencia/actividad/`.
- Claves nuevas en `i18n/locales/{es,en,ca,eu,gl,val}.json` bajo `nav.transparency.activity`
  (+ títulos de página, pestañas, filtros, «Online», banner de miembro, etiquetas de informe).

### 8.2 Seed / migración Feb 2026 (idempotente)
- `drizzle/seed/data/seedActivityTranslations.ts` y `seedAreaReportTranslations.ts` (mapas keyed por
  slug / `monthKey+areaId`, con los 6 locales). Reutilizar `getRequiredSeedTranslations`.
- `drizzle/seed/content.ts`: alta **idempotente** (`onConflictDoNothing` por clave natural) en orden:
  1. **`activity_entries`** de Feb 2026 (por `slug`).
  2. **`area_report_editions`** → primero **upsert de la edición `2026-02`** (con su `covers_from`).
  3. **`area_reports`** hijos (por `(month_key, area_id)`), referenciando la edición.
  4. **Backfill de traducciones** (`onConflictDoNothing` sobre `(locale, parentId)`).
  Mismo patrón que tags/prensa.
- Corre solo en `deploy.sh` (`ops/seed-content.mjs`), no destructivo.
- **Imágenes incluidas (decidido).** Se migran **todas** las piezas del PDF **con sus imágenes**:
  - Los ficheros de imagen se colocan bajo la ruta pública de assets de actividad
    (`public/...`, ver `assetPaths.ts`) y el seed referencia su path (idempotente, sin re-subir).
  - **Origen de las imágenes (decidido)**: **extraerlas del propio PDF** de la newsletter Feb 2026.
    (Son capturas de calidad limitada; se asume.) Se procesan a `webp` y se guardan bajo la ruta de
    assets de actividad.
  - Los eventos de miembro toman además el logo del snapshot de `sectoriales/asociados` al sembrar.
  - Tareas de migración: clasificar cada pieza del PDF como `kind=creup` o `kind=member`, mapear
    fechas/lugar, y los informes de área por `(month_key='2026-02', area)`.

---

## 9. Transversal (cache, sitemap, SEO, assets)

- **Cache pública**: `PUBLIC_ROUTE_CACHE_OPTIONS` + `buildPublicRouteCacheKey` con `includeLocale`;
  búsqueda bypassa cache.
- **Invalidación**: añadir `invalidateActivityRelatedCaches()` (limpia `public-activity` + home) y
  `invalidateAreaReportsCache()` en `server/utils/admin/adminCacheInvalidation.ts`, llamadas en cada
  mutación de admin.
- **Sitemap**: emitir URLs de detalle de actividad y de meses de informes en `server/api/__sitemap__/`
  (clonar `press-articles.ts`).
- **SEO/migas**: `usePageSeo` para títulos/meta/breadcrumbs; etiquetado de idioma WCAG 3.1.2 en
  campos traducidos (`:lang` cuando el locale del campo ≠ locale actual), como en prensa.
- **Locale en mutaciones**: el plugin `admin-fetch.client.ts` ya adjunta `x-request-locale` + CSRF.

### 9.1 Assets nuevos en producción (¡no basta con `assetPaths.ts`!)

En este repo cada carpeta de uploads públicos **se sirve y se monta una a una**. Funciona en dev sin
configurar nada, pero **tras build/deploy se rompe** si no se añaden todos los puntos. Para cada ruta
nueva (`public/transparencia/actividad/imagenes`, `.../imagenes-por-defecto`,
`public/transparencia/informes-areas/imagenes`, etc.) hay que tocar:

1. **`shared/constants/assetPaths.ts`** — constantes de las rutas públicas (`ACTIVITY_*`, `AREA_REPORTS_*`,
   y los default de `siteDefaultImages`).
2. **Handler de servido** `server/routes/<ruta>/[...path].ts` — uno por carpeta (clonar
   `server/routes/prensa/imagenes/[...path].ts`). Sin esto la imagen no se sirve en el build standalone.
3. **Montaje de volumen** en **`docker-compose.local-deploy.yml`** y en
   **`docker-compose.production.example.yml`** — una línea por carpeta bajo
   `${APP_PUBLIC_UPLOADS_DIR}` / `${LOCAL_DEPLOY_PUBLIC_UPLOADS_DIR}` (como las de `prensa/imagenes`).
   Sin esto, las imágenes subidas se pierden al recrear el contenedor.
4. **`deploy.sh`** — si crea/permisos de directorios de uploads, añadir las nuevas carpetas.
5. **`DEPLOYMENT.md`** (y/o `README.md`) — documentar los nuevos volúmenes/rutas (ahí se documentan
   `APP_PUBLIC_UPLOADS_DIR` / `LOCAL_DEPLOY_PUBLIC_UPLOADS_DIR`). No existe `docs/env`.

> Conviene **minimizar el número de carpetas nuevas** (p. ej. un único `public/transparencia/actividad/`
> con subcarpetas `imagenes/` e `imagenes-por-defecto/`) para reducir handlers y montajes.

- **Versionado/uso**: `?v=updatedAt`; reusar `finalizeAdminImage` y el proxy de imágenes existente.

---

## 10. Rutas y navegación (resumen)

| Vista | Ruta |
|------|------|
| Home (fila compacta) | `/` (componente nuevo entre agenda y enlaces) |
| Listado | `/transparencia/actividad` |
| Detalle CREUP / miembro | `/transparencia/actividad/[slug]` (layout según `kind`) |
| Informes de áreas (por mes) | `/transparencia/actividad/informes/[monthKey]` |
| Admin entradas | `/admin/actividad`, `/admin/actividad/crear`, `/admin/actividad/[id]` |
| Admin informes | `/admin/actividad/informes`, `.../crear`, `.../[id]` |
| Admin áreas (dropdown) | `GET /api/admin/areas` |
| Admin organizadores (dropdown) | `GET /api/admin/member-orgs` |

> Nota de colisión: ya existe `/conocenos/eventos` (agenda de eventos tirada de la API externa,
> `useEvents`). Por eso la sección nueva se llama **«Actividad»** y no «Eventos», para no chocar ni
> confundir. Editorialmente: *Prensa* = comunicados/notas/medios; *Actividad* = eventos asistidos u
> organizados; *Agenda/Eventos* (Conócenos) = eventos futuros con inscripción.

---

## 11. Checklist de ficheros

**Crear**
- `server/db/schema/activity.ts` (**5 tablas**: `activity_entries` + traducciones,
  `area_report_editions` + `area_reports` + traducciones; enums + relations + CHECKs) y migración drizzle.
- `server/services/activityEntryService.ts` (clon de `pressArticleService.ts`).
- `server/utils/admin/crud/area-reports.ts` (**handler propio inspirado** en `crud/financial-reports.ts`:
  upsert de edición, no-solape de `covers_from`, cambio de `month_key`, limpieza de ediciones huérfanas,
  imagen opcional).
- `server/utils/validation/activity.ts` (+ schemas en `shared/utils/adminSchemas.ts`).
- API pública: `server/api/activity.ts`, `server/api/activity/[slug].ts`, `server/api/area-reports.ts`,
  `server/api/area-reports/months.ts`.
- API admin: `server/api/admin/activity/*`, `server/api/admin/area-reports/*`,
  `server/api/admin/areas.get.ts`, `server/api/admin/member-orgs.get.ts`.
- Sitemap: `server/api/__sitemap__/activity.ts`.
- **Servido de assets** (uno por carpeta nueva, ver §9.1): `server/routes/transparencia/actividad/imagenes/[...path].ts`
  (y, si se separan, `.../imagenes-por-defecto/[...path].ts` e informes).
- Composables: `app/composables/activity/useActivity.ts`, `useActivityArchiveFilters.ts`,
  `app/composables/admin/useAdminActivity.ts`.
- Páginas públicas: `app/pages/transparencia/actividad.vue`,
  `app/pages/transparencia/actividad/[slug].vue`,
  `app/pages/transparencia/actividad/informes/[monthKey].vue`,
  `app/pages/transparencia/actividad/informes.vue` (redirige al mes más reciente).
- Páginas admin: `app/pages/admin/actividad/{index,crear,[id]}.vue`,
  `app/pages/admin/actividad/informes/{index,crear,[id]}.vue`.
- Componentes: `app/components/home/RecentActivity.vue`, `app/components/activity/ActivityList.vue`,
  `ActivityDetail.vue`, `app/components/admin/AdminActivityForm.vue` (+ subcomponentes).
- Seed: `drizzle/seed/data/seedActivityTranslations.ts`, `seedAreaReportTranslations.ts`.

**Modificar**
- `app/pages/index.vue` (insertar `RecentActivity`).
- `server/api/home.ts` (+ `recentActivity`); `app/composables/home/useHome.ts` (tipo).
- `app/composables/home/usePublicHeaderNavigation.ts` (nav desktop + móvil).
- `shared/constants/adminRoutes.ts`, `shared/constants/adminSections.ts`.
- `shared/constants/assetPaths.ts`, `shared/constants/publicAsyncDataKeys.ts`.
- `shared/constants/siteDefaultImages.ts` (+ CHECK del esquema `siteDefaultImages` en migración).
- `server/api/admin/site-default-images/index.{get,put}.ts` + `app/pages/admin/imagenes-por-defecto.vue`
  (nuevos slots `activity:creup`, `activity:member`, `area_report`).
- `server/utils/admin/adminCacheInvalidation.ts`.
- `drizzle/seed.ts` (sembrar filas de los nuevos slots de `siteDefaultImages`).
- `drizzle/seed/content.ts` (altas + backfill de traducciones).
- `i18n/locales/{es,en,ca,eu,gl,val}.json`.
- **Producción** (§9.1): `docker-compose.local-deploy.yml`, `docker-compose.production.example.yml`
  (montajes de volúmenes), `deploy.sh` (si gestiona dirs de uploads), `DEPLOYMENT.md` (y/o `README.md`).

---

## 12. Fases de implementación (sugerido)

1. **Datos**: esquemas + migración + (en local) seed de prueba.
2. **API interna áreas/organizadores** (`/api/admin/areas`, `/api/admin/member-orgs`) + snapshot.
3. **Backend actividades**: service + validación + API pública + admin + cache/invalidación.
4. **Backend informes de áreas**: handler propio (edición + no-solape + imagen opcional, ver §4.2/§5.2)
   + API pública + página por mes.
5. **Admin UI**: formularios y listados (entradas + informes).
6. **UI pública**: listado (pestañas/filtros/búsqueda/banner), detalles (CREUP + miembro), informes.
7. **Home**: extensión de `/api/home` + `RecentActivity`.
8. **i18n + nav + sitemap + SEO**.
9. **Migración Feb 2026** (seed idempotente) + verificación de fallback de locales.
10. **QA** (scripts reales del repo; **no existe `test`**): `pnpm build`, `pnpm typecheck`, `pnpm lint`,
    `pnpm i18n:check` (paridad de locales). Más: accesibilidad (lang tags, aria), cache, y
    **verificación de assets tras build/deploy** (§9.1).

---

## 13. Puntos abiertos / a confirmar contigo

**Todos resueltos:**
- ~~1. Área en actividades~~ → **No.** Área solo en informes. Eliminado de actividades y del filtro del listado.
- ~~2. Ruta de detalle~~ → **Única** `/transparencia/actividad/[slug]` con layout según `kind`.
- ~~3. Sección de admin~~ → **Una** sección «Actividad» con dos sub-vistas.
- ~~4. Navegación de informes~~ → **Selector de mes + banner**, sin página índice.
- ~~5. Origen de imágenes Feb 2026~~ → **Extraídas del PDF.**
- ~~6. Imagen opcional + fallback~~ → Imagen entrada → **default configurable** en `/admin/imagenes-por-defecto` → **icono**.
- ~~7. Programación~~ → **No.** Solo `active`.
- ~~8. Organizadores~~ → UJI/UIB de `asociados`, RITSI de `sectoriales`; desplegable mezcla ambas.

> Pendiente externo: tu decisión sobre **qué hacer con la newsletter actual** (PDF/email/suscriptores),
> que tratas en mensaje aparte. No bloquea este plan.
