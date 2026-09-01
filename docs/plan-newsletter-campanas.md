# Plan — Newsletter por campañas de contenido (sustituye al sistema de PDFs)

> Estado: plan de implementación, revisado. Decisiones cerradas salvo lo indicado en §15.
> Contexto: la newsletter deja de ser una edición mensual en PDF y pasa a ser un correo compuesto
> por una selección de noticias, entradas de actividad e informes de áreas ya publicados en la web.

---

## 1. Objetivo y alcance

**Objetivo.** Sustituir la newsletter-PDF por **campañas de contenido**: el admin selecciona piezas
ya publicadas en el sitio, las ordena, escribe una entradilla y envía un correo con el resumen y la
imagen de cada pieza, enlazando a la entrada correspondiente.

**Dentro de alcance**
- Modelo de datos nuevo (campañas + ítems + sus tablas de traducción) y migración *expand/contract*.
- Renderizado del correo multi-idioma con el idioma del suscriptor y fallback a español.
- CRUD de campañas en admin, con selectores de contenido de los tres tipos.
- Previsualización fiel del correo y envío de prueba a una dirección.
- Reutilización del pipeline de envío actual (lease, lotes, reintentos, rebotes).
- Estadísticas de entrega y de clic por pieza.
- Desmantelamiento completo del sistema de ediciones PDF: código, assets, despliegue y seed.
- Anclas y mejoras en las tarjetas de informes de áreas.

**Fuera de alcance**
- Suscripción, doble opt-in, consentimiento RGPD, tokens firmados y páginas de confirmación/baja:
  **no cambian de diseño**. La única excepción es un arreglo de idempotencia ya necesario hoy (§7.5).
- Programación de envíos, segmentación de audiencia y píxel de apertura (§15).

**Convenciones que se dan por aplicadas.** Todos los endpoints nuevos siguen el contrato de admin
del repositorio sin que haga falta repetirlo ruta a ruta: esquemas Zod compartidos en
`shared/utils/adminSchemas.ts`, respuestas `{ data }` / `{ data, meta }`, errores localizados vía
`adminApiErrorMessages`, bloqueo optimista por `updatedAt` y `AdminFormErrorSummary` en los
formularios.

---

## 2. Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Cadencia | **Ad-hoc.** Desaparece `month_key`, su unicidad y el selector de mes. |
| Histórico público | **Eliminado.** El apartado público conserva solo la suscripción. |
| Histórico en admin | **Se conserva**, con estadísticas de entrega e interacción. |
| Retrocompatibilidad de datos | **No hace falta.** Verificado: 13 ediciones cargadas, `sent_at` nulo en todas, 0 filas en `newsletter_deliveries`, 0 suscriptores. Nunca se ha enviado nada. |
| Contenido localizado | **Tablas de traducción**, nunca columnas JSON (AGENTS.md:563). |
| Idiomas | **Idioma del suscriptor con fallback a español**, por pieza. `subscriber.locale` nulo → `es`. |
| PDFs antiguos | **Se borran**, ficheros y rutas, tras el rescate verificado de §3.1. |
| Enlace de informes de área | **Ancla por área**: `…/informes/2026-02#area-<areaId>`. |
| Apariciones en medios | **Entran.** El clic lleva a `/prensa/en-los-medios/<slug>`. |
| Entradilla editorial | **Sí**, por idioma, con editor limitado y saneado obligatorio. |
| Contenido despublicado antes del envío | **Avisa y bloquea**: 409 con las piezas afectadas. |
| Cancelación de un envío | **Pausa inmutable.** Nunca se vuelve a borrador tras la primera entrega. |
| Estrategia de migración | **Expand/contract.** Se crea lo nuevo sin borrar lo viejo; el borrado va en la fase 7. |
| Previsualización | **Sí**, con selector de idioma y ancho. |
| Envío de prueba | **Sí**, a una dirección que teclea el admin. |
| Métricas de apertura | **No.** Sin píxel de seguimiento (§9.3). |
| Conteo de clics | **Agregado y anónimo**: el enlace lleva campaña + pieza, nunca destinatario. |
| Atribución de bajas | **Contador agregado en la campaña**, con HMAC de atribución firmado aparte. Sin `campaign_id` en el evento nominal (§7.5). |
| Semántica de `sent_at` | **Campaña terminada sin pendientes.** Una tanda con fallidos acaba en `failed`, no en `sent` (§4.6). |

---

## 3. Hallazgos previos que condicionan el trabajo

### 3.1 El PDF de febrero de 2026 — paso bloqueante e irreversible

`docs/handoff-actividad.md` señala `public/prensa/newsletter/documentos/newsletter-2026-02.pdf`
como material fuente del seed de contenido de febrero 2026, que **sigue bloqueado** (fase 9 de
`plan-seccion-actividad.md`: ~20 piezas × 6 idiomas + 31 imágenes por extraer de ese PDF).

**Antes de tocar nada:** copiar los 13 PDFs y sus portadas a almacenamiento persistente fuera del
árbol servido y **verificar la copia por checksum** (`sha256sum` de origen y destino) antes de
borrar nada. `backups/` está en `.gitignore:11`, así que sirve como destino local, pero un
directorio ignorado por Git **no es una copia de seguridad**: si el trabajo se hace en un entorno
efímero, la copia tiene que salir de la máquina. Alternativa: confirmar por escrito que el seed de
febrero ya no se hará.

Es el **único prerrequisito destructivo sobre ficheros fuente**: una vez borrados del disco, no
vuelven.

La fase 7 también destruye —el `DROP` se lleva las tablas y sus filas—, pero ahí la reversión existe
y tiene nombre: **copia de la base de datos antes de aplicar la migración**, más el código en Git.
Que la guarda impida borrar entregas registradas no convierte esa fase en reversible por sí sola.

### 3.2 Las apariciones en medios ya tienen página propia en CREUP

`app/pages/prensa/en-los-medios/[slug].vue` renderiza `PressArticleDetail`. El destino del clic es
uniforme para los tres tipos de prensa:

```ts
`${PRESS_ARTICLE_PUBLIC_LIST_PATHS[article.type]}/${article.slug}`
```

No hay caso especial que programar.

### 3.3 La CSP de producción bloqueará la previsualización

`nuxt.config.ts` define `frame-src` como `['https://challenges.cloudflare.com']` y solo añade
`'self'` cuando `isDev`. Un `<iframe>` de previsualización funcionaría en local y **fallaría en
producción**.

**No se añade `'self'` a la CSP global**: es más permisivo de lo necesario. Se aplica una regla de
ruta acotada a las páginas de admin de campañas, que ya están fuera de indexación:

```ts
'/admin/newsletter/campanas/**': { security: { headers: { contentSecurityPolicy: { 'frame-src': ["'self'"] } } } }
```

Hay que replicarla para los prefijos localizados (`/en/admin/...`), como ya hace
`localizedAdminRouteRules`, y **verificarlo con un build de producción**, no con `pnpm dev`.

### 3.4 El acceso de admin es plano

`server/utils/admin/adminAccess.ts` no tiene roles: cualquier admin activo puede todo. Como el envío
es irreversible y masivo, el diálogo de confirmación (§8.4) es la única barrera y debe exigir una
confirmación explícita.

### 3.5 `buildEmailLayout` no está exportado

`server/utils/email/emailTemplates.ts` la declara como `function` privada. El módulo nuevo no puede
reutilizarla sin exportarla. Se exporta junto a `buildEmailDividerRow` y `buildEmailButton`, que sí
lo están.

### 3.6 Bug de idempotencia preexistente en la baja

`performNewsletterUnsubscribeAction` actualiza el suscriptor **sin condicionar a `active = true`** y
registra el evento `unsubscribed` incondicionalmente, mientras que `performNewsletterConfirmAction`
sí condiciona a `active = false` y devuelve `already-confirmed` si no actualizó nada. Es una
asimetría que ya produce eventos duplicados hoy con cualquier doble petición, y que empeorará con
`List-Unsubscribe-Post`, donde los proveedores reintentan el POST. Se arregla en la fase 5 (§7.5).

---

## 4. Modelo de datos

### 4.1 `newsletter_campaigns`

Solo columnas **no localizadas**:

```
id                              text PK (cuid)
status                          text NOT NULL DEFAULT 'draft'
sent_at                         timestamptz
last_delivery_started_at        timestamptz
last_delivery_heartbeat_at      timestamptz
last_delivery_finished_at       timestamptz
last_delivery_total             integer
last_delivery_sent_count        integer
last_delivery_error_count       integer
last_delivery_failed_recipients jsonb
last_delivery_worker_token      text
unsubscribe_count               integer NOT NULL DEFAULT 0
created_at, updated_at          timestamptz NOT NULL

CHECK  status IN ('draft', 'queued', 'sending', 'sent', 'paused', 'failed')
CHECK  (status = 'sent') = (sent_at IS NOT NULL)
CHECK  (last_delivery_worker_token IS NOT NULL) = (status IN ('queued', 'sending'))
INDEX  (sent_at, last_delivery_worker_token)      -- el que ya usa el worker
INDEX  (status, created_at DESC)                  -- listado de admin
```

