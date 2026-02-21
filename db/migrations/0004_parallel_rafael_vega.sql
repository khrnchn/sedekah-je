CREATE TABLE "quest_mosques" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"district" varchar(100) NOT NULL,
	"jais_id" varchar(50) NOT NULL,
	"coords" jsonb,
	"institution_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "quest_mosques_jais_id_unique" UNIQUE("jais_id")
);
--> statement-breakpoint
ALTER TABLE "quest_mosques" ADD CONSTRAINT "quest_mosques_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;