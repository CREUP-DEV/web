CREATE TABLE "financial_report_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"financial_report_id" text NOT NULL,
	CONSTRAINT "financial_report_translations_financial_report_id_locale_unique" UNIQUE("financial_report_id","locale")
);
--> statement-breakpoint
ALTER TABLE "financial_report_translations" ADD CONSTRAINT "financial_report_translations_financial_report_id_financial_reports_id_fk" FOREIGN KEY ("financial_report_id") REFERENCES "public"."financial_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "financial_report_translations" ("id", "locale", "title", "financial_report_id")
SELECT
  "id" || '_es',
  'es',
  "title",
  "id"
FROM "financial_reports"
WHERE trim("title") <> '';
--> statement-breakpoint
ALTER TABLE "financial_reports" DROP COLUMN "title";
