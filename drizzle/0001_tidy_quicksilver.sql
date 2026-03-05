CREATE TABLE "press_article_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"press_article_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "press_article_tags_press_article_id_tag_id_unique" UNIQUE("press_article_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "press_article_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"alt" text,
	"press_article_id" text NOT NULL,
	CONSTRAINT "press_article_translations_press_article_id_locale_unique" UNIQUE("press_article_id","locale")
);
--> statement-breakpoint
CREATE TABLE "press_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"slug" text NOT NULL,
	"image" text NOT NULL,
	"pdf_url" text,
	"external_url" text,
	"media_outlet_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "press_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DROP TABLE "news_item_translations" CASCADE;--> statement-breakpoint
DROP TABLE "news_items" CASCADE;--> statement-breakpoint
DROP TABLE "news_tags" CASCADE;--> statement-breakpoint
ALTER TABLE "press_article_tags" ADD CONSTRAINT "press_article_tags_press_article_id_press_articles_id_fk" FOREIGN KEY ("press_article_id") REFERENCES "public"."press_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_article_tags" ADD CONSTRAINT "press_article_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_article_translations" ADD CONSTRAINT "press_article_translations_press_article_id_press_articles_id_fk" FOREIGN KEY ("press_article_id") REFERENCES "public"."press_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_articles" ADD CONSTRAINT "press_articles_media_outlet_id_media_outlets_id_fk" FOREIGN KEY ("media_outlet_id") REFERENCES "public"."media_outlets"("id") ON DELETE set null ON UPDATE no action;