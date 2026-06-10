-- Custom data migration: backfill Basque (`eu`) translations for the seed-originated
-- content that already lives in the database with an English (`en`) translation.
--
-- Scope: tags (11), carousel item (1), featured links (6), equality documents (4) — the
-- only seed entities that ship an `en` translation. Press articles and financial reports
-- are seeded Spanish-only; team/area/member translation tables are not seeded.
--
-- Each statement is idempotent and safe across re-deploys:
--   * matches the parent by its stable natural key (slug / href / to / pdf_url),
--   * only inserts when the parent already has an `en` translation (EXISTS),
--   * only inserts when no `eu` translation exists yet (NOT EXISTS) — so admin-entered
--     Basque content is never overwritten or duplicated.
-- String literals use dollar-quoting ($$...$$). The id is derived from the parent id so
-- it is unique and deterministic.

-- Tags ---------------------------------------------------------------------------------
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Guztiak$$, t."id"
FROM "tags" t
WHERE t."slug" = $$all$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Unibertsitate politika$$, t."id"
FROM "tags" t
WHERE t."slug" = $$university-policy$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Bekak eta finantzaketa$$, t."id"
FROM "tags" t
WHERE t."slug" = $$scholarships-funding$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Ikasleen ekonomia$$, t."id"
FROM "tags" t
WHERE t."slug" = $$student-economy$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Praktikak eta enplegagarritasuna$$, t."id"
FROM "tags" t
WHERE t."slug" = $$internships-employability$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Eskubideak, bizikidetza eta berdintasuna$$, t."id"
FROM "tags" t
WHERE t."slug" = $$rights-coexistence-equality$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Unibertsitate kalitatea$$, t."id"
FROM "tags" t
WHERE t."slug" = $$university-quality$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Unibertsitate bizitza eta ongizatea$$, t."id"
FROM "tags" t
WHERE t."slug" = $$university-life-wellbeing$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Unibertsitaterako sarbidea$$, t."id"
FROM "tags" t
WHERE t."slug" = $$access-to-university$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Nazioartekoa eta mugikortasuna$$, t."id"
FROM "tags" t
WHERE t."slug" = $$international-mobility$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "tag_translations" ("id", "locale", "name", "tag_id")
SELECT $$eu-tagtr-$$ || t."id", $$eu$$, $$Ikasleen ordezkaritza$$, t."id"
FROM "tags" t
WHERE t."slug" = $$student-representation$$
  AND EXISTS (SELECT 1 FROM "tag_translations" e WHERE e."tag_id" = t."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "tag_translations" c WHERE c."tag_id" = t."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
-- Carousel -----------------------------------------------------------------------------
INSERT INTO "carousel_item_translations" ("id", "locale", "title", "button_text", "carousel_item_id")
SELECT $$eu-cartr-$$ || ci."id", $$eu$$, $$Ezagutu 1.000.000 ikasle baino gehiago ordezkatzen dituen elkartea.$$, $$Zer da CREUP?$$, ci."id"
FROM "carousel_items" ci
WHERE ci."href" = $$/conocenos/que-es$$
  AND EXISTS (SELECT 1 FROM "carousel_item_translations" e WHERE e."carousel_item_id" = ci."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "carousel_item_translations" c WHERE c."carousel_item_id" = ci."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
-- Featured links -----------------------------------------------------------------------
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$eu-fltr-$$ || fl."id", $$eu$$, $$Identitate Korporatiboaren Eskuliburua$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$/transparencia/mic/$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$eu-fltr-$$ || fl."id", $$eu$$, $$Harpidetu gure Newsletterera$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$/prensa/newsletter/$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$eu-fltr-$$ || fl."id", $$eu$$, $$Berdintasuna eta jazarpenaren prebentzioa$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$/transparencia/igualdad$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$eu-fltr-$$ || fl."id", $$eu$$, $$Unibertsitateko Ikaslearen Estatutua$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$https://www.boe.es/buscar/doc.php?id=BOE-A-2010-20147$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$eu-fltr-$$ || fl."id", $$eu$$, $$Bekak eta laguntzak ikasleentzat$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$https://www.becaseducacion.gob.es/$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "featured_link_translations" ("id", "locale", "title", "featured_link_id")
SELECT $$eu-fltr-$$ || fl."id", $$eu$$, $$European Students' Union (ESU)$$, fl."id"
FROM "featured_links" fl
WHERE fl."to" = $$https://www.esu-online.org/$$
  AND EXISTS (SELECT 1 FROM "featured_link_translations" e WHERE e."featured_link_id" = fl."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "featured_link_translations" c WHERE c."featured_link_id" = fl."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
-- Equality documents -------------------------------------------------------------------
INSERT INTO "equality_document_translations" ("id", "locale", "title", "description", "meta", "equality_document_id")
SELECT $$eu-eqtr-$$ || ed."id", $$eu$$, $$Berdintasun eta Aniztasunari buruzko posizionamendu politikoa$$, $$Berdintasunari, aniztasunari, unibertsitateko diskriminazioei eta erakunde publikoei eskatzen dizkiegun neurriei buruzko gure esparru-dokumentua.$$, $$Dokumentu politikoa · Berdintasuna eta aniztasuna$$, ed."id"
FROM "equality_documents" ed
WHERE ed."pdf_url" = $$/documentos/igualdad/posicionamiento-igualdad-diversidad.pdf$$
  AND EXISTS (SELECT 1 FROM "equality_document_translations" e WHERE e."equality_document_id" = ed."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "equality_document_translations" c WHERE c."equality_document_id" = ed."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "equality_document_translations" ("id", "locale", "title", "description", "meta", "equality_document_id")
SELECT $$eu-eqtr-$$ || ed."id", $$eu$$, $$Sexu-jazarpen kasuen prebentzio eta jarduketa protokoloa$$, $$77. Ohiko Batzar Nagusian onartua, neurri prebentiboak, konfidentzialtasun printzipioak, Puntu Seguruaren funtzionamendua eta sexu-askatasunaren aurkako jokabideen aurrean jarduteko prozedura jasotzen ditu.$$, $$77. Ohiko Batzar Nagusia · 2025eko apirilaren 4a$$, ed."id"
FROM "equality_documents" ed
WHERE ed."pdf_url" = $$/documentos/igualdad/protocolo-de-prevencion-y-actuacion-frente-a-casos-de-acoso.pdf$$
  AND EXISTS (SELECT 1 FROM "equality_document_translations" e WHERE e."equality_document_id" = ed."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "equality_document_translations" c WHERE c."equality_document_id" = ed."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "equality_document_translations" ("id", "locale", "title", "description", "meta", "equality_document_id")
SELECT $$eu-eqtr-$$ || ed."id", $$eu$$, $$Diskriminazio kasuen prebentzio eta jarduketa protokoloa$$, $$77. Ohiko Batzar Nagusian onartua, diskriminazio kasuak, bermeak, Puntu Segurua eta aniztasunagatiko indarkeria edo jazarpenaren aurrean esku hartzeko mailak definitzen ditu.$$, $$77. Ohiko Batzar Nagusia · 2025eko apirilaren 4a$$, ed."id"
FROM "equality_documents" ed
WHERE ed."pdf_url" = $$/documentos/igualdad/protocolo-discriminacion-creup.pdf$$
  AND EXISTS (SELECT 1 FROM "equality_document_translations" e WHERE e."equality_document_id" = ed."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "equality_document_translations" c WHERE c."equality_document_id" = ed."id" AND c."locale" = $$eu$$);
--> statement-breakpoint
INSERT INTO "equality_document_translations" ("id", "locale", "title", "description", "meta", "equality_document_id")
SELECT $$eu-eqtr-$$ || ed."id", $$eu$$, $$Komunikazio Inklusiboaren Gida$$, $$Komunikazio inklusiboagoa lortzeko hizkuntzari, baliabide bisualei eta irisgarritasun irizpideei buruzko gomendio praktikoak biltzen ditu.$$, $$Gida praktikoa · Hizkuntza, ikusgarritasuna eta irisgarritasuna$$, ed."id"
FROM "equality_documents" ed
WHERE ed."pdf_url" = $$/documentos/igualdad/guia-comunicacion-inclusiva.pdf$$
  AND EXISTS (SELECT 1 FROM "equality_document_translations" e WHERE e."equality_document_id" = ed."id" AND e."locale" = $$en$$)
  AND NOT EXISTS (SELECT 1 FROM "equality_document_translations" c WHERE c."equality_document_id" = ed."id" AND c."locale" = $$eu$$);
