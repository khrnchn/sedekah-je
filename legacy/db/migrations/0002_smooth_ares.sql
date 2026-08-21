-- Add slug column without NOT NULL constraint first
ALTER TABLE "institutions" ADD COLUMN "slug" text;--> statement-breakpoint

-- Update existing records with generated slugs using a simple approach
-- This uses regexp_replace to convert names to URL-friendly slugs
UPDATE "institutions" SET "slug" = 
    lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    )
WHERE "slug" IS NULL;--> statement-breakpoint

-- Handle potential duplicates by appending the ID
UPDATE "institutions" SET "slug" = "slug" || '-' || "id"::text 
WHERE "id" IN (
    SELECT "id" FROM (
        SELECT "id", ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "id") as row_num
        FROM "institutions"
    ) t WHERE t.row_num > 1
);--> statement-breakpoint

-- Now add NOT NULL constraint
ALTER TABLE "institutions" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint

-- Add unique constraint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_slug_unique" UNIQUE("slug");