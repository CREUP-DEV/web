# Handoff — Feature «Actividad» (CREUP web)

## Qué es
Nueva sección que sustituye la newsletter mensual (PDF): entradas de actividad
(eventos a los que CREUP asiste / eventos de miembros) + informes mensuales de
áreas. Público bajo `/transparencia/actividad` + fila en la home; gestión en
`/admin`. Plan completo: [`docs/plan-seccion-actividad.md`](./plan-seccion-actividad.md). Léelo primero.

## Estado git
- Rama: `feat/seccion-actividad` = `origin/main` + **1 commit squashed** con toda
  la feature. `main` está al día con origin. **Sin push, sin PR.**
- (La historia original de 9 commits por-fase se perdió en un `gc`; el contenido
  quedó intacto, reconciliado sobre los 61 commits nuevos de `origin/main`.)
- Continuar: `git switch feat/seccion-actividad`

## Hecho y QA-verde (build ✓ typecheck ✓ lint ✓ i18n:check ✓)
Fases 1–8 del plan + 9.1 (cableado deploy) + Admin UI. **La sección es 100 %
funcional vía admin ya mismo.** Incluye:
- Modelo: `activity_entries` (+translations, `kind` = creup|member) y
  `area_report_editions` + `area_reports` (+translations, por `month_key` + `area_id`).
  Migraciones `0009` / `0010` (solo DDL, sin backfill).
- Snapshot al publicar: se congela `area_name_translations` + `areaId` + orden
  (informes) y siglas/logo del miembro (eventos de miembro) → el contenido
  publicado es inmune a cambios del organigrama externo. Editar = re-snapshot con
  las áreas actuales.
- API pública cacheada locale-aware, CRUD admin, desplegables internos de áreas
  (`/api/admin/areas`) y organizadores (`/api/admin/member-orgs`), sitemap,
  invalidación de cache, serving de assets, slots de imagen por defecto.
- i18n: 6 locales con paridad (unión de claves). Navegación pública + admin.

## Pendiente
1. **Fase 9 — seed de contenido Feb 2026 → BLOQUEADA. Necesita decisión.**
   El seed (`drizzle/seed/content.ts`) corre solo con DB, sin `H3Event`, así que
   NO puede resolver `area_id` / snapshots de nombres y orden de área ni los
   IDs + logos de organizadores (UJI/RITSI) — todo viene del organigrama externo
   vía loaders que exigen un event. Además son ~20 piezas × 6 idiomas + 31
   imágenes a extraer del PDF
   (`public/prensa/newsletter/documentos/newsletter-2026-02.pdf`). No fabricar IDs
   ni publicar multi-idioma sin revisión humana.
   Opciones: (a) seed solo-ES ahora, resto por admin; (b) todo por alta manual en
   admin; (c) el usuario aporta `area_id`s + logos y se revisa antes de publicar.
2. **Newsletter actual — decisión aparte.** Descontinuar PDF + envío de email +
   suscriptores con consentimiento RGPD. Fuera del alcance de esta rama. Sin decidir.

## Follow-up conocido (P2, diferido a propósito)
`area_reports.coversFrom` se edita por-área en el formulario, pero el backend
(`server/utils/admin/crud/area-reports.ts`) usa `coalesce` deliberado → no se
puede limpiar desde el form y un valor distinto en un área pisa al resto
(last-write-wins). Documentado. Fix real = editor a nivel de edición.

## Convenciones del repo
- Gestor: **pnpm** (nunca npm).
- Commits **sin firmar** (el repo no firma) y **sin `Co-Authored-By`**. El GPG del
  entorno hace timeout → commitear con `git -c commit.gpgsign=false ...`.
- QA: `pnpm build` · `pnpm typecheck` · `pnpm lint` · `pnpm i18n:check`.
- i18n: un `@` literal en el JSON debe ser `{'@'}`. `pnpm i18n:check` exige paridad
  de claves entre los 6 locales.
