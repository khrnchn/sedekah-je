import { relations } from "drizzle-orm";
import {
	boolean,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { blogAssets, blogPosts } from "./blog";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";

export const userRoles = ["user", "admin"] as const;

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: varchar("email", { length: 255 }).unique().notNull(),
	username: varchar("username", { length: 100 }).unique(),
	name: varchar("name", { length: 255 }),
	avatarUrl: text("avatar_url"),
	image: text("image"),
	emailVerified: boolean("email_verified").default(false).notNull(),
	role: varchar("role", { length: 20 })
		.default("user")
		.notNull()
		.$type<(typeof userRoles)[number]>(),
	isActive: boolean("is_active").default(true).notNull(),
	banned: boolean("banned").default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),
	...timestamps,
});

export const usersRelations = relations(users, ({ many }) => ({
	institutionsContributed: many(institutions),
	institutionsReviewed: many(institutions, { relationName: "reviewer" }),
	blogPostsAuthored: many(blogPosts),
	blogAssetsUploaded: many(blogAssets),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
