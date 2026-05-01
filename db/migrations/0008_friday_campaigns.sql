CREATE TABLE "friday_campaign_favourites" (
	"id" serial PRIMARY KEY NOT NULL,
	"institution_id" integer NOT NULL,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "friday_campaign_favourites_institution_id_unique" UNIQUE("institution_id")
);
--> statement-breakpoint
CREATE TABLE "friday_campaign_settings" (
	"id" integer DEFAULT 1 PRIMARY KEY NOT NULL,
	"active_override_institution_id" integer,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "friday_campaign_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"featured_date" date NOT NULL,
	"institution_id" integer NOT NULL,
	"source" varchar(20) NOT NULL,
	"selected_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "friday_campaign_runs_featured_date_unique" UNIQUE("featured_date")
);
--> statement-breakpoint
ALTER TABLE "friday_campaign_favourites" ADD CONSTRAINT "friday_campaign_favourites_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "friday_campaign_favourites" ADD CONSTRAINT "friday_campaign_favourites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "friday_campaign_settings" ADD CONSTRAINT "friday_campaign_settings_active_override_institution_id_institutions_id_fk" FOREIGN KEY ("active_override_institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "friday_campaign_settings" ADD CONSTRAINT "friday_campaign_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "friday_campaign_runs" ADD CONSTRAINT "friday_campaign_runs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "friday_campaign_runs" ADD CONSTRAINT "friday_campaign_runs_selected_by_users_id_fk" FOREIGN KEY ("selected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
