CREATE TABLE "quest_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"quest_mosque_id" integer NOT NULL,
	"user_id" text,
	"institution_id" integer NOT NULL,
	"kind" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "quest_attempts" ADD CONSTRAINT "quest_attempts_quest_mosque_id_quest_mosques_id_fk" FOREIGN KEY ("quest_mosque_id") REFERENCES "public"."quest_mosques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_attempts" ADD CONSTRAINT "quest_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_attempts" ADD CONSTRAINT "quest_attempts_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_attempts" ADD CONSTRAINT "quest_attempts_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quest_attempts_mosque_idx" ON "quest_attempts" USING btree ("quest_mosque_id");--> statement-breakpoint
CREATE INDEX "quest_attempts_institution_idx" ON "quest_attempts" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quest_attempts_mosque_institution_uq" ON "quest_attempts" USING btree ("quest_mosque_id","institution_id");--> statement-breakpoint
INSERT INTO "quest_attempts" ("quest_mosque_id", "user_id", "institution_id", "kind", "status", "reviewed_at", "created_at")
SELECT qm."id", i."contributor_id", i."id", 'new', i."status", i."reviewed_at", i."created_at"
FROM "quest_mosques" qm JOIN "institutions" i ON i."id" = qm."institution_id"
WHERE i."status" IN ('approved', 'pending')
ON CONFLICT DO NOTHING;
