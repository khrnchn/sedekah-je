CREATE TABLE "telegram_review_operations" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"institution_id" integer NOT NULL,
	"prompt_message_id" integer NOT NULL,
	"version" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "review_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "telegram_review_operations" ADD CONSTRAINT "telegram_review_operations_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;