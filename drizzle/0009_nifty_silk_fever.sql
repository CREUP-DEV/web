CREATE TYPE "public"."activity_kind" AS ENUM('creup', 'member');--> statement-breakpoint
CREATE TYPE "public"."member_org_source" AS ENUM('asociado', 'sectorial');--> statement-breakpoint
CREATE TABLE "activity_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "activity_kind" NOT NULL,
	"slug" text NOT NULL,
	"image" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_online" boolean DEFAULT false NOT NULL,
	"location" text,
	"member_org_source" "member_org_source",
	"member_org_id" text,
	"member_org_snapshot" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_entries_slug_unique" UNIQUE("slug"),
	CONSTRAINT "activity_entries_member_org_check" CHECK ((
        "activity_entries"."kind" = 'member'
        AND "activity_entries"."member_org_source" IS NOT NULL
        AND "activity_entries"."member_org_id" IS NOT NULL
        AND "activity_entries"."member_org_snapshot" IS NOT NULL
      ) OR (
        "activity_entries"."kind" = 'creup'
        AND "activity_entries"."member_org_source" IS NULL
        AND "activity_entries"."member_org_id" IS NULL
        AND "activity_entries"."member_org_snapshot" IS NULL
      )),
	CONSTRAINT "activity_entries_online_location_check" CHECK ("activity_entries"."is_online" = false OR "activity_entries"."location" IS NULL),
	CONSTRAINT "activity_entries_date_range_check" CHECK ("activity_entries"."end_date" IS NULL OR "activity_entries"."end_date" >= "activity_entries"."start_date")
);
--> statement-breakpoint
CREATE TABLE "activity_entry_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content_html" text,
	"image_caption" text,
	"alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activity_entry_id" text NOT NULL,
	CONSTRAINT "activity_entry_translations_locale_activity_entry_id_unique" UNIQUE("locale","activity_entry_id"),
	CONSTRAINT "activity_entry_translations_locale_check" CHECK ("activity_entry_translations"."locale" in ('es', 'en', 'ca', 'eu', 'gl', 'val'))
);
--> statement-breakpoint
CREATE TABLE "area_report_editions" (
	"month_key" text PRIMARY KEY NOT NULL,
	"covers_from" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "area_report_editions_month_key_format_check" CHECK ("area_report_editions"."month_key" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
	CONSTRAINT "area_report_editions_covers_from_format_check" CHECK ("area_report_editions"."covers_from" IS NULL OR "area_report_editions"."covers_from" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
	CONSTRAINT "area_report_editions_covers_from_range_check" CHECK ("area_report_editions"."covers_from" IS NULL OR "area_report_editions"."covers_from" <= "area_report_editions"."month_key")
);
--> statement-breakpoint
CREATE TABLE "area_report_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"content_html" text NOT NULL,
	"image_caption" text,
	"alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"area_report_id" text NOT NULL,
	CONSTRAINT "area_report_translations_locale_area_report_id_unique" UNIQUE("locale","area_report_id"),
	CONSTRAINT "area_report_translations_locale_check" CHECK ("area_report_translations"."locale" in ('es', 'en', 'ca', 'eu', 'gl', 'val'))
);
--> statement-breakpoint
CREATE TABLE "area_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"month_key" text NOT NULL,
	"area_id" integer NOT NULL,
	"area_name_snapshot" jsonb NOT NULL,
	"area_order_snapshot" integer,
	"image" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "area_reports_month_key_area_id_unique" UNIQUE("month_key","area_id")
);
--> statement-breakpoint
ALTER TABLE "activity_entry_translations" ADD CONSTRAINT "activity_entry_translations_activity_entry_id_activity_entries_id_fk" FOREIGN KEY ("activity_entry_id") REFERENCES "public"."activity_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_report_translations" ADD CONSTRAINT "area_report_translations_area_report_id_area_reports_id_fk" FOREIGN KEY ("area_report_id") REFERENCES "public"."area_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_reports" ADD CONSTRAINT "area_reports_month_key_area_report_editions_month_key_fk" FOREIGN KEY ("month_key") REFERENCES "public"."area_report_editions"("month_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_entries_active_start" ON "activity_entries" USING btree ("active","start_date");--> statement-breakpoint
CREATE INDEX "idx_activity_entries_slug_active" ON "activity_entries" USING btree ("slug","active");--> statement-breakpoint
CREATE INDEX "idx_activity_entries_kind" ON "activity_entries" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "idx_activity_entry_translations_entry_id" ON "activity_entry_translations" USING btree ("activity_entry_id");--> statement-breakpoint
CREATE INDEX "idx_activity_entry_translations_title_trgm" ON "activity_entry_translations" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_entry_translations_excerpt_trgm" ON "activity_entry_translations" USING gin ("excerpt" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_area_report_translations_report_id" ON "area_report_translations" USING btree ("area_report_id");--> statement-breakpoint
CREATE INDEX "idx_area_reports_month_key_active" ON "area_reports" USING btree ("month_key","active");--> statement-breakpoint
-- Non-overlap of edition coverage ranges (plan §4.2). Drizzle cannot express STORED generated
-- columns nor EXCLUDE USING gist, so they are hand-written below. The two generated *_idx
-- columns turn 'YYYY-MM' into a sortable month ordinal (year*12 + month); the exclusion forbids
-- any two editions whose inclusive ranges [coalesce(covers_from, month_key) .. month_key] touch.
-- The single int4range column uses the built-in range gist opclass; btree_gist is ensured per
-- plan so a future scalar-combined exclusion would already have its opclasses available.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "area_report_editions" ADD COLUMN "month_key_idx" integer GENERATED ALWAYS AS (split_part("month_key", '-', 1)::int * 12 + split_part("month_key", '-', 2)::int) STORED;--> statement-breakpoint
ALTER TABLE "area_report_editions" ADD COLUMN "covers_from_idx" integer GENERATED ALWAYS AS (split_part("covers_from", '-', 1)::int * 12 + split_part("covers_from", '-', 2)::int) STORED;--> statement-breakpoint
ALTER TABLE "area_report_editions" ADD CONSTRAINT "area_report_editions_no_overlap" EXCLUDE USING gist ((int4range(coalesce("covers_from_idx", "month_key_idx"), "month_key_idx", '[]')) WITH &&);