Todo el bloque `last_delivery_*` + `worker_token` conserva los mismos nombres para que
`newsletterDeliveryLease.ts` y `newsletterDeliveryRepository.ts` sigan funcionando con poco más que
un cambio de tabla.

**Los dos CHECK son equivalencias, no implicaciones.** Una implicación (`status <> 'sent' OR sent_at
IS NOT NULL`) seguiría admitiendo `draft` con `sent_at`, `failed` con `sent_at`, o `sending` sin
token. Con la forma bicondicional, las cuatro combinaciones incoherentes las rechaza la base de
datos: `status` queda como proyección legible de lo que el pipeline ya deriva de `sent_at` +
`worker_token`, nunca como segunda fuente de verdad.

Consecuencia práctica de la primera equivalencia: en `draft`, `paused` y `failed`, `sent_at` es
siempre nulo, que es justo lo que exige el lease para poder reclamar la campaña (§4.6).

Desaparecen: `month_key`, `month`, `cover_image`, `pdf_url`, `public_visible`.

### 4.2 `newsletter_campaign_translations`

```
id            text PK (cuid)
campaign_id   text NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE
locale        text NOT NULL
subject       text NOT NULL
preheader     text
intro_html    text
created_at, updated_at

UNIQUE (locale, campaign_id)
CHECK  buildSupportedLocaleCheck(locale)
INDEX  (campaign_id)
```

Patrón idéntico al de `press_article_translations` y compañía. La obligatoriedad de la fila `es`
—que es el fallback de todo lo demás— no se puede expresar limpiamente como CHECK sobre otra tabla:
se valida en Zod al guardar y se vuelve a comprobar como precondición del envío (§7.3).

`intro_html` se sanea **al guardar y al renderizar**, igual que hacen `pressTranslation.ts` y
`activityTranslation.ts`. Es doblemente necesario aquí: el HTML acaba dentro de un iframe de
previsualización y dentro de correos que no se pueden corregir después.

**Pero no con `sanitizeRichTextHtml` a secas.** Su lista blanca
(`server/utils/press/pressTranslation.ts:52`) admite `h2`, `h3`, `blockquote`, `ul`, `ol` y `li`
además de los de texto. Limitar la barra del editor no impide nada: una petición de admin construida
a mano puede mandar cualquiera de esos elementos, y un `<blockquote>` o una lista se comportan de
forma dispar entre clientes de correo. Se añade **`sanitizeNewsletterIntroHtml`** en el mismo módulo,
con la misma configuración de DOMPurify pero la lista blanca acotada a `p`, `br`, `strong`, `em`,
`b`, `i` y `a` (atributos `href`, `target`). Así la restricción vive en el servidor, no en la
interfaz.

De paso, `extractPlainText` de ese mismo módulo sirve para dos cosas de este plan: la alternativa en
texto plano (§6.5) y el truncado de resúmenes de informes de área (§5).

### 4.3 `newsletter_campaign_items`

```
id            text PK (cuid)
campaign_id   text NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE
position      integer NOT NULL
item_type     text NOT NULL       -- 'press' | 'activity' | 'area_report'
item_id       text NOT NULL       -- id en press_articles / activity_entries / area_reports
snapshot      jsonb               -- NULL en borrador; congelado al enviar (§4.5)
click_count   integer NOT NULL DEFAULT 0
created_at, updated_at

CHECK   item_type IN ('press', 'activity', 'area_report')
CHECK   position >= 0
UNIQUE  (campaign_id, item_type, item_id)
INDEX   (campaign_id, position)
INDEX   USING gin ((snapshot -> 'assetPaths'))
```

El índice GIN no es opcional: `adminAssetReferences` consulta `snapshot -> 'assetPaths' ? $1` en
**cada** limpieza de assets, el operador `?` no puede usar un btree y las filas de campaña se
acumulan para siempre. Sin él, cada borrado de imagen provoca un recorrido secuencial que crece con
el histórico. El repositorio ya usa `USING gin` para los índices trigram, así que está en idioma.

**Referencia polimórfica sin FK, deliberadamente.** Mismo criterio que `area_reports.area_id`: la
pieza puede desaparecer y la campaña enviada debe sobrevivir con su snapshot. La comprobación de
existencia se hace en el envío (§7.3), no en la base de datos.

`position` se valida en la aplicación como **secuencia completa desde 0, sin huecos ni duplicados**,
al reemplazar la lista entera (§7.1). Sin `UNIQUE` sobre `position`: reordenar con una restricción
única obliga a escrituras en dos pasos.

### 4.4 `newsletter_campaign_item_translations`

```
id                text PK (cuid)
campaign_item_id  text NOT NULL REFERENCES newsletter_campaign_items(id) ON DELETE CASCADE
locale            text NOT NULL
title_override    text
excerpt_override  text
created_at, updated_at

UNIQUE (locale, campaign_item_id)
CHECK  buildSupportedLocaleCheck(locale)
INDEX  (campaign_item_id)
```

### 4.5 El snapshot

`newsletter_campaign_items.snapshot` es el único JSONB del modelo, y lo es por la razón por la que
el repositorio ya usa JSONB en `memberOrgSnapshot` y `areaNameSnapshot`: es una **fotografía
inmutable**, no contenido editable. Lleva esquema Zod validado en la frontera de aplicación al
escribirlo y al leerlo.

Forma:

```jsonc
{
  "assetPaths": ["prensa/imagenes/...webp"],   // rutas de ALMACENAMIENTO, deduplicadas
  "locales": {
    "es": {
      "title": "…",
      "excerpt": "…",
      "imagePath": "prensa/imagenes/...webp",  // ruta de almacenamiento, no URL absoluta; nullable
      "imageAlt": "…",                          // nullable
      "dateLabel": "…",
      "targetPath": "/prensa/notas-prensa/mi-slug"   // sin prefijo de idioma
    },
    "en": { … }, "ca": { … }, "eu": { … }, "gl": { … }, "val": { … }
  }
}
```

Tres decisiones que la revisión obliga a hacer explícitas:

**Es denso.** Siempre los seis locales, con el fallback ya resuelto. Así el renderizado (§6.6) y la
ruta de clic (§7.6) leen `snapshot.locales[locale]` sin comprobaciones ni fallback en caliente.

**Guarda rutas de almacenamiento, no URLs absolutas.** `adminAssetReferences.ts` compara contra
`storagePath`; una URL absoluta sería invisible para el recolector de assets. La URL absoluta y la
localización del destino se construyen al renderizar y al redirigir.

**El recolector de assets tiene que aprender a mirar dentro.** Hoy `ASSET_JSON_REGISTRY` es
`{ table, column, key }` y genera `column->>key`, que **no puede alcanzar** una estructura anidada
por locale. Sin extenderlo, borrar una noticia dejaría su imagen huérfana y el recolector la
eliminaría, rompiendo tanto los reintentos como los correos ya entregados que se abran después.
Por eso el snapshot lleva `assetPaths` como array plano de primer nivel y el registro gana una
variante de pertenencia a array:

```sql
SELECT 1 FROM newsletter_campaign_items
 WHERE snapshot -> 'assetPaths' ? $1
```

Es trabajo real de la fase 5, no una nota al pie. La alternativa —copiar cada imagen a un
almacenamiento propio e inmutable de la campaña— multiplica el espacio en disco por campaña y no
compensa para un boletín.

**No basta con impedir el borrado: hay que impedir la despublicación.**
`reconcileAdminAssetPublication` recorre entidad por entidad llamando a `finalize` con
`publish: item.active`. Si se despublica una noticia cuya imagen usa una campaña ya enviada, ese
bucle moverá el fichero a almacenamiento inactivo y el correo que ya está en los buzones se quedará
sin imagen, aunque `adminAssetReferences` haya evitado su borrado. Son dos mecanismos distintos.

La regla, y el orden importa:

1. **Antes** de recorrer nada, calcular el conjunto global de rutas protegidas por snapshots:
   `SELECT DISTINCT jsonb_array_elements_text(snapshot -> 'assetPaths') FROM newsletter_campaign_items
   WHERE snapshot IS NOT NULL`.
2. Al reconciliar cada entidad, una ruta de ese conjunto se trata **siempre como publicada**, sea
   cual sea el `active` de la pieza que la originó.

Calcularlo primero y no como una rama más del bucle es lo que evita que el resultado dependa del
orden de recorrido y que un fichero se mueva a inactivo para volver a publicarse dos iteraciones
después.

### 4.6 Máquina de estados

#### Qué significa `sent_at`

