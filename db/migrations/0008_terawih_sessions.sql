CREATE TABLE "terawih_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"institution_id" integer,
	"pending_institution_name" varchar(255),
	"pending_institution_submission_id" integer,
	"session_date" date NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"rakaat" integer NOT NULL,
	"average_mpr" real NOT NULL,
	"notes" text,
	"share_slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "terawih_sessions_share_slug_unique" UNIQUE("share_slug")
);--> statement-breakpoint
ALTER TABLE "terawih_sessions" ADD CONSTRAINT "terawih_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terawih_sessions" ADD CONSTRAINT "terawih_sessions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terawih_sessions" ADD CONSTRAINT "terawih_sessions_pending_institution_submission_id_institutions_id_fk" FOREIGN KEY ("pending_institution_submission_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;
