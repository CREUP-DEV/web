CREATE TABLE "about_page_content" (
	"id" text PRIMARY KEY NOT NULL,
	"hero_image" text,
	"hero_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_access" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_access_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "carousel_item_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"button_text" text NOT NULL,
	"alt" text,
	"carousel_item_id" text NOT NULL,
	CONSTRAINT "carousel_item_translations_locale_carousel_item_id_unique" UNIQUE("locale","carousel_item_id")
);
--> statement-breakpoint
CREATE TABLE "carousel_items" (
	"id" text PRIMARY KEY NOT NULL,
	"image" text NOT NULL,
	"href" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equality_document_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"meta" text,
	"equality_document_id" text NOT NULL,
	CONSTRAINT "equality_document_translations_locale_equality_document_id_unique" UNIQUE("locale","equality_document_id")
);
--> statement-breakpoint
CREATE TABLE "equality_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"pdf_url" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_link_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"alt" text,
	"featured_link_id" text NOT NULL,
	CONSTRAINT "featured_link_translations_locale_featured_link_id_unique" UNIQUE("locale","featured_link_id")
);
--> statement-breakpoint
CREATE TABLE "featured_links" (
	"id" text PRIMARY KEY NOT NULL,
	"image" text NOT NULL,
	"to" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_report_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"financial_report_id" text NOT NULL,
	CONSTRAINT "financial_report_translations_locale_financial_report_id_unique" UNIQUE("locale","financial_report_id")
);
--> statement-breakpoint
CREATE TABLE "financial_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"pdf_url" text NOT NULL,
	"approved_at" timestamp NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_outlets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website" text NOT NULL,
	"logo" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"confirm_token" text,
	"unsubscribe_token" text NOT NULL,
	"consent_ip" text,
	"consent_user_agent" text,
	"consent_source" text DEFAULT 'web_form' NOT NULL,
	"consent_text_version" text DEFAULT '2026-03-06' NOT NULL,
	"age_confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "newsletters" (
	"id" text PRIMARY KEY NOT NULL,
	"month_key" text NOT NULL,
	"month" timestamp NOT NULL,
	"cover_image" text NOT NULL,
	"pdf_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sending" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_member_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"university" text NOT NULL,
	"organization_member_id" text NOT NULL,
	CONSTRAINT "organization_member_translations_locale_member_unique" UNIQUE("locale","organization_member_id")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"website" text,
	"email" text,
	"instagram" text,
	"twitter" text,
	"facebook" text,
	"linkedin" text,
	"tiktok" text,
	"autonomous_community" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
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
	"content_html" text,
	"alt" text,
	"press_article_id" text NOT NULL,
	CONSTRAINT "press_article_translations_locale_press_article_id_unique" UNIQUE("locale","press_article_id")
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
CREATE TABLE "press_dossier" (
	"id" text PRIMARY KEY NOT NULL,
	"pdf_url" text,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tag_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "tag_translations_locale_tag_id_unique" UNIQUE("locale","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_area_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"team_area_id" text NOT NULL,
	CONSTRAINT "team_area_translations_locale_team_area_id_unique" UNIQUE("locale","team_area_id")
);
--> statement-breakpoint
CREATE TABLE "team_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_member_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"full_name" text NOT NULL,
	"university" text,
	"degree" text,
	"description" text,
	"team_member_id" text NOT NULL,
	CONSTRAINT "team_member_translations_locale_team_member_id_unique" UNIQUE("locale","team_member_id")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"photo" text,
	"calendar_id" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"team_area_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_item_translations" ADD CONSTRAINT "carousel_item_translations_carousel_item_id_carousel_items_id_fk" FOREIGN KEY ("carousel_item_id") REFERENCES "public"."carousel_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equality_document_translations" ADD CONSTRAINT "equality_document_translations_equality_document_id_equality_documents_id_fk" FOREIGN KEY ("equality_document_id") REFERENCES "public"."equality_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_link_translations" ADD CONSTRAINT "featured_link_translations_featured_link_id_featured_links_id_fk" FOREIGN KEY ("featured_link_id") REFERENCES "public"."featured_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_report_translations" ADD CONSTRAINT "financial_report_translations_financial_report_id_financial_reports_id_fk" FOREIGN KEY ("financial_report_id") REFERENCES "public"."financial_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member_translations" ADD CONSTRAINT "organization_member_translations_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_article_tags" ADD CONSTRAINT "press_article_tags_press_article_id_press_articles_id_fk" FOREIGN KEY ("press_article_id") REFERENCES "public"."press_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_article_tags" ADD CONSTRAINT "press_article_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_article_translations" ADD CONSTRAINT "press_article_translations_press_article_id_press_articles_id_fk" FOREIGN KEY ("press_article_id") REFERENCES "public"."press_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_articles" ADD CONSTRAINT "press_articles_media_outlet_id_media_outlets_id_fk" FOREIGN KEY ("media_outlet_id") REFERENCES "public"."media_outlets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_translations" ADD CONSTRAINT "tag_translations_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_area_translations" ADD CONSTRAINT "team_area_translations_team_area_id_team_areas_id_fk" FOREIGN KEY ("team_area_id") REFERENCES "public"."team_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_translations" ADD CONSTRAINT "team_member_translations_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_area_id_team_areas_id_fk" FOREIGN KEY ("team_area_id") REFERENCES "public"."team_areas"("id") ON DELETE cascade ON UPDATE no action;