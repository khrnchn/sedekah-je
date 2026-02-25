CREATE TABLE "blog_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer,
	"url" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"alt" varchar(255),
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "blog_assets_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"cover_image_url" text,
	"content_json" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"meta_title" varchar(255),
	"meta_description" varchar(320),
	"og_image_url" text,
	"published_at" timestamp,
	"author_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog_assets" ADD CONSTRAINT "blog_assets_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_assets" ADD CONSTRAINT "blog_assets_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;