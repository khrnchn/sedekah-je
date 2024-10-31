CREATE TYPE "public"."institution_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_option" AS ENUM('duitnow', 'tng', 'boost');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"icon" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" integer NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"qr_content" text,
	"supported_payment" payment_option[],
	"source" text NOT NULL,
	"status" "institution_status" DEFAULT 'pending' NOT NULL,
	"contributed_by_id" integer NOT NULL,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nickname" text NOT NULL,
	"email" text NOT NULL,
	"gender" text NOT NULL,
	"hasCompletedOnboarding" boolean NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "institutions" ADD CONSTRAINT "institutions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "institutions" ADD CONSTRAINT "institutions_contributed_by_id_users_id_fk" FOREIGN KEY ("contributed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "institutions" ADD CONSTRAINT "institutions_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "category_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "institution_name_idx" ON "institutions" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_idx" ON "institutions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_idx" ON "institutions" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_email_idx" ON "users" USING btree ("email");