CREATE TABLE "organization_member_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"university" text NOT NULL,
	"organization_member_id" text NOT NULL,
	CONSTRAINT "organization_member_translations_organization_member_id_locale_unique" UNIQUE("organization_member_id","locale")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"website" text,
	"email" text,
	"instagram" text,
	"twitter" text,
	"facebook" text,
	"linkedin" text,
	"tiktok" text,
	"autonomous_community" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_area_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"team_area_id" text NOT NULL,
	CONSTRAINT "team_area_translations_team_area_id_locale_unique" UNIQUE("team_area_id","locale")
);
--> statement-breakpoint
CREATE TABLE "team_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_member_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"full_name" text NOT NULL,
	"university" text,
	"degree" text,
	"description" text,
	"team_member_id" text NOT NULL,
	CONSTRAINT "team_member_translations_team_member_id_locale_unique" UNIQUE("team_member_id","locale")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"photo" text,
	"calendar_id" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"team_area_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "organization_member_translations" ADD CONSTRAINT "organization_member_translations_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_area_translations" ADD CONSTRAINT "team_area_translations_team_area_id_team_areas_id_fk" FOREIGN KEY ("team_area_id") REFERENCES "public"."team_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_translations" ADD CONSTRAINT "team_member_translations_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_area_id_team_areas_id_fk" FOREIGN KEY ("team_area_id") REFERENCES "public"."team_areas"("id") ON DELETE cascade ON UPDATE no action;