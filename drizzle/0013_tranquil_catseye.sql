-- The area catalog is a pure cache of the org chart and is rebuilt from the mandates API on the
-- next admin read, so it is emptied here rather than back-filled: the new mandate columns are NOT
-- NULL and the old rows have no mandate to put in them. `area_reports.area_id` is a soft reference
-- (no FK), so nothing else is affected.
DELETE FROM "area_catalog_entries";--> statement-breakpoint
ALTER TABLE "area_catalog_entries" ADD COLUMN "mandate_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "area_catalog_entries" ADD COLUMN "mandate_start_date" text NOT NULL;--> statement-breakpoint
ALTER TABLE "area_catalog_entries" ADD COLUMN "mandate_end_date" text;--> statement-breakpoint
CREATE INDEX "idx_area_catalog_entries_mandate_order" ON "area_catalog_entries" USING btree ("mandate_id","order");