**`sent_at` = la campaña está terminada y no queda ninguna entrega pendiente ni fallida.** No es «se
empezó a enviar» ni «terminó la tanda».

Esta definición no es una preferencia: `claimNewsletterDeliveryWorker` filtra por
`isNull(newsletters.sentAt)` (`newsletterDeliveryLease.ts`). Una campaña con `sent_at` **no puede
volver a reclamarse jamás**. Si se marcase `sent` con fallidos pendientes, «reenviar a fallidos»
sería imposible sin borrar `sent_at` a mano —rompiendo su significado— y el barrido de recuperación
(`worker_token IS NOT NULL AND sent_at IS NULL`) tampoco la encontraría.

De ahí que el resultado de una tanda con fallos sea `failed`, no `sent`.

#### Transiciones

| Desde | Acción | Hacia | Notas |
|---|---|---|---|
| `draft` | editar textos, ítems u orden | `draft` | bloqueo optimista sobre la campaña |
| `draft` | enviar | `queued` | valida, congela snapshot, reclama token (§7.3) |
| `queued` | el worker toma el job | `sending` | |
| `queued` | falló el encolado en BullMQ | `queued` | recuperable por el barrido (§7.4) |
| `sending` | termina **sin entregas en `failed` ni `queued`** | `sent` | fija `sent_at`, libera token. Terminal. |
| `sending` | termina **quedando entregas en `failed`** | `failed` | libera token, `sent_at` sigue nulo |
| `sending` | error irrecuperable del run | `failed` | igual que arriba |
| `queued` / `sending` | cancelar | `paused` | las entregas `sending` vuelven a `queued` (`requeueSendingNewsletterDeliveries`) |
| `paused` | reanudar | `queued` | **solo las pendientes**; el snapshot no se recalcula |
| `failed` | reenviar a fallidos | `queued` | `resetNewsletterDeliveryRetryState` sobre las `failed`; vuelve a reclamar token |
| `sent` | — | — | **estado terminal**: no admite reenvío ni reanudación |

Las tres transiciones que devuelven a `queued` funcionan con el lease **sin modificarlo**: por la
primera equivalencia de §4.1, `paused` y `failed` tienen `sent_at` nulo, que es lo único que el
lease exige.

**Reglas duras**

- **Nunca se vuelve a `draft`** una vez existe `sent_at` o una sola fila en
  `newsletter_campaign_deliveries`. Volver permitiría cambiar el contenido y enviar versiones
  distintas bajo la misma campaña, que es exactamente lo que el snapshot congelado evita.
- **`paused` no es un borrador**: conserva snapshot y entregas, y es inmutable salvo por reanudar.
  Una campaña pausada que no se quiera continuar se queda pausada; no hay «deshacer envío».
- **`failed` no es un error fatal**, es «terminó con destinatarios pendientes». La interfaz debe
  llamarlo así —«enviada con incidencias»— o inducirá a error.
- **Campaña sin destinatarios**: `seedNewsletterDeliveries` produce 0 filas → el run termina de
  inmediato en `sent` con `last_delivery_total = 0`. No debe quedarse colgada en `queued`, y hay que
  probarlo explícitamente.
- `status` se escribe **siempre en la misma sentencia** que `sent_at` / `worker_token`. Con el CHECK
  bicondicional no se puede reclamar el token primero y poner `status = 'queued'` después: el paso
  intermedio ya viola la restricción. En concreto:
  - `claimNewsletterDeliveryWorker` añade `status: 'queued'` a su propio `.set()`, y su
    actualización debe poder participar en la transacción del envío (§7.3) — es decir, aceptar el
    executor de la transacción, no usar `db` directamente.
  - `releaseNewsletterDeliveryWorker` recibe `status` por su parámetro `values`, que ya existe para
    justo esto.
  - La transición a `sending` la hace el worker al empezar el run, en una sola actualización.

  Los CHECK de §4.1 hacen que cualquier olvido falle en la base de datos en vez de divergir.
- **La cancelación gana la carrera contra el cierre del run.** Si un admin cancela mientras el worker
  termina, `releaseNewsletterDeliveryWorker` no encuentra su token —ya es nulo— y su actualización
  no hace nada, así que `paused` no se pisa. Es el comportamiento actual y hay que conservarlo: la
  liberación **debe** seguir condicionada al token.

### 4.7 `newsletter_campaign_deliveries`

Es la `newsletter_deliveries` de siempre con `newsletter_id` sustituido por `campaign_id`, apuntando
a `newsletter_campaigns`. El resto (status, attempts, lastError, índices, CHECK) queda igual.

**Nombre distinto a propósito.** Durante el *expand* (§4.9) la tabla antigua sigue en pie ocupando
el nombre `newsletter_deliveries`, así que la nueva nace ya con el suyo definitivo. En la fase 7 se
elimina la antigua y **no hay renombrado posterior**: `newsletter_campaign_deliveries` es el nombre
final.

### 4.8 Lo que NO se toca

`newsletter_subscribers` y `newsletter_subscription_events` **no cambian de esquema**. En concreto,
`newsletter_subscription_events` **no** gana una columna `campaign_id`: la atribución de bajas se
resuelve con un contador agregado en la campaña (§7.5.3). Añadir la campaña al evento nominal ―que
contiene el email― crearía una asociación de datos personales nueva a cambio de poco, y obligaría a
firmar el `campaignId` dentro del token de baja, que hoy solo firma suscriptor y fecha de alta.

### 4.9 Migración: expand ahora, contract al final

La revisión tiene razón en que una fase 1 que reemplace tablas deja el repositorio sin compilar:
más de treinta ficheros importan `newsletters`. La migración se parte en dos:

**Fase 1 — expand (solo crea).**
`newsletter_campaigns`, `newsletter_campaign_translations`, `newsletter_campaign_items`,
`newsletter_campaign_item_translations` y `newsletter_campaign_deliveries` (§4.7). `newsletters` y
`newsletter_deliveries` **siguen en pie**, con su código intacto. Todo compila y el admin de
newsletter antiguo sigue funcionando durante toda la construcción.

**Fase 7 — contract (borra).**
Elimina `newsletters` y la tabla de entregas antigua. La guarda va **dentro de la propia migración**,
no como comprobación manual que se puede olvidar:

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM newsletters WHERE sent_at IS NOT NULL)
     OR EXISTS (SELECT 1 FROM newsletter_deliveries) THEN
    RAISE EXCEPTION 'Hay newsletters enviadas o entregas registradas: revisar antes de borrar.';
  END IF;
END $$;
```

Si salta, la migración aborta y hay que replantear el borrado como conversión. `newsletter_subscribers`
no se toca en ningún caso.

La guarda evita borrar **datos que importan**, no convierte el `DROP` en reversible: hay que tomar
copia de la base de datos antes de aplicar esta migración en producción (§3.1).

---

## 5. Reglas de proyección: de pieza publicada a bloque de correo

Sin esto, cada tipo se implementa a ojo. Para cada locale del snapshot:

| Campo | `press` | `activity` | `area_report` |
|---|---|---|---|
| `title` | `press_article_translations.title` | `activity_entry_translations.title` | **nombre del área** desde `areaNameSnapshot` (no hay título propio) |
| `excerpt` | `description` | `excerpt` | **no existe**: `excerpt_override` del admin o, si falta, texto extraído de `contentHtml` truncado a ~200 caracteres en límite de palabra |
| `imagePath` | `press_articles.image` | `activity_entries.image` | `area_reports.image` |
| imagen por defecto | `('press', <type>)` | `('activity', 'entry')` | `('area_report', 'report')` |
| `imageAlt` | `translations.alt` | `translations.alt` | `translations.alt` |
| `dateLabel` | `published_at` | `start_date` (+ `end_date` si hay rango) | etiqueta de la edición (`covers_from`…`month_key`) |
| `targetPath` | `PRESS_ARTICLE_PUBLIC_LIST_PATHS[type]/<slug>` | `${ACTIVITY_PUBLIC_BASE_PATH}/<slug>` | `${AREA_REPORTS_PUBLIC_BASE_PATH}/<monthKey>#area-<areaId>` |

**Imágenes por defecto**: se resuelven **al congelar**, no al renderizar. Una campaña enviada no
debe cambiar de aspecto porque un admin suba luego otra imagen por defecto.

**`imagePath` e `imageAlt` son nulables**, y hay que decidir los dos casos:

- Sin imagen propia y sin imagen por defecto configurada para ese slot → `imagePath: null`, y el
  bloque se renderiza sin `<img>`. En correo no hay iconos de reserva que valgan.
- Con imagen por defecto → el `alt` de la pieza no aplica (es genérico, no describe nada de esta
  noticia). Se usa **`alt=""`**, que es lo correcto para una imagen decorativa: un lector de
  pantalla la salta en vez de leer un texto que no aporta. Nunca se deriva el `alt` del titular,
  que ya está justo debajo como texto.

