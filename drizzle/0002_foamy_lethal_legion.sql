CREATE TABLE "newsletter_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"newsletter_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"sent_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_deliveries_newsletter_subscriber_unique" UNIQUE("newsletter_id","subscriber_id")
);
--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "last_delivery_heartbeat_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "last_delivery_worker_token" text;--> statement-breakpoint
ALTER TABLE "newsletter_deliveries" ADD CONSTRAINT "newsletter_deliveries_newsletter_id_newsletters_id_fk" FOREIGN KEY ("newsletter_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_deliveries" ADD CONSTRAINT "newsletter_deliveries_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_newsletter_deliveries_status" ON "newsletter_deliveries" USING btree ("newsletter_id","status");--> statement-breakpoint
CREATE INDEX "idx_newsletter_deliveries_subscriber" ON "newsletter_deliveries" USING btree ("subscriber_id");