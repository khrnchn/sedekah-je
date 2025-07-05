import { relations } from "drizzle-orm";
import { boolean, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";
import { qrImages } from "./qr-images";

export const userRoles = ["user", "admin"] as const;

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: varchar("email", { length: 255 }).unique().notNull(),
	username: varchar("username", { length: 100 }).unique(),
	name: varchar("name", { length: 255 }),
	avatarUrl: text("avatar_url"),
	image: text("image"), // For Better Auth compatibility
	emailVerified: boolean("email_verified").default(false).notNull(), // For Better Auth
	role: varchar("role", { length: 20 })
		.default("user")
		.notNull()
		.$type<(typeof userRoles)[number]>(),
	isActive: boolean("is_active").default(true).notNull(),
	...timestamps,
});

export const usersRelations = relations(users, ({ many }) => ({
	institutionsContributed: many(institutions),
	qrImagesUploaded: many(qrImages),
	institutionsReviewed: many(institutions, { relationName: "reviewer" }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
