CREATE TABLE "ramadhan_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"day_number" integer NOT NULL,
	"featured_date" date NOT NULL,
	"institution_id" integer NOT NULL,
	"caption" text,
	"curated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "ramadhan_campaigns_year_day_number_unique" UNIQUE("year","day_number"),
	CONSTRAINT "ramadhan_campaigns_year_institution_id_unique" UNIQUE("year","institution_id")
);
--> statement-breakpoint
ALTER TABLE "ramadhan_campaigns" ADD CONSTRAINT "ramadhan_campaigns_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ramadhan_campaigns" ADD CONSTRAINT "ramadhan_campaigns_curated_by_users_id_fk" FOREIGN KEY ("curated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;