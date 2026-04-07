ALTER TABLE "newsletter_subscription_events" DROP CONSTRAINT "newsletter_subscription_events_source_check";
--> statement-breakpoint
ALTER TABLE "newsletter_subscription_events" ADD CONSTRAINT "newsletter_subscription_events_source_check" CHECK ("event_source" in ('web_form', 'email_link', 'admin_manual', 'legacy_import', 'system'));
--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_consent_source_check" CHECK ("consent_source" in ('web_form', 'email_link', 'admin_manual', 'legacy_import', 'system'));
--> statement-breakpoint
ALTER TABLE "press_articles" ADD CONSTRAINT "press_articles_type_check" CHECK ("type" in ('press_release', 'statement', 'media_appearance'));
