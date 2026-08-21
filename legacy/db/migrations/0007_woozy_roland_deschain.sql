ALTER TABLE "users" ADD COLUMN "onboarding_tour_state" varchar(50) DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tour_current_route" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tour_current_step" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tour_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tour_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tour_skipped_at" timestamp;