**Informes de área**: como no tienen ni título ni extracto propios, el editor marca visiblemente el
`excerpt_override` como recomendado para este tipo. El truncado automático es la red, no el plan.

---

## 6. Renderizado del correo

### 6.1 Estructura

```
┌ Cabecera de marca (banner existente)
├ Entradilla editorial (opcional, HTML saneado)
├ Sección «Noticias»
│   └ por pieza: imagen 560 px · titular · resumen · «Leer más →»
├ Sección «Actividad»
├ Sección «Informes de áreas»
└ Pie: motivo de recepción · darse de baja
```

Las secciones van siempre en ese orden; dentro de cada una manda el `position` del admin.

Solo resumen, nunca contenido completo: el HTML de una nota de prensa se rompe en Outlook y Gmail
recorta los correos que pasan de ~102 KB, lo que además esconde el pie con el enlace de baja.

### 6.2 Módulo nuevo

`server/utils/email/newsletterCampaignTemplate.ts`:

```ts
buildCampaignEmailHtml(options: {
  localeCode: SupportedLocaleCode      // 'val', no 'ca-ES-valencia'
  subject: string
  preheader: string | null
  introHtml: string | null             // ya saneado
  sections: CampaignEmailSection[]     // ya resueltas al locale desde el snapshot
  siteUrl: string
}): string

buildCampaignEmailText(options): string
```

Ninguna de las dos recibe el enlace de baja: emiten el centinela de §6.6.

### 6.3 Código de locale frente a etiqueta de idioma

Son cosas distintas y confundirlas rompe el valenciano:

- **Código interno**: `val`. Es lo que identifica la fila de traducción y el prefijo de URL.
- **Etiqueta BCP 47**: `ca-ES-valencia`. Es lo que va en `<html lang>` y lo que entiende `Intl`.

La fuente correcta es `LOCALE_DEFINITIONS[].language` (`shared/constants/locales.ts`), nunca el
código. Se añade un ayudante `resolveLanguageTag(code)` y se usa en los dos sitios. `Intl.DateTimeFormat`
recibe la etiqueta, no el código.

### 6.4 Cambios en `emailTemplates.ts`

- **Exportar `buildEmailLayout`** (§3.5).
- Añadirle un parámetro `lang` opcional con `'es-ES'` por defecto, para no tocar los otros dos usos
  (contacto y confirmación de suscripción).
- Eliminar `buildNewsletterDeliveryEmailHtml` y su interfaz, que son del sistema de PDFs (fase 7).

### 6.5 Escapado y saneado

Regla explícita por campo, porque aquí se mezcla texto de admin con contenido de la base de datos:

| Campo | Tratamiento |
|---|---|
| `subject` | `escapeHtml` en el HTML; **sin escapar** en la cabecera del correo (lo codifica nodemailer) |
| `preheader` | `escapeHtml` |
| `introHtml` | `sanitizeNewsletterIntroHtml` (§4.2) al guardar **y** al renderizar |
| `title`, `excerpt`, `dateLabel` | `escapeHtml` |
| `imageAlt` | `escapeHtmlForAttribute` |
| URLs (`src`, `href`) | construidas por código, `escapeHtmlForAttribute` |

El texto plano de la entradilla se deriva del HTML **ya saneado** (quitar etiquetas, conservar los
href como texto entre paréntesis), nunca del HTML crudo.

### 6.6 Reutilización por idioma

Renderizar por suscriptor sería N renders. En su lugar: **un render por locale** (máximo 6),
reutilizado para todos los suscriptores de ese idioma. Los enlaces de clic son agregados y no
dependen del destinatario, así que no rompen la reutilización.

Lo único que varía por suscriptor es el enlace de baja. Dos detalles o la optimización se rompe:

- **El render emite un centinela fijo**, `{{UNSUBSCRIBE_URL}}`, que el mailer sustituye por la URL
  firmada de cada destinatario. Tiene que **sobrevivir a `escapeHtmlForAttribute`** (nada de comillas
  ni `&`), porque va dentro de un `href` cargado de `style=`. Nada de buscar la URL con una expresión
  regular sobre el HTML ya renderizado.
- **La caché de renders vive en el ámbito de la ejecución, no del lote.**
  `processNewsletterDeliveryRun` crea un `pLimit(5)` nuevo por lote; si el `Map<localeCode, string>`
  se declara dentro del bucle, se re-renderiza seis veces por lote y la optimización desaparece.

Las cabeceras `List-Unsubscribe` y `List-Unsubscribe-Post` no forman parte del HTML: se construyen
por destinatario sin pasar por el centinela.

### 6.7 Reglas de idioma

1. `subscriber.locale` nulo o no soportado → `es`.
2. Cada pieza resuelve su traducción con el locale del suscriptor y, si falta, con `es`.
3. `subject` / `preheader` / `intro` siguen la misma regla: basta con rellenar `es`.
4. Todo se resuelve **al congelar el snapshot**, no al enviar cada correo.

Estado actual del contenido: prensa tiene los 6 locales (es=464, resto 395 cada uno), pero
**actividad e informes de áreas solo tienen `es`** (132 y 80 filas). Hoy, un suscriptor en catalán
recibirá los rótulos y las noticias en catalán, y la actividad y los informes en español.

### 6.8 Textos fijos del correo

Los rótulos («Noticias», «Leer más», «Darme de baja», el motivo de recepción) son **de servidor**.
Siguen el patrón de `server/utils/locale/apiErrorMessages.ts`: módulo nuevo
`server/utils/locale/newsletterEmailMessages.ts` con un objeto por locale y resolución vía
`pickLocalizedValue`. **No van a `i18n/locales/*.json`**, que es para la interfaz.

### 6.9 Cabeceras y tamaño

