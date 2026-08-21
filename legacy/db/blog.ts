import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { users } from "./users";

export const blogPostStatuses = ["draft", "published"] as const;

export type BlogDocumentNode = {
	type: string;
	attrs?: Record<string, unknown>;
	text?: string;
	marks?: Array<{
		type: string;
		attrs?: Record<string, unknown>;
	}>;
	content?: BlogDocumentNode[];
};

export type BlogDocument = {
	type: "doc";
	content: BlogDocumentNode[];
};

export const blogPosts = pgTable(
	"blog_posts",
	{
		id: serial("id").primaryKey(),
		title: varchar("title", { length: 255 }).notNull(),
		slug: text("slug").notNull().unique(),
		excerpt: text("excerpt"),
		coverImageUrl: text("cover_image_url"),
		contentJson: jsonb("content_json").$type<BlogDocument>().notNull(),
		status: varchar("status", { length: 20 })
			.default("draft")
			.notNull()
			.$type<(typeof blogPostStatuses)[number]>(),
		featured: boolean("featured").default(false).notNull(),
		metaTitle: varchar("meta_title", { length: 255 }),
		metaDescription: varchar("meta_description", { length: 320 }),
		ogImageUrl: text("og_image_url"),
		publishedAt: timestamp("published_at"),
		authorId: text("author_id").references(() => users.id),
		...timestamps,
	},
	(t) => [
		index("blog_posts_status_published_at_idx").on(t.status, t.publishedAt),
		index("blog_posts_featured_status_idx").on(t.featured, t.status),
	],
);

export const blogAssets = pgTable(
	"blog_assets",
	{
		id: serial("id").primaryKey(),
		postId: integer("post_id").references(() => blogPosts.id, {
			onDelete: "set null",
		}),
		url: text("url").notNull().unique(),
		mimeType: varchar("mime_type", { length: 100 }).notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		alt: varchar("alt", { length: 255 }),
		uploadedBy: text("uploaded_by").references(() => users.id, {
			onDelete: "set null",
		}),
		...timestamps,
	},
	(t) => [index("blog_assets_post_id_idx").on(t.postId)],
);

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
	author: one(users, {
		fields: [blogPosts.authorId],
		references: [users.id],
	}),
	assets: many(blogAssets),
}));

export const blogAssetsRelations = relations(blogAssets, ({ one }) => ({
	post: one(blogPosts, {
		fields: [blogAssets.postId],
		references: [blogPosts.id],
	}),
	uploader: one(users, {
		fields: [blogAssets.uploadedBy],
		references: [users.id],
	}),
}));

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type BlogAsset = typeof blogAssets.$inferSelect;
export type NewBlogAsset = typeof blogAssets.$inferInsert;
