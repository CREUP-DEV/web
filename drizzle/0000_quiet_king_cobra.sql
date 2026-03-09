CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "carousel_items" (
	"id" text PRIMARY KEY NOT NULL,
	"image" text NOT NULL,
	"href" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_links" (
	"id" text PRIMARY KEY NOT NULL,
	"image" text NOT NULL,
	"to" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
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
CREATE TABLE "media_outlets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website" text NOT NULL,
	"logo" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token"),
	CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "carousel_item_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"button_text" text NOT NULL,
	"alt" text,
	"carousel_item_id" text NOT NULL,
	CONSTRAINT "carousel_item_translations_carousel_item_id_locale_unique" UNIQUE("carousel_item_id","locale"),
	CONSTRAINT "carousel_item_translations_carousel_item_id_carousel_items_id_fk" FOREIGN KEY ("carousel_item_id") REFERENCES "public"."carousel_items"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "featured_link_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"alt" text,
	"featured_link_id" text NOT NULL,
	CONSTRAINT "featured_link_translations_featured_link_id_locale_unique" UNIQUE("featured_link_id","locale"),
	CONSTRAINT "featured_link_translations_featured_link_id_featured_links_id_fk" FOREIGN KEY ("featured_link_id") REFERENCES "public"."featured_links"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "tag_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "tag_translations_tag_id_locale_unique" UNIQUE("tag_id","locale"),
	CONSTRAINT "tag_translations_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "team_area_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"team_area_id" text NOT NULL,
	CONSTRAINT "team_area_translations_team_area_id_locale_unique" UNIQUE("team_area_id","locale"),
	CONSTRAINT "team_area_translations_team_area_id_team_areas_id_fk" FOREIGN KEY ("team_area_id") REFERENCES "public"."team_areas"("id") ON DELETE cascade ON UPDATE no action
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
	CONSTRAINT "team_members_slug_unique" UNIQUE("slug"),
	CONSTRAINT "team_members_team_area_id_team_areas_id_fk" FOREIGN KEY ("team_area_id") REFERENCES "public"."team_areas"("id") ON DELETE cascade ON UPDATE no action
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
	CONSTRAINT "team_member_translations_team_member_id_locale_unique" UNIQUE("team_member_id","locale"),
	CONSTRAINT "team_member_translations_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "organization_member_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"university" text NOT NULL,
	"organization_member_id" text NOT NULL,
	CONSTRAINT "organization_member_translations_organization_member_id_locale_unique" UNIQUE("organization_member_id","locale"),
	CONSTRAINT "organization_member_translations_organization_member_id_organization_members_id_fk" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organization_members"("id") ON DELETE cascade ON UPDATE no action
);
