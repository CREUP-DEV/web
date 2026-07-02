ALTER TABLE "site_default_images" DROP CONSTRAINT "site_default_images_scope_slot_check";--> statement-breakpoint
ALTER TABLE "site_default_images" ADD CONSTRAINT "site_default_images_scope_slot_check" CHECK (("site_default_images"."scope", "site_default_images"."slot") IN (
        ('press', 'press_release'),
        ('press', 'statement'),
        ('press', 'media_appearance'),
        ('newsletter', 'cover'),
        ('carousel', 'slide'),
        ('seo', 'og_image'),
        ('activity', 'entry'),
        ('area_report', 'report')
      ));