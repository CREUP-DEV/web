UPDATE "verifications"
SET
  "created_at" = COALESCE("created_at", "updated_at", NOW()),
  "updated_at" = COALESCE("updated_at", "created_at", NOW())
WHERE "created_at" IS NULL OR "updated_at" IS NULL;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "updated_at" SET NOT NULL;
