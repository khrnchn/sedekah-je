ALTER TABLE "approval_emails" DROP CONSTRAINT "approval_emails_message_id_unique";--> statement-breakpoint
ALTER TABLE "approval_emails" ADD COLUMN "provider" varchar(20) DEFAULT 'mailersend' NOT NULL;--> statement-breakpoint
CREATE INDEX "approval_emails_provider_message_idx" ON "approval_emails" USING btree ("provider","message_id");