CREATE TABLE "activity_entry_slug_history" (
	"slug" text PRIMARY KEY NOT NULL,
	"activity_entry_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "press_article_slug_history" (
	"slug" text PRIMARY KEY NOT NULL,
	"press_article_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_entry_slug_history" ADD CONSTRAINT "activity_entry_slug_history_activity_entry_id_activity_entries_id_fk" FOREIGN KEY ("activity_entry_id") REFERENCES "public"."activity_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_article_slug_history" ADD CONSTRAINT "press_article_slug_history_press_article_id_press_articles_id_fk" FOREIGN KEY ("press_article_id") REFERENCES "public"."press_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_entry_slug_history_entry_id" ON "activity_entry_slug_history" USING btree ("activity_entry_id");--> statement-breakpoint
CREATE INDEX "idx_press_article_slug_history_article_id" ON "press_article_slug_history" USING btree ("press_article_id");