Se conserva `List-Unsubscribe` y se añade `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
(RFC 8058), requisito de los remitentes masivos en Gmail y Yahoo.

`server/api/newsletter-unsubscribe.post.ts` ya encaja: acepta el token por cuerpo **o por query**,
no exige Turnstile y responde sin confirmación adicional. Dos ajustes:

- `List-Unsubscribe` debe apuntar a esa ruta con el token en la query, no a `/desuscribirse`: quien
  hace el POST es el proveedor de correo, no una persona.
- Su límite actual —`namespace: 'newsletter-unsubscribe'`, 10 peticiones por IP cada 15 minutos—
  estrangularía las bajas de un clic, que llegan agrupadas desde las IPs del proveedor de correo.

**Cómo se distingue una vía de otra**: la baja humana llega desde `/desuscribirse` como POST con el
token en el **cuerpo**; la de RFC 8058 llega directa al endpoint con el token en la **query** y el
cuerpo `List-Unsubscribe=One-Click`.

Pero no basta con subir el número: **para la vía RFC 8058, limitar por IP es limitar por proveedor**.
Gmail o Yahoo emiten bajas legítimas de destinatarios distintos desde un puñado de IPs, así que
cualquier umbral por IP acaba estrangulando bajas reales. La clave tiene que ser la suscripción, no
el origen:

| Vía | Espacio de nombres | Clave efectiva | Máximo | Ventana |
|---|---|---|---|---|
| Humana (token en cuerpo) | `newsletter-unsubscribe` | IP | 10 | 15 min |
| RFC 8058 (token en query) | `newsletter-unsubscribe-oneclick:<sha256(token)>` | token | 10 | 15 min |

Así caben miles de bajas simultáneas desde la misma infraestructura y se frena la repetición abusiva
sobre una misma suscripción. **El token nunca va en claro en la clave de Redis**: se guarda su
SHA-256. Ambas vías siguen siendo *fail-open* si Redis cae; el token firmado es la autorización real
y el límite solo frena el ruido.

**Control de tamaño**: al construir cada render se mide el tamaño real en bytes del HTML. Aviso en
el editor por número de piezas, pero **la validación dura es por bytes**, con margen bajo los 102 KB
del recorte de Gmail, y se comprueba **para cada idioma** porque no todos pesan igual.

Dos detalles que cambian el resultado:

- Se mide **después de sustituir el centinela** `{{UNSUBSCRIBE_URL}}` por una URL de baja de longitud
  máxima realista —token firmado, `campaignId` y HMAC de atribución (§7.5.3)—, no sobre el HTML con
  el centinela, que es mucho más corto. Son unos cientos de bytes, justo el margen que se mide.
- Se mide con **`Buffer.byteLength(html, 'utf8')`**, no con `html.length`. El umbral de Gmail es de
  bytes y el contenido va lleno de acentos, «ñ» y comillas tipográficas: en español la diferencia
  entre caracteres y bytes es de varios puntos porcentuales.

---

## 7. API

### 7.1 Admin — campañas

| Método y ruta | Función |
|---|---|
| `GET /api/admin/newsletter/campaigns` | Listado paginado con estado y métricas resumidas. |
| `POST /api/admin/newsletter/campaigns` | Crea borrador. |
| `GET /api/admin/newsletter/campaigns/[id]` | Campaña + traducciones + ítems + estadísticas. |
| `PUT /api/admin/newsletter/campaigns/[id]` | Traducciones. Solo en `draft`. |
| `DELETE /api/admin/newsletter/campaigns/[id]` | Solo `draft`. |
| `PUT /api/admin/newsletter/campaigns/[id]/items` | Reemplaza la lista de ítems, su orden y sus overrides. |
| `POST /api/admin/newsletter/campaigns/[id]/duplicate` | Copia traducciones e ítems a un borrador nuevo. |
| `GET /api/admin/newsletter/campaigns/[id]/preview?locale=` | Devuelve `text/html`. |
| `POST /api/admin/newsletter/campaigns/[id]/test-send` | Envía una prueba a una dirección. |
| `POST /api/admin/newsletter/campaigns/[id]/send` | Valida, congela y encola. |
| `DELETE /api/admin/newsletter/campaigns/[id]/send` | Cancela → `paused`. |
| `POST /api/admin/newsletter/campaigns/[id]/resume` | Reanuda → `queued`. **Dos cuerpos tras un mismo endpoint** (§4.6): desde `paused` solo reclama el lease, porque las entregas ya están en `queued`; desde `failed` aplica antes `resetNewsletterDeliveryRetryState` a las entregas en `failed`. Rechaza cualquier otro estado. |

**`PUT …/items` es una mutación del padre.** Recibe el `updatedAt` de la **campaña**, bloquea la
campaña, valida la secuencia de `position` y **actualiza el `updatedAt` de la campaña**. Sin esto,
el bloqueo optimista de los textos no protegería los cambios de contenido y dos admins podrían
pisarse sin enterarse.

`POST …/duplicate` es una operación de backend en una transacción, no una secuencia de llamadas
desde el cliente, y copia **solo lo editable**: traducciones e ítems con sus overrides. Nunca el
snapshot, ni el estado, ni las métricas.

### 7.2 Admin — selección de contenido

`GET /api/admin/newsletter/content?type=&q=&since=&limit=&offset=`

**Corrección sobre la versión anterior de este plan.** Ni el buscador ni el «desde» funcionan igual
en los tres tipos:

| Tipo | Buscador | Fecha para «desde» |
|---|---|---|
| `press` | trigram sobre `title` y `description` (`idx_press_article_translations_{title,description}_trgm`) | `published_at` |
| `activity` | trigram sobre `title` y `excerpt` (`idx_activity_entry_translations_{title,excerpt}_trgm`) | `created_at` |
| `area_report` | **no hay índice trigram**: `area_report_translations` no tiene ni título ni extracto. Se busca por **nombre de área** (sobre `area_name_snapshot`) y por mes de la edición | `created_at` |

Y la acción no puede llamarse «publicado desde el último envío», porque solo prensa tiene fecha de
publicación: `activity_entries.start_date` es la fecha **del evento** y
`area_report_editions.month_key` es el **periodo cubierto**. Una actividad antigua dada de alta hoy
quedaría fuera, y un evento futuro creado hace meses podría colarse una y otra vez.

Se llama **«añadir lo incorporado desde el último envío»** y usa `published_at` para prensa y
`created_at` para los otros dos, que es lo que ambas tablas ya tienen y lo único honesto disponible.
No se añade una columna nueva.

**«El último envío» no es `MAX(sent_at)`, pero tampoco «la última que se intentó».** Una campaña en
`failed` llegó a casi todo el mundo (§4.6), así que tomarla por no enviada volvería a proponer
contenido ya mandado. Pero cortar por el simple hecho de haber empezado esconde contenido que **nadie
recibió**: una campaña pausada antes del primer correo, una que murió por SMTP antes de entregar
nada, una que se quedó `queued` por una caída de Redis, o una que no tenía destinatarios.

El corte es el `last_delivery_started_at` más reciente **entre las campañas que entregaron algo**:

```sql
SELECT max(last_delivery_started_at)
  FROM newsletter_campaigns
 WHERE coalesce(last_delivery_sent_count, 0) > 0
