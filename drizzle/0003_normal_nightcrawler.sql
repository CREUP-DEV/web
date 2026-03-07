ALTER TABLE "newsletters" ADD COLUMN "month_key" text;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "sending" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "sent_at" timestamp;--> statement-breakpoint
UPDATE "newsletters"
SET "month_key" = to_char("month", 'YYYY-MM')
WHERE "month_key" IS NULL;--> statement-breakpoint
ALTER TABLE "newsletters" ALTER COLUMN "month_key" SET NOT NULL;
