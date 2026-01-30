CREATE TABLE "news_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"news_item_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "news_tags_news_item_id_tag_id_unique" UNIQUE("news_item_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "news_items" DROP CONSTRAINT "news_items_tag_id_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "news_tags" ADD CONSTRAINT "news_tags_news_item_id_news_items_id_fk" FOREIGN KEY ("news_item_id") REFERENCES "public"."news_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_tags" ADD CONSTRAINT "news_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_items" DROP COLUMN "tag_id";