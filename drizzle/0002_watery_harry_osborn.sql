ALTER TABLE "newsletter_subscribers" ALTER COLUMN "unsubscribe_token" DROP NOT NULL;--> statement-breakpoint
INSERT INTO "press_dossier" ("id", "pdf_url", "active") VALUES ('singleton', NULL, false) ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "about_page_content" ("id", "hero_image", "hero_visible") VALUES ('singleton', NULL, true) ON CONFLICT ("id") DO NOTHING;