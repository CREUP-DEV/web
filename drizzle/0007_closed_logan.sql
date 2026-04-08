CREATE OR REPLACE FUNCTION is_valid_organization_member_socials(data jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    jsonb_typeof(coalesce(data, '[]'::jsonb)) = 'array'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(coalesce(data, '[]'::jsonb)) AS social
      WHERE jsonb_typeof(social) <> 'object'
        OR jsonb_typeof(social->'network') <> 'string'
        OR btrim(coalesce(social->>'network', '')) = ''
        OR jsonb_typeof(social->'value') <> 'string'
        OR btrim(coalesce(social->>'value', '')) = ''
    );
$$;
--> statement-breakpoint

ALTER TABLE "press_articles" ALTER COLUMN "image" DROP NOT NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_carousel_item_translations_item_id" ON "carousel_item_translations"("carousel_item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tag_translations_tag_id" ON "tag_translations"("tag_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_press_article_translations_article_id" ON "press_article_translations"("press_article_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_featured_link_translations_link_id" ON "featured_link_translations"("featured_link_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_team_area_translations_area_id" ON "team_area_translations"("team_area_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_team_member_translations_member_id" ON "team_member_translations"("team_member_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_member_translations_member_id" ON "organization_member_translations"("organization_member_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_equality_document_translations_document_id" ON "equality_document_translations"("equality_document_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_financial_report_translations_report_id" ON "financial_report_translations"("financial_report_id");
--> statement-breakpoint

ALTER TABLE "newsletters"
  ALTER COLUMN "last_delivery_failed_recipients"
  TYPE jsonb
  USING CASE
    WHEN "last_delivery_failed_recipients" IS NULL THEN NULL
    ELSE "last_delivery_failed_recipients"::jsonb
  END;
--> statement-breakpoint

ALTER TABLE "newsletters" DROP COLUMN IF EXISTS "sending";
--> statement-breakpoint

DROP INDEX IF EXISTS "idx_newsletters_active_sent_sending";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_newsletters_active_sent_worker"
  ON "newsletters"("active", "sent_at", "last_delivery_worker_token");
--> statement-breakpoint

ALTER TABLE "press_articles"
  ALTER COLUMN "published_at" SET DEFAULT CURRENT_DATE;
--> statement-breakpoint

ALTER TABLE "organization_members"
  DROP CONSTRAINT IF EXISTS "organization_members_socials_shape_check";
--> statement-breakpoint
ALTER TABLE "organization_members"
  ADD CONSTRAINT "organization_members_socials_shape_check"
  CHECK (is_valid_organization_member_socials("socials"));
