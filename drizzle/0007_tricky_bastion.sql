ALTER TABLE "press_article_tags" DROP CONSTRAINT "press_article_tags_press_article_id_tag_id_unique";--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ALTER COLUMN "consent_text_version" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "press_article_tags" ADD CONSTRAINT "press_article_tags_press_article_id_tag_id_pk" PRIMARY KEY("press_article_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_press_articles_slug_active" ON "press_articles" USING btree ("slug","active");--> statement-breakpoint
ALTER TABLE "press_article_tags" DROP COLUMN "id";