CREATE TABLE "telegram_review_sessions" (
	"telegram_chat_id" text PRIMARY KEY NOT NULL,
	"scope" varchar(20) DEFAULT 'community' NOT NULL,
	"cursor_institution_id" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
