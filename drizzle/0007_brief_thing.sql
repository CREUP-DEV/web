CREATE TABLE "financial_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"pdf_url" text NOT NULL,
	"approved_at" timestamp NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
