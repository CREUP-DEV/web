-- Custom data migration: backfill Catalan (`ca`) translations for the seed-originated
-- content that already lives in the database with an English (`en`) translation.
--
-- Scope: tags (11), carousel item (1), featured links (6), equality documents (4) — the
-- only seed entities that ship an `en` translation. Press articles and financial reports
-- are seeded Spanish-only; team/area/member translation tables are not seeded.
--
-- Each statement is idempotent and safe across re-deploys:
--   * matches the parent by its stable natural key (slug / href / to / pdf_url),
--   * only inserts when the parent already has an `en` translation (EXISTS),
--   * only inserts when no `ca` translation exists yet (NOT EXISTS) — so admin-entered
--     Catalan content is never overwritten or duplicated.
-- String literals use dollar-quoting ($$...$$) to avoid escaping Catalan apostrophes.
-- The id is derived from the parent id so it is unique and deterministic.

-- Tags ---------------------------------------------------------------------------------
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Totes$$, t."id"
FROM "tags" t
WHERE t."slug" = $$all$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Política universitària$$, t."id"
FROM "tags" t
WHERE t."slug" = $$university-policy$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Beques i finançament$$, t."id"
FROM "tags" t
WHERE t."slug" = $$scholarships-funding$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Economia estudiantil$$, t."id"
FROM "tags" t
WHERE t."slug" = $$student-economy$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Pràctiques i ocupabilitat$$, t."id"
FROM "tags" t
WHERE t."slug" = $$internships-employability$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Drets, convivència i igualtat$$, t."id"
FROM "tags" t
WHERE t."slug" = $$rights-coexistence-equality$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Qualitat universitària$$, t."id"
FROM "tags" t
WHERE t."slug" = $$university-quality$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Vida universitària i benestar$$, t."id"
FROM "tags" t
WHERE t."slug" = $$university-life-wellbeing$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Accés a la universitat$$, t."id"
FROM "tags" t
WHERE t."slug" = $$access-to-university$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Internacional i mobilitat$$, t."id"
FROM "tags" t
WHERE t."slug" = $$international-mobility$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$ca-tagtr-$$ || t."id", $$ca$$, $$Representació estudiantil$$, t."id"
FROM "tags" t
WHERE t."slug" = $$student-representation$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
-- Carousel -----------------------------------------------------------------------------
INSERT INTO "carousel_item_translations" ("id", "locale", "title", "button_text", "carousel_item_id")
SELECT $$ca-cartr-$$ || ci."id", $$ca$$, $$Coneix l'associació que representa més d'1.000.000 d'estudiants.$$, $$Què és CREUP?$$, ci."id"
FROM "carousel_items" ci
WHERE ci."href" = $$/conocenos/que-es$$
  AND EXISTS (SELECT 1 FROM "carousel_item_translations" e WHERE e."carousel_item_id" = ci."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "carousel_item_translations" c WHERE c."carousel_item_id" = ci."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
-- Featured links -----------------------------------------------------------------------
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$ca-fltr-$$ || fl."id", $$ca$$, $$Manual d'Identitat Corporativa$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$/transparencia/mic/$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$ca-fltr-$$ || fl."id", $$ca$$, $$Subscriu-te a la nostra Newsletter$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$/prensa/newsletter/$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$ca-fltr-$$ || fl."id", $$ca$$, $$Igualtat i prevenció de l'assetjament$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$/transparencia/igualdad$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$ca-fltr-$$ || fl."id", $$ca$$, $$Estatut de l'Estudiant Universitari$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$https://www.boe.es/buscar/doc.php?id=BOE-A-2010-20147$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$ca-fltr-$$ || fl."id", $$ca$$, $$Beques i ajudes per a l'estudiantat$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$https://www.becaseducacion.gob.es/$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$ca-fltr-$$ || fl."id", $$ca$$, $$European Students' Union (ESU)$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$https://www.esu-online.org/$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
-- Equality documents -------------------------------------------------------------------
INSERT INTO "equality_document_translations" ("id", "locale", "title", "description", "meta", "equality_document_id")
SELECT $$ca-eqtr-$$ || ed."id", $$ca$$, $$Posicionament polític en matèria d'Igualtat i Diversitat$$, $$El nostre document marc sobre igualtat, diversitat, discriminacions a la universitat i mesures que reclamem a les institucions públiques.$$, $$Document polític · Igualtat i diversitat$$, ed."id"
FROM "equality_documents" ed
WHERE ed."pdf_url" = $$/documentos/igualdad/posicionamiento-igualdad-diversidad.pdf$$
  AND EXISTS (SELECT 1 FROM "equality_document_translations" e WHERE e."equality_document_id" = ed."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "equality_document_translations" c WHERE c."equality_document_id" = ed."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "equality_document_translations" ("id", "locale", "title", "description", "meta", "equality_document_id")
SELECT $$ca-eqtr-$$ || ed."id", $$ca$$, $$Protocol de prevenció i actuació davant casos d'assetjament sexual$$, $$Aprovat a la 77a Assemblea General Ordinària, recull mesures preventives, principis de confidencialitat, el funcionament del Punt Segur i el procediment d'actuació davant conductes contràries a la llibertat sexual.$$, $$77a Assemblea General Ordinària · 4 d'abril de 2025$$, ed."id"
FROM "equality_documents" ed
WHERE ed."pdf_url" = $$/documentos/igualdad/protocolo-de-prevencion-y-actuacion-frente-a-casos-de-acoso.pdf$$
  AND EXISTS (SELECT 1 FROM "equality_document_translations" e WHERE e."equality_document_id" = ed."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "equality_document_translations" c WHERE c."equality_document_id" = ed."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "equality_document_translations" ("id", "locale", "title", "description", "meta", "equality_document_id")
SELECT $$ca-eqtr-$$ || ed."id", $$ca$$, $$Protocol de prevenció i actuació davant casos de discriminació$$, $$Aprovat a la 77a Assemblea General Ordinària, defineix supòsits de discriminació, garanties, Punt Segur i nivells d'intervenció davant violència o assetjament per diversitat.$$, $$77a Assemblea General Ordinària · 4 d'abril de 2025$$, ed."id"
FROM "equality_documents" ed
WHERE ed."pdf_url" = $$/documentos/igualdad/protocolo-discriminacion-creup.pdf$$
  AND EXISTS (SELECT 1 FROM "equality_document_translations" e WHERE e."equality_document_id" = ed."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "equality_document_translations" c WHERE c."equality_document_id" = ed."id" AND c."locale" = $$ca$$);
--> statement-breakpoint
INSERT INTO "equality_document_translations" ("id", "locale", "title", "description", "meta", "equality_document_id")
SELECT $$ca-eqtr-$$ || ed."id", $$ca$$, $$Guia de Comunicació Inclusiva$$, $$Recull recomanacions pràctiques sobre llenguatge, recursos visuals i criteris d'accessibilitat per a una comunicació més inclusiva.$$, $$Guia pràctica · Llenguatge, visualitat i accessibilitat$$, ed."id"
FROM "equality_documents" ed
WHERE ed."pdf_url" = $$/documentos/igualdad/guia-comunicacion-inclusiva.pdf$$
  AND EXISTS (SELECT 1 FROM "equality_document_translations" e WHERE e."equality_document_id" = ed."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "equality_document_translations" c WHERE c."equality_document_id" = ed."id" AND c."locale" = $$ca$$);