```

Es decir: la acción significa **«contenido que ya recibió alguien»**, no «contenido que se intentó
mandar». Si no hay ninguna campaña con entregas, no hay corte y se ofrece todo.

### 7.3 Envío: bloquear, validar, congelar

Dentro de **una** transacción, en este orden:

1. `SELECT … FROM newsletter_campaigns WHERE id = $1 FOR UPDATE` — impide dos envíos simultáneos.
2. Valida `status = 'draft'`, que hay al menos un ítem y que existe la traducción `es`.
3. Carga las piezas referenciadas **con bloqueo de fila** (`FOR UPDATE`), en un **orden total por
   `(item_type, item_id)`**. Son tres tablas distintas, así que ordenar solo por id no define un
   orden global: hay que fijar además el orden entre tipos (`press` → `activity` → `area_report`) y
   respetarlo siempre, o dos envíos simultáneos pueden bloquearse en cruz.
4. Comprueba que cada una existe y sigue `active`. Si alguna falla → **409** con la lista de piezas
   afectadas y su motivo. Este es el «avisa y bloquea»: dentro del worker no hay a quién avisar.
5. Escribe el snapshot denso de cada ítem, pone `status = 'queued'` y reclama el worker token.

El bloqueo de filas del paso 3 es lo que la revisión reclama con razón: con el aislamiento
`READ COMMITTED` por defecto, «la misma transacción» no impide que otro admin despublique una pieza
entre la consulta de validación y la escritura del snapshot. El repositorio ya resuelve exactamente
esta carrera en `server/utils/admin/activitySnapshots.ts` —cuyo comentario de cabecera la
documenta— y se sigue ese patrón en vez de subir el nivel de aislamiento.

### 7.4 La frontera PostgreSQL / BullMQ

No hay transacción común entre Postgres y Redis, así que la secuencia se escribe con esa asimetría
asumida:

1. Transacción de §7.3.
2. **COMMIT.**
3. Encolar el job en BullMQ.
4. Si el encolado falla: la campaña queda en `queued` con token, **en estado recuperable**. No se
   revierte el snapshot ni se libera el token a mano desde el `catch`, porque ese `catch` puede no
   llegar a ejecutarse.

La red es `processPendingNewsletterDeliveries`, que ya existe y se ejecuta al arrancar el proceso.
Busca exactamente el caso que nos ocupa —`worker_token IS NOT NULL AND sent_at IS NULL`— y **ejecuta
el run en el propio proceso**, no lo reencola en BullMQ.

Precisión: eso **no** la hace independiente de Redis. El *procesamiento* es local, pero el disparador
periódico es un job de BullMQ, que vive en Redis. La garantía real —y es la que importa— es que la
campaña queda en un estado del que se recupera **en cuanto Redis vuelve**, sin intervención manual y
sin haber perdido el snapshot.

**Pasa de ser una salvaguarda de arranque a ser parte del contrato**, así que hay que ejecutarla
también de forma periódica —`ensureBackgroundJobSchedulers` en `backgroundJobs.ts` es el sitio— y
probar explícitamente el caso «Redis caído justo después del commit». Ojo al adaptarla: hoy ordena
por `lastDeliveryStartedAt` e `id` sobre `newsletters`; sobre campañas conviene mantener ese orden
determinista.

### 7.5 La baja: idempotencia y atribución

Dos cosas distintas que se tocan en el mismo sitio.

#### 7.5.1 Arreglo de idempotencia (bug preexistente)

En `performNewsletterUnsubscribeAction`:

- Condicionar el `UPDATE` a `active = true` y usar `.returning()`.
- Registrar el evento `unsubscribed` **solo si la fila cambió realmente** de activa a inactiva.
- Incrementar el contador de bajas de la campaña solo en esa misma rama.
- Devolver `unsubscribed` igualmente cuando la fila ya estaba inactiva: para quien pulsa, el
  resultado es el mismo. **Idempotente es la respuesta, no los efectos**: el evento y el contador se
  escriben únicamente en la rama en la que el `UPDATE` devolvió fila. Un POST repetido de RFC 8058
  responde igual y no suma nada.

Queda simétrico con `performNewsletterConfirmAction`, que ya lo hace bien.

#### 7.5.2 Atribución de campaña, de extremo a extremo

El contador de §9.2 no se llena solo. Hacen falta **dos URLs por destinatario**, ambas con los
mismos tres parámetros:

| Uso | URL |
|---|---|
| Enlace visible del pie | `/desuscribirse?token=…&c=<campaignId>&a=<attribution>` |
| Cabecera `List-Unsubscribe` (RFC 8058) | `/api/newsletter-unsubscribe?token=…&c=<campaignId>&a=<attribution>` |

Y **tres cambios que la versión anterior de este plan daba por inexistentes**:

1. **`app/pages/desuscribirse.vue` deja de estar intacta.** Hoy solo lee `route.query.token` y
   envía `{ token }` al endpoint, así que toda baja hecha desde el enlace visible —la vía normal—
   se perdería sin atribuir. Tiene que leer `c` y `a` y reenviarlos en el cuerpo.
2. **`server/api/newsletter-unsubscribe.post.ts`** acepta los dos parámetros nuevos, por cuerpo o
   por query, y los valida con Zod como opcionales.
3. **`performNewsletterUnsubscribeAction`** recibe la atribución y solo la aplica si verifica.

#### 7.5.3 La atribución va firmada, pero aparte

El `campaignId` desnudo en la URL permitiría que cualquiera con un token válido cargase su baja a
la campaña que quisiera. No es «un contador desviado en uno»: es una baja real desviada por cada
persona que quiera hacerlo, y se acumula.

Se firma **solo la atribución**, con un HMAC independiente que reutiliza el secreto ya existente
(`NEWSLETTER_TOKEN_SECRET`, con `APP_SECRET` de reserva) pero **no la estructura de token**:

```
a = HMAC-SHA256(secreto, 'v1:attribution:<subscriberId>:<campaignId>:<subscribedAtMs>')
```

**Tres decisiones dentro de esa línea:**

**El dominio `attribution` es obligatorio.** `buildNewsletterTokenSignature` incluye el `kind` en lo
que firma precisamente para que una firma de un dominio no valga en otro. Sin él, una firma de
atribución sería replayable como firma de baja y al revés.

**`subscribedAtMs` también es obligatorio**, y por la misma razón por la que el token de baja ya lo
lleva. Sin él existe este camino: alguien recibe la campaña A y guarda su `a`; se da de baja; se
vuelve a suscribir —misma fila, mismo `subscriberId`, `subscribedAt` nuevo—; recibe la campaña B con
un token de baja nuevo y válido; combina ese token con la `c` y la `a` de A, y su segunda baja se
atribuye otra vez a A. Ligar la firma al ciclo de suscripción lo cierra: una atribución emitida
antes de la reactivación no acompaña a un token emitido después.

**Helpers propios, no ampliar los de token.** Una atribución no es un token: no se parsea, no lleva
payload, solo se verifica contra valores que ya se conocen. Se añaden
`createNewsletterAttributionSignature(subscriberId, campaignId, subscribedAt)` y
`verifyNewsletterAttributionSignature(...)`, sin tocar la unión de tipos de `createNewsletterToken`
ni de `parseSignedNewsletterToken`. La verificación compara con **`timingSafeEqual`** y comprobación
de longitud previa, exactamente como `parseSignedNewsletterToken` (`newsletterSubscribers.ts:117-123`).

Es la opción menos invasiva de las posibles: **no cambia el token de baja** —que sigue siendo la
única autorización para darse de baja— y **no guarda ninguna relación persona-campaña**. La
atribución se verifica, se usa para incrementar un entero, y se descarta.

Si `a` falta o no verifica, la baja **se ejecuta igualmente** y simplemente no se atribuye: la
métrica nunca puede impedir que alguien se dé de baja.

### 7.6 Ruta de clic

`GET /nl/c/[campaignId]/[itemId]?l=<localeCode>` → **302**.

- **Zod** sobre los dos parámetros de ruta y sobre `l`, que debe estar en `SUPPORTED_LOCALE_CODES`;
  si no lo está, se usa `es`.
- **El destino sale de `snapshot.locales[locale].targetPath`, jamás de la query.** Un parámetro con
  la URL de destino sería una redirección abierta.
- **La consulta lleva las dos condiciones**: `WHERE id = :itemId AND campaign_id = :campaignId`.
  Con solo el id del ítem, un `campaignId` cualquiera contaría clics en la campaña equivocada.
- **Localización: `buildLocalizedPathFromLocale`, no `buildLocalizedPath`.** El segundo saca el
  idioma del *request* (`getRequestLocaleContext`), y `/nl/c/…` no lleva prefijo de idioma, así que
  resolvería español ignorando `l=en`. La forma correcta —con el precedente exacto en
  `newsletterSubscribers.ts:278`— es:

  ```ts
  buildLocalizedPathFromLocale(targetPath, localeCode, LOCALE_DEFINITIONS, DEFAULT_LOCALE_CODE)
  ```

- `Cache-Control: no-store` y **nunca `defineCachedEventHandler`**: es un GET que muta un contador.
- Incremento sin lectura previa: `UPDATE … SET click_count = click_count + 1 WHERE …`.
- Si la campaña o el ítem no existen, **redirigir a la home**, no devolver 500: el enlace vive en
  correos que ya no se pueden corregir.

**Política de abuso.** «Sin límite» no vale: aunque el peor daño *funcional* sea un contador
inflado, cada petición es un `UPDATE` con su WAL, su lock de fila y su conexión del pool. Sin
protección, la ruta es un amplificador de escritura sin autenticar. Pero un límite por IP a secas
tampoco sirve: un escáner corporativo visita legítimamente todas las piezas de un correo desde la
misma IP. La política es:

1. **Fuera del limitador global** de `nuxt.config.ts`, que solo sabe de IP. Al excluirla hay que
   comprobar que el patrón `${path}/**` que genera `buildNoRateLimitRouteRules` case de verdad con
   la ruta elegida.
2. **Dentro del handler**, `enforceRateLimit` con la clave efectiva **`IP + itemId`**, no solo IP.
   Así un escáner puede recorrer las 20 piezas del correo sin gastar una cuota común, pero nadie
   golpea miles de veces la misma fila.

   Detalle de implementación: `enforceRateLimit` **no acepta una clave adicional** — construye
   `buildRedisKey('rate-limit', namespace, clientIp)` internamente (`rateLimit.ts:40`). La forma de
   añadir el ítem es un **espacio de nombres dinámico**, `newsletter-click:${itemId}`, y hay que
   validar el formato del id con Zod **antes** de componerlo, o el parámetro de ruta acaba dentro de
   una clave de Redis sin filtrar.
3. Umbral amplio —del orden de 30 por IP y pieza en 15 minutos— y **fail-open si Redis cae**, que es
   el comportamiento que `enforceRateLimit` ya tiene documentado.

---

## 8. Panel de admin

### 8.1 `/admin/newsletter` — listado de campañas

Asunto (es), estado, fecha de envío, destinatarios, enviados/fallidos, clics y bajas. Acciones:
crear, editar borrador, duplicar, ver detalle, cancelar envío en curso, reanudar.

### 8.2 `/admin/newsletter/campanas/[id]` — editor

**Textos por idioma.** Tarjeta por locale siguiendo `AdminPressTranslationCard.vue`: asunto,
preheader y entradilla. Solo `es` es obligatorio; el resto se marca como «heredará el español».

**Contenido.** Lista ordenable (referencia: `adminReorder.ts`). Cada ítem muestra su tarjeta tal como
saldrá y permite sobrescribir titular y resumen por idioma. En los informes de área el resumen se
marca como recomendado (§5). «Añadir contenido» abre un selector de tres pestañas con buscador, más
«añadir lo incorporado desde el último envío».

**Envío.** Recuento de suscriptores activos, tamaño estimado del correo por idioma, previsualización,
envío de prueba y botón de envío.

### 8.3 Previsualización

`<iframe>` que carga `GET …/preview?locale=`, con selector de idioma y ancho (móvil ≈ 375 px /
escritorio ≈ 640 px). **Renderiza con la misma función que usa el mailer**: una reimplementación en
Vue se desincronizaría y dejaría de servir para lo que sirve.

- Atributo `sandbox` sin `allow-scripts` ni `allow-forms`. El correo no tiene JavaScript y así el
  HTML de la entradilla no puede ejecutar nada aunque el saneado fallara.
- Respuesta con `Cache-Control: no-store`.
- CSP acotada a la ruta de admin (§3.3), no `'self'` global en `frame-src`.
- El enlace de baja apunta a un destino inerte y los de clic van directos al destino sin contar.

### 8.4 Envío de prueba y confirmación

La prueba pide dirección e idioma, antepone `[PRUEBA]` al asunto, no toca entregas ni estado, está
limitada por frecuencia y funciona sobre borradores, que es cuando hace falta.

El envío real abre un diálogo con el número de destinatarios y exige confirmación explícita. Sin
roles de admin (§3.4), esta es la única red de seguridad.

### 8.5 Detalle de campaña enviada

Solo lectura, con las estadísticas de §9 y el botón de duplicar. En `failed` —«enviada con
incidencias»— aparece además «reintentar los envíos pendientes», que es la transición
`failed → queued` de §4.6. En `sent` no aparece: no queda nada que reintentar.

---

## 9. Estadísticas

### 9.1 Entrega

Total, enviados, fallidos, direcciones fallidas, inicio y fin, más el estado en los términos de
§4.6 («enviada» / «enviada con incidencias» / «pausada»).

### 9.2 Interacción

- **Clics por pieza**, del contador de `newsletter_campaign_items`.
- **Clics por tipo de contenido**, agregando por `item_type`.
- **Ranking histórico** de piezas más clicadas entre campañas: es lo que de verdad sirve para
  decidir el contenido del siguiente envío.
- **Bajas atribuidas**: contador `unsubscribe_count` en la campaña, incrementado solo en la
  transición real de activa a inactiva y solo si el HMAC de atribución verifica (§7.5). Es agregado:
  no queda registro de qué campaña provocó la baja de qué persona, así que no crea ninguna
  asociación de datos personales nueva.

**Limitación visible en la propia interfaz**: los escáneres corporativos y Outlook Safe Links
visitan los enlaces automáticamente. El conteo de clics sirve para comparar piezas entre sí, no como
número absoluto. Las bajas no sufren esa inflación, porque un escáner que siga el enlace no ejecuta
el POST de confirmación.

### 9.3 Lo que deliberadamente no se mide

**Sin píxel de apertura.** Apple Mail Privacy Protection precarga las imágenes de todos sus
usuarios: la tasa de apertura es hoy una métrica rota y obligaría a tocar el aviso de privacidad. El
clic es el dato honesto.

**Sin identificar quién hace clic.** El enlace lleva campaña y pieza, nunca destinatario.

---

## 10. Desmantelamiento del sistema de PDFs (fase 7)

### 10.1 Código

- Admin: `app/pages/admin/newsletter/index.vue`, `AdminNewsletterMonthPicker.client.vue`,
  `app/composables/admin/useAdminNewsletters.ts`.
- API admin: `server/api/admin/newsletter/index.{get,post,ts}`, `[id].{get,put,delete}.ts`,
  `[id]/send.{post,delete}.ts`, `upload.post.ts`.
- Público: `server/api/newsletter.ts`.
- Assets: `server/routes/prensa/newsletter/{documentos,portadas,imagenes-por-defecto}/[...path].ts`.
- Utilidades: `server/utils/newsletter/newsletters.ts`, `shared/constants/newsletterUpload.ts`,
  `shared/utils/newsletterValidation.ts`, las entradas de newsletter en `assetPaths.ts`.
- `buildNewsletterDeliveryEmailHtml` en `emailTemplates.ts`.
- `/api/admin/newsletter/upload` de `adminUploadRoutePaths` en `nuxt.config.ts`.

### 10.2 Seis que no son borrados simples

1. **`server/api/__sitemap__/urls.ts`**: la consulta de `newsletters.publicVisible` es una pata de un
   `Promise.all` que alimenta `externalSourcesHealthy` y el mecanismo de última instantánea buena.
   Hay que quitar la pata **y** su uso en `newsletterRoute` sin alterar esa lógica de salud.
2. **`server/middleware/legacy-redirects.ts:22`** redirige `/newsletter` → `/prensa/newsletter`. El
   destino sigue existiendo como página de suscripción: **la redirección se queda**.
3. **`shared/constants/publicAsyncDataKeys.ts`**: además de borrar el prefijo y su función, hay que
   sacarlo del array `PUBLIC_CMS_ASYNC_DATA_KEY_PREFIXES`.
4. **`drizzle/seed.ts`**: crea las 13 newsletters (bloque de ~línea 10507), la fila de imagen por
   defecto `('newsletter','cover')` (~348), un enlace destacado a `/prensa/newsletter/` (~10345) y
   borra `newsletterDeliveries` + `newsletters` en el reinicio (~235-239). Hay que quitar todo eso
   **conservando** el borrado selectivo que respeta `newsletter_subscribers` y
   `newsletter_subscription_events`, que es evidencia de consentimiento RGPD.
   `pnpm build:seed` regenera `ops/seed.mjs`.
5. **`server/utils/admin/adminSummaryData.ts`**: hay un bloque `latestNewsletter` y una rama
   `section_key = 'newsletter'` dentro de una consulta UNION. Se sustituyen por la campaña más
   reciente, no se borran sin más, o el panel pierde una fila.
6. **`server/utils/admin/adminAssetPublication.ts`**: importa `newsletters` y sus rutas públicas y
   las reconcilia en el barrido de publicación. Hay que quitar esa rama y, sobre todo, **añadir el
   conjunto global de rutas protegidas por snapshots** que describe §4.5 — que no es una rama más
   del bucle, sino un cálculo previo. Su bloque `catch` también trata
   `isDatabaseMissingRelationError(error, 'newsletters')` como caso especial: hay que repuntarlo.

También: `server/utils/admin/adminAssetReferences.ts` pierde las dos entradas de `newsletters` y gana
la variante de array del snapshot; `adminCacheInvalidation.ts` pierde la newsletter; y
`adminSections.ts` actualiza la descripción de la sección y la de imágenes por defecto, que menciona
la newsletter.

### 10.3 Imagen por defecto

Borrar la fila `('newsletter', 'cover')` de `site_default_images` **y** modificar el CHECK
`site_default_images_scope_slot_check`, que la enumera (`server/db/schema/shared.ts:81`, migraciones
`0000`/`0001`/`0010`). Actualizar también el comentario de cabecera de esa tabla, que cita la
portada de newsletter, y quitar la fila de `app/pages/admin/imagenes-por-defecto.vue`. Ojo:
`server/api/admin/site-default-images/index.{get,put}.ts` enumeran los slots.

### 10.4 Despliegue y operación

- Los tres montajes de volumen en **`docker-compose.local-deploy.yml:40-42`** y
  **`docker-compose.production.example.yml:27-29`**.
- La creación de directorios en **`deploy.sh:115-117`**.
- El caso de rutas de newsletter en **`deploy-local.sh:222`**.
- **`DEPLOYMENT.md`**: los `mkdir` de las líneas 94-96, la nota del seed (línea 458) y la sección de
  resolución de problemas «Los emails de newsletter no se envían» (línea 710), que hay que reescribir
  en términos de campañas, no borrar: el diagnóstico SMTP sigue valiendo.

### 10.5 `app/pages/prensa/newsletter.vue` — edición quirúrgica

**Sobrevive**: el formulario de suscripción, Turnstile y su composable de disponibilidad, la versión
del texto de consentimiento, el enlace a la política de privacidad y **los seis estados de aviso por
query param** (`confirmed=1|already|expired|invalid`, `unsubscribed=1|invalid`).

**Se va**: el acordeón de archivo, su `useAsyncData`, la paginación y los observadores de entrada
asociados. En el SEO, `webPageType` deja de ser `'CollectionPage'`.

### 10.6 Intacto, y lo que no

**Intacto de verdad**: el esquema de `newsletter_subscribers` y `newsletter_subscription_events`, el
flujo de doble opt-in, los tokens firmados, `confirmar-suscripcion.vue`,
`admin/newsletter/suscriptores.vue` y su API.

**Cambia, aunque sea del lado de la suscripción** (§7.5):

- `newsletterSubscriptionActions.ts` — arreglo de idempotencia y atribución.
- `newsletter-unsubscribe.post.ts` — parámetros `c` y `a`, y el límite por vía (§6.9).
- **`app/pages/desuscribirse.vue`** — tiene que leer `c` y `a` de la query y reenviarlos. Sin este
  cambio, las bajas desde el enlace visible del correo —la vía habitual— no se atribuyen a nada.
- `newsletterSubscribers.ts` — `createNewsletterAttributionSignature` y
  `verifyNewsletterAttributionSignature`, junto a las de token pero **sin** ampliar la unión de
  `kind` de `createNewsletterToken` ni de `parseSignedNewsletterToken` (§7.5.3).

### 10.7 Textos

Se limpian las claves `newsletter.*` de archivo en los seis `i18n/locales/*.json` y se añaden las del
admin nuevo, manteniendo la paridad que exige `pnpm i18n:check`. Recordatorio: una `@` literal en el
JSON se escribe `{'@'}`.

---

## 11. Anclas y mejoras en las tarjetas de informes de áreas

En `app/pages/transparencia/actividad/informes/[monthKey].vue`. El payload público ya expone
`areaId` (`server/api/area-reports.ts`), así que no hay que tocar la API.

1. `:id="'area-' + report.areaId"` en el `<article>` de cada tarjeta.
2. `scroll-margin-top` para que el ancla no quede bajo la cabecera fija.
3. Enlace permanente discreto junto al `<h2>` del área.
4. `aria-labelledby` del `<article>` apuntando al id del `<h2>`.
5. Comprobar que al entrar con `#area-…` el desplazamiento ocurre **después** de que llegue el dato
   asíncrono: la restauración nativa de Nuxt se ejecuta antes y no encuentra el elemento.

Lista corta a propósito: la invitación a mejorar no debería convertirse en un rediseño.

---

## 12. Transversal

- **CSP**: regla de ruta acotada al admin de campañas (§3.3), no cambio global.
- **Rate limiting**: exclusión explícita de la ruta de clic (§7.6); espacio de nombres separado para
  la baja de un clic (§6.9).
- **Cache**: ruta de clic y previsualización con `no-store`.
- **Sitemap**: fuera la entrada de `/prensa/newsletter` con `lastmod`; la página de suscripción se
  sigue indexando como página normal.
- **`server/db/schema/activity.ts`**: el comentario de cabecera describe la sección Actividad como
  sustituta de «la newsletter mensual». Reescribirlo: la newsletter sigue viva con otra forma.
- **`adminOperationalStats.ts`**: la cola de BullMQ se sigue llamando igual y sus métricas siguen
  valiendo; solo cambia lo que hay dentro de los jobs.

---

## 13. Fases de implementación

Con la estrategia *expand/contract*, cada fase deja `pnpm build`, `typecheck`, `lint` e `i18n:check`
en verde **y el admin de newsletter antiguo funcionando** hasta que lo sustituye el nuevo.

| Fase | Contenido |
|---|---|
| **0** | Rescate de PDFs y portadas, con verificación por checksum (§3.1). Bloqueante e irreversible. |
| **1** | *Expand*: crear tablas nuevas sin borrar nada (§4.9). |
| **2** | Renderizado del correo: plantilla, etiquetas BCP 47, escapado/saneado, textos de servidor, texto plano, exportar `buildEmailLayout` (§6). |
| **3** | CRUD de campañas, traducciones, ítems y selectores de contenido (§7.1, §7.2, §8.1, §8.2). |
| **4** | Previsualización y envío de prueba, con la regla de CSP acotada (§8.3, §8.4). |
| **5** | Pipeline: repunte a campañas, bloqueo de filas y validación, congelado del snapshot, frontera con BullMQ, extensión del recolector de assets y arreglo de idempotencia de la baja (§4.5, §7.3, §7.4, §7.5). |
| **6** | Ruta de clic, contadores y pantallas de estadísticas (§7.6, §9). |
| **7** | *Contract*: desmantelamiento completo, incluido el `DROP` con guarda dentro de la migración (§4.9, §10). |
| **8** | Anclas y mejoras en tarjetas de informes (§11). |
| **9** | Paridad i18n, QA completo y limpieza de comentarios obsoletos. |

**Pruebas que no pueden faltar** (fases 5 y 6):

- Campaña sin destinatarios: termina en `sent` con total 0, no se queda en `queued`.
- Redis caído justo tras el commit: el barrido la recupera (§7.4).
- Pieza despublicada entre la creación y el envío: 409 con la lista.
- Cancelar a mitad de envío y reanudar: solo se reenvía lo pendiente.
- **Tanda con fallidos: acaba en `failed`, y el reintento vuelve a reclamar el lease.** Es la prueba
  que habría cazado la incompatibilidad entre `sent_at` y «reenviar a fallidos».
- POST de baja repetido: misma respuesta, un solo evento, un solo incremento del contador.
- Baja desde el enlace visible del pie: se atribuye a la campaña. Con `a` manipulado: la baja se
  ejecuta y no se atribuye.
- **Ciclo baja → alta → baja**: reutilizar la `a` de una campaña anterior con el token nuevo **no**
  atribuye, porque la firma incluye `subscribedAtMs` (§7.5.3).
- Campaña pausada antes del primer correo: **no** mueve el corte de «lo incorporado desde el último
  envío» (§7.2).
- Clic con `l=en`: redirige a `/en/...`, no a la ruta en español.
- Imagen de una pieza despublicada que usa una campaña enviada: sigue publicada tras la
  reconciliación de assets (§4.5).
- Tamaño del HTML por encima del umbral en un solo idioma.

QA de cada fase: `pnpm build` · `pnpm typecheck` · `pnpm lint` · `pnpm i18n:check`.
Recordatorios del repo: gestor **pnpm**, commits **sin firmar** y **sin `Co-Authored-By`**
(`git -c commit.gpgsign=false …`).

---

## 14. Checklist de ficheros

**Nuevos**
```
server/utils/email/newsletterCampaignTemplate.ts
server/utils/locale/newsletterEmailMessages.ts
server/utils/newsletter/newsletterCampaigns.ts
server/utils/newsletter/campaignSnapshot.ts          (esquema Zod + congelado + proyección §5)
server/api/admin/newsletter/campaigns/**
server/api/admin/newsletter/content.get.ts
server/routes/nl/c/[campaignId]/[itemId].ts
app/pages/admin/newsletter/campanas/[id].vue
app/components/admin/newsletter/**
app/composables/admin/useAdminNewsletterCampaigns.ts
shared/constants/newsletterCampaigns.ts
drizzle/00XX_newsletter_campaigns.sql                (fase 1, expand)
drizzle/00XX_drop_newsletter_pdf.sql                 (fase 7, contract, con guarda)
```

**Modificados**
```
server/db/schema/newsletter.ts
server/db/schema/shared.ts                           (CHECK de site_default_images + comentario)
server/services/newsletterDeliveryService.ts         (campaña, render por locale, centinela)
server/services/newsletterDeliveryRepository.ts      (campaignId)
server/services/newsletterDeliveryLease.ts           (tabla + claim acepta el executor de la tx
                                                      y escribe status en su propio .set() §4.6)
server/utils/email/newsletterMailer.ts               (reescrito sobre la plantilla nueva)
server/utils/email/emailTemplates.ts                 (exportar layout, parámetro lang)
server/utils/newsletter/newsletterSubscriptionActions.ts   (§7.5)
server/utils/core/backgroundJobs.ts                  (nombres de job, barrido periódico)
server/plugins/background-jobs.ts
server/api/newsletter-unsubscribe.post.ts            (params c/a, límite por vía §6.9)
server/utils/newsletter/newsletterSubscribers.ts     (HMAC de atribución §7.5.3)
server/utils/press/pressTranslation.ts               (sanitizeNewsletterIntroHtml §4.2)
app/pages/desuscribirse.vue                          (reenviar c y a §7.5.2)
server/api/__sitemap__/urls.ts                       (con cuidado, §10.2)
server/utils/admin/adminAssetReferences.ts           (variante de array del snapshot)
server/utils/admin/adminAssetPublication.ts
server/utils/admin/adminCacheInvalidation.ts
server/utils/admin/adminSummaryData.ts               (§10.2)
server/utils/admin/{adminSummary,adminSummaryLabels}.ts
server/utils/locale/{apiErrorMessages,adminApiErrorMessages}.ts
server/utils/validation/common.ts
shared/utils/adminSchemas.ts
shared/constants/{adminRoutes,adminSections,assetPaths,publicAsyncDataKeys,siteDefaultImages}.ts
app/pages/prensa/newsletter.vue                      (quirúrgico, §10.5)
app/pages/admin/newsletter/index.vue                 (listado de campañas)
app/pages/admin/{index,estado,imagenes-por-defecto}.vue
app/pages/transparencia/actividad/informes/[monthKey].vue
app/composables/home/usePublicHeaderNavigation.ts
nuxt.config.ts                                       (CSP por ruta, rate limiter, uploads)
drizzle/seed.ts                                      (§10.2) + pnpm build:seed
docker-compose.local-deploy.yml, docker-compose.production.example.yml
deploy.sh, deploy-local.sh, DEPLOYMENT.md
i18n/locales/*.json                                  (los 6)
```

**Borrados**: los enumerados en §10.1.

---

## 15. Puntos abiertos, con recomendación

Ninguno bloquea las fases 0 y 1; se pueden cerrar sobre la marcha.

1. **Límite de piezas.** Aviso por número de piezas en el editor, pero **validación dura por bytes**
   del HTML final de cada idioma, con margen bajo los 102 KB. Ya incorporado en §6.9.
2. **Riqueza de la entradilla.** Editor limitado a párrafo, negrita, cursiva y enlace, con
   **`sanitizeNewsletterIntroHtml`** obligatorio en el servidor, no solo una barra de editor
   recortada. En correo, cuanto menos HTML, menos se rompe. Ya en §4.2.
3. **Envío programado.** Fuera de v1, aunque BullMQ ya soporta `delay`.
4. **Duplicar campaña.** Se mantiene, como endpoint de backend atómico que copia solo lo editable.
   Ya en §7.1.
5. **Lista de direcciones de prueba guardadas.** Fuera de v1: teclear dirección e idioma basta.

Lo único que queda realmente sin decidir es si el rescate de PDFs de la fase 0 sale de la máquina o
basta con `backups/` local, que depende de dónde se vaya a trabajar.
