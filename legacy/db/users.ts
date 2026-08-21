import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { blogAssets, blogPosts } from "./blog";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";

export const userRoles = ["user", "admin"] as const;

export const onboardingTourStates = [
	"not_started",
	"in_progress",
	"skipped",
	"completed",
] as const;

export const onboardingTourRoutes = [
	"/contribute",
	"/my-contributions",
	"/leaderboard",
] as const;

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
	// Onboarding tour (new users only)
	onboardingTourState: varchar("onboarding_tour_state", { length: 50 })
		.default("completed")
		.notNull()
		.$type<(typeof onboardingTourStates)[number]>(),
	onboardingTourCurrentRoute: varchar("onboarding_tour_current_route", {
		length: 100,
	}),
	onboardingTourCurrentStep: integer("onboarding_tour_current_step"),
	onboardingTourStartedAt: timestamp("onboarding_tour_started_at"),
	onboardingTourCompletedAt: timestamp("onboarding_tour_completed_at"),
	onboardingTourSkippedAt: timestamp("onboarding_tour_skipped_at"),
});

export const usersRelations = relations(users, ({ many }) => ({
	institutionsContributed: many(institutions),
	institutionsReviewed: many(institutions, { relationName: "reviewer" }),
	blogPostsAuthored: many(blogPosts),
	blogAssetsUploaded: many(blogAssets),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
