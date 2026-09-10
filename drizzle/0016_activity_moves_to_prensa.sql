-- The activity section moved from Transparencia to Prensa, so every public path stored in the
-- database has to follow. This is data-only: no table, column or constraint changes.
--
-- `/transparencia/actividad` is a prefix of the entry pages, the area-report pages and the image
-- base alike, so one replace covers all three with no ordering hazard. Area-report images sit
-- outside that prefix and need their own.
--
-- Idempotent: re-running finds no old prefix left and changes nothing.
--
-- ORDER MATTERS AT DEPLOY TIME: move the files inside the mounted uploads volume BEFORE running
-- this, then redeploy. Rows pointing at /prensa/... while the files still sit under
-- /transparencia/... means every image 404s in between.

UPDATE "activity_entries"
   SET "image" = replace("image", '/transparencia/actividad', '/prensa/actividad')
 WHERE "image" LIKE '/transparencia/actividad%';--> statement-breakpoint

UPDATE "area_reports"
   SET "image" = replace("image", '/transparencia/informes-areas', '/prensa/informes-areas')
 WHERE "image" LIKE '/transparencia/informes-areas%';--> statement-breakpoint

UPDATE "member_org_catalog_entries"
   SET "logo_light" = replace("logo_light", '/transparencia/actividad', '/prensa/actividad'),
       "logo_dark"  = replace("logo_dark",  '/transparencia/actividad', '/prensa/actividad')
 WHERE "logo_light" LIKE '/transparencia/actividad%'
    OR "logo_dark"  LIKE '/transparencia/actividad%';--> statement-breakpoint

UPDATE "site_default_images"
   SET "image" = replace(
         replace("image", '/transparencia/actividad', '/prensa/actividad'),
         '/transparencia/informes-areas', '/prensa/informes-areas'
       )
 WHERE "image" LIKE '/transparencia/actividad%'
    OR "image" LIKE '/transparencia/informes-areas%';--> statement-breakpoint

-- Rich text can link to activity pages. The sanitizer's allowlist has no `img`, so only hrefs
-- are at stake here.
UPDATE "activity_entry_translations"
   SET "content_html" = replace("content_html", '/transparencia/actividad', '/prensa/actividad')
 WHERE "content_html" LIKE '%/transparencia/actividad%';--> statement-breakpoint

UPDATE "area_report_translations"
   SET "content_html" = replace(
         replace("content_html", '/transparencia/actividad', '/prensa/actividad'),
         '/transparencia/informes-areas', '/prensa/informes-areas'
       )
 WHERE "content_html" LIKE '%/transparencia/actividad%'
    OR "content_html" LIKE '%/transparencia/informes-areas%';--> statement-breakpoint

UPDATE "carousel_items"
   SET "href" = replace("href", '/transparencia/actividad', '/prensa/actividad')
 WHERE "href" LIKE '/transparencia/actividad%';--> statement-breakpoint

UPDATE "featured_links"
   SET "to" = replace("to", '/transparencia/actividad', '/prensa/actividad')
 WHERE "to" LIKE '/transparencia/actividad%';--> statement-breakpoint

-- Campaign snapshots freeze both the click target and the image paths as absolute strings, and
-- `adminAssetPublication` matches those frozen paths to decide which files are protected from
-- collection. Leave them and already-sent campaigns point at dead URLs while their images lose
-- that protection. Rewriting the JSONB as text is crude but total, and it is a no-op today
-- because nothing has been sent yet.
UPDATE "newsletter_campaign_items"
   SET "snapshot" = replace(
         replace("snapshot"::text, '/transparencia/actividad', '/prensa/actividad'),
         '/transparencia/informes-areas', '/prensa/informes-areas'
       )::jsonb
 WHERE "snapshot"::text LIKE '%/transparencia/actividad%'
    OR "snapshot"::text LIKE '%/transparencia/informes-areas%';
