-- Contract step of the newsletter migration: the PDF-edition model goes away.
--
-- The guard lives here rather than in a runbook because a separate manual check is a check someone
-- eventually skips. If either table holds anything that was actually delivered, this aborts and the
-- removal has to be reconsidered as a conversion rather than a drop.
--
-- A passing guard does not make this reversible: take a database backup before applying it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM newsletters WHERE sent_at IS NOT NULL)
     OR EXISTS (SELECT 1 FROM newsletter_deliveries) THEN
    RAISE EXCEPTION 'newsletters were delivered: review before dropping the PDF tables';
  END IF;
END $$;--> statement-breakpoint
DELETE FROM "site_default_images" WHERE "scope" = 'newsletter';--> statement-breakpoint
ALTER TABLE "newsletter_deliveries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "newsletters" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "newsletter_deliveries" CASCADE;--> statement-breakpoint
DROP TABLE "newsletters" CASCADE;--> statement-breakpoint
ALTER TABLE "site_default_images" DROP CONSTRAINT "site_default_images_scope_slot_check";--> statement-breakpoint
ALTER TABLE "site_default_images" ADD CONSTRAINT "site_default_images_scope_slot_check" CHECK (("site_default_images"."scope", "site_default_images"."slot") IN (
        ('press', 'press_release'),
        ('press', 'statement'),
        ('press', 'media_appearance'),
        ('carousel', 'slide'),
        ('seo', 'og_image'),
        ('activity', 'entry'),
        ('area_report', 'report')
      ));
