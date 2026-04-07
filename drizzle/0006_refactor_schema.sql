-- Change publishedAt from timestamp to date on press_articles
ALTER TABLE "press_articles" ALTER COLUMN "published_at" TYPE date USING "published_at"::date;--> statement-breakpoint
ALTER TABLE "press_articles" ALTER COLUMN "published_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint

-- Replace social columns with jsonb on organization_members
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "instagram";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "twitter";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "facebook";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "linkedin";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "tiktok";--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "socials" jsonb NOT NULL DEFAULT '[]'::jsonb;--> statement-breakpoint

-- Add locale column to newsletter_subscribers
ALTER TABLE "newsletter_subscribers" ADD COLUMN "locale" text;--> statement-breakpoint

-- Add locale CHECK constraints to all translation tables
ALTER TABLE "carousel_item_translations" ADD CONSTRAINT "carousel_item_translations_locale_check" CHECK (locale in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "tag_translations" ADD CONSTRAINT "tag_translations_locale_check" CHECK (locale in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "press_article_translations" ADD CONSTRAINT "press_article_translations_locale_check" CHECK (locale in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "featured_link_translations" ADD CONSTRAINT "featured_link_translations_locale_check" CHECK (locale in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "team_area_translations" ADD CONSTRAINT "team_area_translations_locale_check" CHECK (locale in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "team_member_translations" ADD CONSTRAINT "team_member_translations_locale_check" CHECK (locale in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "organization_member_translations" ADD CONSTRAINT "organization_member_translations_locale_check" CHECK (locale in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "equality_document_translations" ADD CONSTRAINT "equality_document_translations_locale_check" CHECK (locale in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "financial_report_translations" ADD CONSTRAINT "financial_report_translations_locale_check" CHECK (locale in ('es', 'en'));--> statement-breakpoint

-- Create press_article_type enum and migrate column
CREATE TYPE "public"."press_article_type" AS ENUM('press_release', 'statement', 'media_appearance');--> statement-breakpoint
ALTER TABLE "press_articles" DROP CONSTRAINT IF EXISTS "press_articles_type_check";--> statement-breakpoint
ALTER TABLE "press_articles" ALTER COLUMN "type" TYPE "public"."press_article_type" USING "type"::"public"."press_article_type";
