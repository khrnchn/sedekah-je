DO $$ BEGIN
 CREATE TYPE "public"."institution_type" AS ENUM('mosque', 'surau', 'rumah kebajikan', 'others');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_method" AS ENUM('duitnow', 'tng', 'boost');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institutions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"type" "institution_type" NOT NULL,
	"city" varchar NOT NULL,
	"state" varchar NOT NULL,
	"facebook_link" varchar,
	"qr_content" text NOT NULL,
	"supported_payments" payment_method[],
	"status" "status" DEFAULT 'pending' NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"approved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
