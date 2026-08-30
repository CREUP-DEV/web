ALTER TABLE "area_catalog_entries" DROP CONSTRAINT "area_catalog_entries_external_id_unique";--> statement-breakpoint
ALTER TABLE "area_catalog_entries" DROP CONSTRAINT "area_catalog_entries_selection_key_check";--> statement-breakpoint
ALTER TABLE "area_catalog_entries" DROP COLUMN "external_id";--> statement-breakpoint
DROP SEQUENCE "public"."area_catalog_manual_selection_key_seq";