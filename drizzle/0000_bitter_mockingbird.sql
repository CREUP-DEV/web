CREATE TYPE "public"."press_article_type" AS ENUM('press_release', 'statement', 'media_appearance');--> statement-breakpoint
CREATE TABLE "about_page_content" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"hero_image" text,
	"hero_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "about_page_content_singleton_check" CHECK ("about_page_content"."id" = 'singleton')
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
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_provider_id_account_id_unique" UNIQUE("provider_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "admin_access" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_access_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "carousel_item_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"button_text" text NOT NULL,
	"alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"carousel_item_id" text NOT NULL,
	CONSTRAINT "carousel_item_translations_locale_carousel_item_id_unique" UNIQUE("locale","carousel_item_id"),
	CONSTRAINT "carousel_item_translations_locale_check" CHECK ("carousel_item_translations"."locale" in ('es', 'en'))
);
--> statement-breakpoint
CREATE TABLE "carousel_items" (
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"href" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equality_document_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"meta" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"equality_document_id" text NOT NULL,
	CONSTRAINT "equality_document_translations_locale_equality_document_id_unique" UNIQUE("locale","equality_document_id"),
	CONSTRAINT "equality_document_translations_locale_check" CHECK ("equality_document_translations"."locale" in ('es', 'en'))
);
--> statement-breakpoint
CREATE TABLE "equality_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"pdf_url" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_link_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"featured_link_id" text NOT NULL,
	CONSTRAINT "featured_link_translations_locale_featured_link_id_unique" UNIQUE("locale","featured_link_id"),
	CONSTRAINT "featured_link_translations_locale_check" CHECK ("featured_link_translations"."locale" in ('es', 'en'))
);
--> statement-breakpoint
CREATE TABLE "featured_links" (
	"id" text PRIMARY KEY NOT NULL,
	"image" text NOT NULL,
	"to" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_report_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"financial_report_id" text NOT NULL,
	CONSTRAINT "financial_report_translations_locale_financial_report_id_unique" UNIQUE("locale","financial_report_id"),
	CONSTRAINT "financial_report_translations_locale_check" CHECK ("financial_report_translations"."locale" in ('es', 'en'))
);
--> statement-breakpoint
CREATE TABLE "financial_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"pdf_url" text NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_outlets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website" text NOT NULL,
	"logo" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"newsletter_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_deliveries_newsletter_subscriber_unique" UNIQUE("newsletter_id","subscriber_id"),
	CONSTRAINT "newsletter_deliveries_status_check" CHECK ("newsletter_deliveries"."status" in ('queued', 'sending', 'sent', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"confirm_token" text,
	"confirm_token_expires_at" timestamp with time zone,
	"unsubscribe_token" text,
	"consent_ip" text,
	"consent_user_agent" text,
	"consent_source" text DEFAULT 'web_form' NOT NULL,
	"consent_text_version" text NOT NULL,
	"age_confirmed" boolean DEFAULT false NOT NULL,
	"locale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscribers_confirm_token_unique" UNIQUE("confirm_token"),
	CONSTRAINT "newsletter_subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token"),
	CONSTRAINT "newsletter_subscribers_consent_source_check" CHECK ("newsletter_subscribers"."consent_source" in ('web_form', 'email_link', 'admin_manual', 'legacy_import', 'system')),
	CONSTRAINT "newsletter_subscribers_locale_check" CHECK ("newsletter_subscribers"."locale" IS NULL OR "newsletter_subscribers"."locale" in ('es', 'en'))
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscription_events" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriber_id" text,
	"email" text NOT NULL,
	"event_type" text NOT NULL,
	"event_source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscription_events_type_check" CHECK ("newsletter_subscription_events"."event_type" in (
        'requested',
        'confirmed',
        'unsubscribed',
        'admin_created',
        'admin_updated',
        'admin_deleted',
        'confirmation_expired'
      )),
	CONSTRAINT "newsletter_subscription_events_source_check" CHECK ("newsletter_subscription_events"."event_source" in ('web_form', 'email_link', 'admin_manual', 'legacy_import', 'system'))
);
--> statement-breakpoint
CREATE TABLE "newsletters" (
	"id" text PRIMARY KEY NOT NULL,
	"month_key" text NOT NULL,
	"month" date NOT NULL,
	"cover_image" text,
	"pdf_url" text NOT NULL,
	"public_visible" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone,
	"last_delivery_started_at" timestamp with time zone,
	"last_delivery_heartbeat_at" timestamp with time zone,
	"last_delivery_finished_at" timestamp with time zone,
	"last_delivery_total" integer,
	"last_delivery_sent_count" integer,
	"last_delivery_error_count" integer,
	"last_delivery_failed_recipients" jsonb,
	"last_delivery_worker_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletters_month_key_unique" UNIQUE("month_key")
);
--> statement-breakpoint
CREATE TABLE "organization_member_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"university" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organization_member_id" text NOT NULL,
	CONSTRAINT "organization_member_translations_locale_member_unique" UNIQUE("locale","organization_member_id"),
	CONSTRAINT "organization_member_translations_locale_check" CHECK ("organization_member_translations"."locale" in ('es', 'en'))
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"website" text,
	"email" text,
	"socials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"autonomous_community" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "press_article_tags" (
	"press_article_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "press_article_tags_press_article_id_tag_id_pk" PRIMARY KEY("press_article_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "press_article_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content_html" text,
	"alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"press_article_id" text NOT NULL,
	CONSTRAINT "press_article_translations_locale_press_article_id_unique" UNIQUE("locale","press_article_id"),
	CONSTRAINT "press_article_translations_locale_check" CHECK ("press_article_translations"."locale" in ('es', 'en'))
);
--> statement-breakpoint
CREATE TABLE "press_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "press_article_type" NOT NULL,
	"slug" text NOT NULL,
	"image" text,
	"pdf_url" text,
	"external_url" text,
	"media_outlet_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"published_at" date DEFAULT CURRENT_DATE NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "press_articles_slug_unique" UNIQUE("slug"),
	CONSTRAINT "press_articles_media_appearance_external_url_check" CHECK ("press_articles"."type" != 'media_appearance' OR "press_articles"."external_url" IS NOT NULL),
	CONSTRAINT "press_articles_media_appearance_media_outlet_check" CHECK ("press_articles"."type" != 'media_appearance' OR "press_articles"."media_outlet_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "press_dossier" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"pdf_url" text,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "press_dossier_singleton_check" CHECK ("press_dossier"."id" = 'singleton')
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "site_default_images" (
	"scope" text NOT NULL,
	"slot" text NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_default_images_scope_slot_pk" PRIMARY KEY("scope","slot")
);
--> statement-breakpoint
CREATE TABLE "tag_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "tag_translations_locale_tag_id_unique" UNIQUE("locale","tag_id"),
	CONSTRAINT "tag_translations_locale_check" CHECK ("tag_translations"."locale" in ('es', 'en'))
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_area_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_area_id" text NOT NULL,
	CONSTRAINT "team_area_translations_locale_team_area_id_unique" UNIQUE("locale","team_area_id"),
	CONSTRAINT "team_area_translations_locale_check" CHECK ("team_area_translations"."locale" in ('es', 'en'))
);
--> statement-breakpoint
CREATE TABLE "team_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_member_id" text NOT NULL,
	CONSTRAINT "team_member_translations_locale_team_member_id_unique" UNIQUE("locale","team_member_id"),
	CONSTRAINT "team_member_translations_locale_check" CHECK ("team_member_translations"."locale" in ('es', 'en'))
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_item_translations" ADD CONSTRAINT "carousel_item_translations_carousel_item_id_carousel_items_id_fk" FOREIGN KEY ("carousel_item_id") REFERENCES "public"."carousel_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equality_document_translations" ADD CONSTRAINT "equality_document_translations_equality_document_id_equality_documents_id_fk" FOREIGN KEY ("equality_document_id") REFERENCES "public"."equality_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_link_translations" ADD CONSTRAINT "featured_link_translations_featured_link_id_featured_links_id_fk" FOREIGN KEY ("featured_link_id") REFERENCES "public"."featured_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_report_translations" ADD CONSTRAINT "financial_report_translations_financial_report_id_financial_reports_id_fk" FOREIGN KEY ("financial_report_id") REFERENCES "public"."financial_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_deliveries" ADD CONSTRAINT "newsletter_deliveries_newsletter_id_newsletters_id_fk" FOREIGN KEY ("newsletter_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_deliveries" ADD CONSTRAINT "newsletter_deliveries_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscription_events" ADD CONSTRAINT "newsletter_subscription_events_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member_translations" ADD CONSTRAINT "organization_member_translations_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_article_tags" ADD CONSTRAINT "press_article_tags_press_article_id_press_articles_id_fk" FOREIGN KEY ("press_article_id") REFERENCES "public"."press_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_article_tags" ADD CONSTRAINT "press_article_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_article_translations" ADD CONSTRAINT "press_article_translations_press_article_id_press_articles_id_fk" FOREIGN KEY ("press_article_id") REFERENCES "public"."press_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "press_articles" ADD CONSTRAINT "press_articles_media_outlet_id_media_outlets_id_fk" FOREIGN KEY ("media_outlet_id") REFERENCES "public"."media_outlets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_translations" ADD CONSTRAINT "tag_translations_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_area_translations" ADD CONSTRAINT "team_area_translations_team_area_id_team_areas_id_fk" FOREIGN KEY ("team_area_id") REFERENCES "public"."team_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_translations" ADD CONSTRAINT "team_member_translations_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_area_id_team_areas_id_fk" FOREIGN KEY ("team_area_id") REFERENCES "public"."team_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_user_id" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_carousel_item_translations_item_id" ON "carousel_item_translations" USING btree ("carousel_item_id");--> statement-breakpoint
CREATE INDEX "idx_carousel_items_active_order" ON "carousel_items" USING btree ("active","order");--> statement-breakpoint
CREATE INDEX "idx_equality_document_translations_document_id" ON "equality_document_translations" USING btree ("equality_document_id");--> statement-breakpoint
CREATE INDEX "idx_equality_documents_active_order" ON "equality_documents" USING btree ("active","order");--> statement-breakpoint
CREATE INDEX "idx_featured_link_translations_link_id" ON "featured_link_translations" USING btree ("featured_link_id");--> statement-breakpoint
CREATE INDEX "idx_featured_links_active_order" ON "featured_links" USING btree ("active","order");--> statement-breakpoint
CREATE INDEX "idx_financial_report_translations_report_id" ON "financial_report_translations" USING btree ("financial_report_id");--> statement-breakpoint
CREATE INDEX "idx_financial_reports_active_order" ON "financial_reports" USING btree ("active","order");--> statement-breakpoint
CREATE INDEX "idx_financial_reports_active_approved" ON "financial_reports" USING btree ("active","approved_at");--> statement-breakpoint
CREATE INDEX "idx_newsletter_deliveries_status" ON "newsletter_deliveries" USING btree ("newsletter_id","status");--> statement-breakpoint
CREATE INDEX "idx_newsletter_deliveries_subscriber" ON "newsletter_deliveries" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscribers_active_subscribed" ON "newsletter_subscribers" USING btree ("active","subscribed_at");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscribers_token_cleanup" ON "newsletter_subscribers" USING btree ("confirm_token_expires_at") WHERE "newsletter_subscribers"."active" = false AND "newsletter_subscribers"."confirm_token_expires_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscription_events_subscriber_created" ON "newsletter_subscription_events" USING btree ("subscriber_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscription_events_email" ON "newsletter_subscription_events" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_newsletters_sent_worker" ON "newsletters" USING btree ("sent_at","last_delivery_worker_token");--> statement-breakpoint
CREATE INDEX "idx_newsletters_public_visible_month" ON "newsletters" USING btree ("public_visible","month");--> statement-breakpoint
CREATE INDEX "idx_organization_member_translations_member_id" ON "organization_member_translations" USING btree ("organization_member_id");--> statement-breakpoint
CREATE INDEX "idx_organization_members_active_order" ON "organization_members" USING btree ("active","order");--> statement-breakpoint
CREATE INDEX "idx_press_article_tags_tag_id" ON "press_article_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_press_article_translations_article_id" ON "press_article_translations" USING btree ("press_article_id");--> statement-breakpoint
CREATE INDEX "idx_press_article_translations_title_trgm" ON "press_article_translations" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_press_article_translations_description_trgm" ON "press_article_translations" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_press_articles_active_published" ON "press_articles" USING btree ("active","published_at");--> statement-breakpoint
CREATE INDEX "idx_press_articles_slug_active" ON "press_articles" USING btree ("slug","active");--> statement-breakpoint
CREATE INDEX "idx_press_articles_type" ON "press_articles" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_press_articles_media_outlet_id" ON "press_articles" USING btree ("media_outlet_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_tag_translations_tag_id" ON "tag_translations" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_team_area_translations_area_id" ON "team_area_translations" USING btree ("team_area_id");--> statement-breakpoint
CREATE INDEX "idx_team_member_translations_member_id" ON "team_member_translations" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_team_area_id" ON "team_members" USING btree ("team_area_id");--> statement-breakpoint
CREATE INDEX "idx_verifications_expires_at" ON "verifications" USING btree ("expires_at");