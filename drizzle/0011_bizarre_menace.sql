CREATE SEQUENCE "public"."area_catalog_manual_selection_key_seq" INCREMENT BY -1 MINVALUE -2147483648 MAXVALUE -1 START WITH -1 CACHE 1;--> statement-breakpoint
CREATE TABLE "area_catalog_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"selection_key" integer NOT NULL,
	"external_id" integer,
	"name_translations" jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "area_catalog_entries_selection_key_unique" UNIQUE("selection_key"),
	CONSTRAINT "area_catalog_entries_external_id_unique" UNIQUE("external_id"),
	CONSTRAINT "area_catalog_entries_selection_key_check" CHECK (("area_catalog_entries"."external_id" IS NOT NULL AND "area_catalog_entries"."selection_key" = "area_catalog_entries"."external_id")
        OR ("area_catalog_entries"."external_id" IS NULL AND "area_catalog_entries"."selection_key" < 0))
);
--> statement-breakpoint
CREATE TABLE "catalog_sync_state" (
	"catalog_key" text PRIMARY KEY NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"last_error_message" text,
	CONSTRAINT "catalog_sync_state_catalog_key_check" CHECK ("catalog_sync_state"."catalog_key" in ('area', 'member-org'))
);
--> statement-breakpoint
CREATE TABLE "member_org_catalog_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"source" "member_org_source" NOT NULL,
	"selection_key" text NOT NULL,
	"source_key" text,
	"denomination" text NOT NULL,
	"initials" text NOT NULL,
	"logo_light" text,
	"logo_dark" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"superseded_by_entry_id" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_org_catalog_entries_source_selection_key_unique" UNIQUE("source","selection_key"),
	CONSTRAINT "member_org_catalog_entries_source_source_key_unique" UNIQUE("source","source_key"),
	CONSTRAINT "member_org_catalog_entries_selection_key_check" CHECK (("member_org_catalog_entries"."source_key" IS NOT NULL AND "member_org_catalog_entries"."selection_key" = "member_org_catalog_entries"."source_key")
        OR ("member_org_catalog_entries"."source_key" IS NULL AND "member_org_catalog_entries"."selection_key" LIKE 'manual:%')),
	CONSTRAINT "member_org_catalog_entries_superseded_by_self_check" CHECK ("member_org_catalog_entries"."id" != "member_org_catalog_entries"."superseded_by_entry_id")
);
--> statement-breakpoint
ALTER TABLE "member_org_catalog_entries" ADD CONSTRAINT "member_org_catalog_entries_superseded_by_entry_id_member_org_catalog_entries_id_fk" FOREIGN KEY ("superseded_by_entry_id") REFERENCES "public"."member_org_catalog_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_area_catalog_entries_active_order" ON "area_catalog_entries" USING btree ("active","order");--> statement-breakpoint
CREATE INDEX "idx_member_org_catalog_entries_source_active_order" ON "member_org_catalog_entries" USING btree ("source","active","order");--> statement-breakpoint
INSERT INTO "catalog_sync_state" ("catalog_key") VALUES ('area'), ('member-org');