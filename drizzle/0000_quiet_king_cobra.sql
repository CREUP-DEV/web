CREATE TABLE "media_outlets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website" text NOT NULL,
	"logo" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
