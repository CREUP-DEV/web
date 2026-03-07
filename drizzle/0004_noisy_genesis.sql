ALTER TABLE "newsletter_subscribers" ALTER COLUMN "active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN "confirmed_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN "confirm_token" text;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN "consent_ip" text;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN "consent_user_agent" text;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN "consent_source" text DEFAULT 'web_form' NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN "consent_text_version" text DEFAULT '2026-03-06' NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN "age_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "newsletter_subscribers"
SET
  "confirmed_at" = COALESCE("confirmed_at", "subscribed_at"),
  "consent_source" = 'legacy_import',
  "consent_text_version" = 'legacy',
  "age_confirmed" = true
WHERE "confirm_token" IS NULL;
