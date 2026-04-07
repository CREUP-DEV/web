-- Step 1: Migrate singleton tables to fixed id='singleton'.
-- Any existing row is renamed; if none exists, nothing changes.
-- Only one row should ever exist, but handle safely with LIMIT 1.
UPDATE "about_page_content" SET id = 'singleton'
  WHERE id != 'singleton'
  AND id = (SELECT id FROM "about_page_content" ORDER BY created_at ASC LIMIT 1);--> statement-breakpoint
DELETE FROM "about_page_content" WHERE id != 'singleton';--> statement-breakpoint
UPDATE "press_dossier" SET id = 'singleton'
  WHERE id != 'singleton'
  AND id = (SELECT id FROM "press_dossier" ORDER BY created_at ASC LIMIT 1);--> statement-breakpoint
DELETE FROM "press_dossier" WHERE id != 'singleton';--> statement-breakpoint

-- Step 2: Fix any media_appearance rows that are missing externalUrl or mediaOutletId.
-- These would have been created before this constraint existed.
-- Since there is no production data it is safe to just delete bad rows.
DELETE FROM "press_articles"
  WHERE type = 'media_appearance' AND (external_url IS NULL OR media_outlet_id IS NULL);--> statement-breakpoint

-- Step 3: Schema changes
DROP INDEX IF EXISTS "idx_subscribers_confirm_token";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_subscribers_unsubscribe_token";--> statement-breakpoint
ALTER TABLE "about_page_content" ALTER COLUMN "id" SET DEFAULT 'singleton';--> statement-breakpoint
ALTER TABLE "press_dossier" ALTER COLUMN "id" SET DEFAULT 'singleton';--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_confirm_token_unique" UNIQUE("confirm_token");--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token");--> statement-breakpoint
ALTER TABLE "about_page_content" ADD CONSTRAINT "about_page_content_singleton_check" CHECK ("about_page_content"."id" = 'singleton');--> statement-breakpoint
ALTER TABLE "press_articles" ADD CONSTRAINT "press_articles_media_appearance_external_url_check" CHECK ("press_articles"."type" != 'media_appearance' OR "press_articles"."external_url" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "press_articles" ADD CONSTRAINT "press_articles_media_appearance_media_outlet_check" CHECK ("press_articles"."type" != 'media_appearance' OR "press_articles"."media_outlet_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "press_dossier" ADD CONSTRAINT "press_dossier_singleton_check" CHECK ("press_dossier"."id" = 'singleton');