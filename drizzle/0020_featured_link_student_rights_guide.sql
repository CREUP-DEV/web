-- Custom data migration: the home's featured link to the 2010 Estatuto del Estudiante Universitario
-- (BOE-A-2010-20147) becomes the "Tus derechos" guide (/politica/tus-derechos) on the new Estatuto
-- del Estudiantado Universitario (Real Decreto 855/2026). The link keeps its image and position.
--
-- Idempotent and safe on any database:
--   * the link is matched by its stable natural key (`to`), so a database without it, or one where
--     the admin already repointed it, is left alone;
--   * a title is replaced only while it still holds the one the seed gave it, so a title the admin
--     edited is kept (the content seed backfills any locale the link lacks);
--   * `updated_at` moves with each change, so an admin form opened before this runs hits the
--     optimistic-lock conflict instead of overwriting it.
UPDATE "featured_links"
SET "to" = '/politica/tus-derechos', "updated_at" = now()
WHERE "to" = 'https://www.boe.es/buscar/doc.php?id=BOE-A-2010-20147';
--> statement-breakpoint
UPDATE "featured_link_translations" AS t
SET "title" = v."new_title", "updated_at" = now()
FROM "featured_links" AS fl, (VALUES
  ('es', $$Estatuto del Estudiante Universitario$$, $$Tus derechos según el nuevo Estatuto$$),
  ('en', $$University Student Statute$$, $$Your rights under the new Statute$$),
  ('ca', $$Estatut de l'Estudiant Universitari$$, $$Els teus drets segons el nou Estatut$$),
  ('eu', $$Unibertsitateko Ikaslearen Estatutua$$, $$Zure eskubideak Estatutu berriaren arabera$$),
  ('gl', $$Estatuto do Estudante Universitario$$, $$Os teus dereitos segundo o novo Estatuto$$),
  ('val', $$Estatut de l'Estudiant Universitari$$, $$Els teus drets segons el nou Estatut$$)
) AS v("locale", "old_title", "new_title")
WHERE t."featured_link_id" = fl."id"
  AND fl."to" = '/politica/tus-derechos'
  AND t."locale" = v."locale"
  AND t."title" = v."old_title";
