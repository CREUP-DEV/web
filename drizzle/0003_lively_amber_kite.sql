CREATE TABLE "newsletter_subscription_events" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriber_id" text,
	"email" text NOT NULL,
	"event_type" text NOT NULL,
	"event_source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscription_events_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
ALTER TABLE "newsletter_subscription_events" ADD CONSTRAINT "newsletter_subscription_events_type_check" CHECK ("event_type" in ('requested', 'confirmed', 'unsubscribed', 'admin_created', 'admin_updated', 'admin_deleted', 'confirmation_expired'));--> statement-breakpoint
ALTER TABLE "newsletter_subscription_events" ADD CONSTRAINT "newsletter_subscription_events_source_check" CHECK ("event_source" in ('web_form', 'email_link', 'admin_manual', 'system'));--> statement-breakpoint
ALTER TABLE "newsletter_deliveries" ADD CONSTRAINT "newsletter_deliveries_status_check" CHECK ("status" in ('queued', 'sending', 'sent', 'failed'));--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscribers_active_subscribed" ON "newsletter_subscribers" USING btree ("active","subscribed_at");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscription_events_subscriber_created" ON "newsletter_subscription_events" USING btree ("subscriber_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscription_events_email" ON "newsletter_subscription_events" USING btree ("email");
