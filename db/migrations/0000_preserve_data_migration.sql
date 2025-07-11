-- Handle existing tables - drop and recreate all Better Auth tables with new schema
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "verifications" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100),
	"name" varchar(255),
	"avatar_url" text,
	"image" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

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
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);

CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);

CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);

-- Now handle the existing tables with data
-- Step 1: Add new columns with text type, but allow NULL initially
ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "contributor_id_new" text;
ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "reviewed_by_new" text;
-- ALTER TABLE "qr_images" ADD COLUMN IF NOT EXISTS "uploaded_by_new" text;

-- Step 2: Convert existing integer values to text format
-- Note: These will be NULL for now since we don't have users yet
-- The foreign key constraints will be added later when needed

-- Step 3: Drop the old integer columns
ALTER TABLE "institutions" DROP COLUMN IF EXISTS "contributor_id";
ALTER TABLE "institutions" DROP COLUMN IF EXISTS "reviewed_by";
-- ALTER TABLE "qr_images" DROP COLUMN IF EXISTS "uploaded_by";

-- Step 4: Rename the new columns to the original names
ALTER TABLE "institutions" RENAME COLUMN "contributor_id_new" TO "contributor_id";
ALTER TABLE "institutions" RENAME COLUMN "reviewed_by_new" TO "reviewed_by";
-- ALTER TABLE "qr_images" RENAME COLUMN "uploaded_by_new" TO "uploaded_by";

-- Step 5: Add foreign key constraints to the new Better Auth tables
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Note: Foreign key constraints for institutions and qr_images will be added later
-- when we have actual users in the system, as these columns are now NULL