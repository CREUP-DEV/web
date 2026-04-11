CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "idx_press_article_translations_title_trgm" ON "press_article_translations" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_press_article_translations_description_trgm" ON "press_article_translations" USING gin ("description" gin_trgm_ops);
