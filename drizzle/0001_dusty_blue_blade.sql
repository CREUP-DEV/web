ALTER TABLE "newsletter_subscribers" ADD COLUMN "confirm_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "last_delivery_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "last_delivery_finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "last_delivery_total" integer;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "last_delivery_sent_count" integer;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "last_delivery_error_count" integer;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "last_delivery_failed_recipients" text;--> statement-breakpoint
CREATE INDEX "idx_subscribers_confirm_token" ON "newsletter_subscribers" USING btree ("confirm_token");--> statement-breakpoint
CREATE INDEX "idx_subscribers_unsubscribe_token" ON "newsletter_subscribers" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "idx_newsletters_active_sent_sending" ON "newsletters" USING btree ("active","sent_at","sending");--> statement-breakpoint
CREATE INDEX "idx_press_articles_active_published" ON "press_articles" USING btree ("active","published_at");--> statement-breakpoint
CREATE INDEX "idx_press_articles_type" ON "press_articles" USING btree ("type");--> statement-breakpoint
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_month_key_unique" UNIQUE("month_key");