CREATE INDEX "blog_assets_post_id_idx" ON "blog_assets" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "blog_posts_status_published_at_idx" ON "blog_posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "blog_posts_featured_status_idx" ON "blog_posts" USING btree ("featured","status");