ALTER TABLE "carousel_item_translations" DROP CONSTRAINT "carousel_item_translations_locale_check";--> statement-breakpoint
ALTER TABLE "featured_link_translations" DROP CONSTRAINT "featured_link_translations_locale_check";--> statement-breakpoint
ALTER TABLE "organization_member_translations" DROP CONSTRAINT "organization_member_translations_locale_check";--> statement-breakpoint
ALTER TABLE "team_area_translations" DROP CONSTRAINT "team_area_translations_locale_check";--> statement-breakpoint
ALTER TABLE "team_member_translations" DROP CONSTRAINT "team_member_translations_locale_check";--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" DROP CONSTRAINT "newsletter_subscribers_locale_check";--> statement-breakpoint
ALTER TABLE "press_article_translations" DROP CONSTRAINT "press_article_translations_locale_check";--> statement-breakpoint
ALTER TABLE "equality_document_translations" DROP CONSTRAINT "equality_document_translations_locale_check";--> statement-breakpoint
ALTER TABLE "financial_report_translations" DROP CONSTRAINT "financial_report_translations_locale_check";--> statement-breakpoint
ALTER TABLE "tag_translations" DROP CONSTRAINT "tag_translations_locale_check";--> statement-breakpoint
ALTER TABLE "carousel_item_translations" ADD CONSTRAINT "carousel_item_translations_locale_check" CHECK ("carousel_item_translations"."locale" in ('es', 'en', 'ca', 'eu'));--> statement-breakpoint
ALTER TABLE "featured_link_translations" ADD CONSTRAINT "featured_link_translations_locale_check" CHECK ("featured_link_translations"."locale" in ('es', 'en', 'ca', 'eu'));--> statement-breakpoint
ALTER TABLE "organization_member_translations" ADD CONSTRAINT "organization_member_translations_locale_check" CHECK ("organization_member_translations"."locale" in ('es', 'en', 'ca', 'eu'));--> statement-breakpoint
ALTER TABLE "team_area_translations" ADD CONSTRAINT "team_area_translations_locale_check" CHECK ("team_area_translations"."locale" in ('es', 'en', 'ca', 'eu'));--> statement-breakpoint
ALTER TABLE "team_member_translations" ADD CONSTRAINT "team_member_translations_locale_check" CHECK ("team_member_translations"."locale" in ('es', 'en', 'ca', 'eu'));--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_locale_check" CHECK ("newsletter_subscribers"."locale" IS NULL OR "newsletter_subscribers"."locale" in ('es', 'en', 'ca', 'eu'));--> statement-breakpoint
ALTER TABLE "press_article_translations" ADD CONSTRAINT "press_article_translations_locale_check" CHECK ("press_article_translations"."locale" in ('es', 'en', 'ca', 'eu'));--> statement-breakpoint
ALTER TABLE "equality_document_translations" ADD CONSTRAINT "equality_document_translations_locale_check" CHECK ("equality_document_translations"."locale" in ('es', 'en', 'ca', 'eu'));--> statement-breakpoint
ALTER TABLE "financial_report_translations" ADD CONSTRAINT "financial_report_translations_locale_check" CHECK ("financial_report_translations"."locale" in ('es', 'en', 'ca', 'eu'));--> statement-breakpoint
ALTER TABLE "tag_translations" ADD CONSTRAINT "tag_translations_locale_check" CHECK ("tag_translations"."locale" in ('es', 'en', 'ca', 'eu'));