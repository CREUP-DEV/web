CREATE TABLE "newsletter_campaign_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_campaign_deliveries_campaign_subscriber_unique" UNIQUE("campaign_id","subscriber_id"),
	CONSTRAINT "newsletter_campaign_deliveries_status_check" CHECK ("newsletter_campaign_deliveries"."status" in ('queued', 'sending', 'sent', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaign_item_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title_override" text,
	"excerpt_override" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"campaign_item_id" text NOT NULL,
	CONSTRAINT "newsletter_campaign_item_translations_locale_campaign_item_id_unique" UNIQUE("locale","campaign_item_id"),
	CONSTRAINT "newsletter_campaign_item_translations_locale_check" CHECK ("newsletter_campaign_item_translations"."locale" in ('es', 'en', 'ca', 'eu', 'gl', 'val'))
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaign_items" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"position" integer NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"snapshot" jsonb,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_campaign_items_campaign_item_unique" UNIQUE("campaign_id","item_type","item_id"),
	CONSTRAINT "newsletter_campaign_items_item_type_check" CHECK ("newsletter_campaign_items"."item_type" in ('press', 'activity', 'area_report')),
	CONSTRAINT "newsletter_campaign_items_position_check" CHECK ("newsletter_campaign_items"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaign_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"subject" text NOT NULL,
	"preheader" text,
	"intro_html" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"campaign_id" text NOT NULL,
	CONSTRAINT "newsletter_campaign_translations_locale_campaign_id_unique" UNIQUE("locale","campaign_id"),
	CONSTRAINT "newsletter_campaign_translations_locale_check" CHECK ("newsletter_campaign_translations"."locale" in ('es', 'en', 'ca', 'eu', 'gl', 'val'))
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp with time zone,
	"last_delivery_started_at" timestamp with time zone,
	"last_delivery_heartbeat_at" timestamp with time zone,
	"last_delivery_finished_at" timestamp with time zone,
	"last_delivery_total" integer,
	"last_delivery_sent_count" integer,
	"last_delivery_error_count" integer,
	"last_delivery_failed_recipients" jsonb,
	"last_delivery_worker_token" text,
	"unsubscribe_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_campaigns_status_check" CHECK ("newsletter_campaigns"."status" in ('draft', 'queued', 'sending', 'sent', 'paused', 'failed')),
	CONSTRAINT "newsletter_campaigns_sent_at_status_check" CHECK (("newsletter_campaigns"."status" = 'sent') = ("newsletter_campaigns"."sent_at" is not null)),
	CONSTRAINT "newsletter_campaigns_worker_token_status_check" CHECK (("newsletter_campaigns"."last_delivery_worker_token" is not null) = ("newsletter_campaigns"."status" in ('queued', 'sending')))
);
--> statement-breakpoint
ALTER TABLE "newsletter_campaign_deliveries" ADD CONSTRAINT "newsletter_campaign_deliveries_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_deliveries" ADD CONSTRAINT "newsletter_campaign_deliveries_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_item_translations" ADD CONSTRAINT "newsletter_campaign_item_translations_campaign_item_id_newsletter_campaign_items_id_fk" FOREIGN KEY ("campaign_item_id") REFERENCES "public"."newsletter_campaign_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_items" ADD CONSTRAINT "newsletter_campaign_items_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaign_translations" ADD CONSTRAINT "newsletter_campaign_translations_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_newsletter_campaign_deliveries_status" ON "newsletter_campaign_deliveries" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "idx_newsletter_campaign_deliveries_subscriber" ON "newsletter_campaign_deliveries" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "idx_newsletter_campaign_item_translations_item_id" ON "newsletter_campaign_item_translations" USING btree ("campaign_item_id");--> statement-breakpoint
CREATE INDEX "idx_newsletter_campaign_items_campaign_position" ON "newsletter_campaign_items" USING btree ("campaign_id","position");--> statement-breakpoint
CREATE INDEX "idx_newsletter_campaign_items_asset_paths" ON "newsletter_campaign_items" USING gin (("snapshot" -> 'assetPaths'));--> statement-breakpoint
CREATE INDEX "idx_newsletter_campaign_translations_campaign_id" ON "newsletter_campaign_translations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_newsletter_campaigns_sent_worker" ON "newsletter_campaigns" USING btree ("sent_at","last_delivery_worker_token");--> statement-breakpoint
CREATE INDEX "idx_newsletter_campaigns_status_created" ON "newsletter_campaigns" USING btree ("status","created_at");