import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { contributions } from "./contributions";
import { timestamps } from "./helpers";
import { qrImages } from "./qr-images";
import { users } from "./users";

export const categories = [
	"mosque",
	"surau",
	"tahfiz",
	"kebajikan",
	"others",
] as const;

export const supportedPayments = [
	"duitnow",
	"tng",
	"boost",
] as const;

export const institutions = pgTable("institutions", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	category: varchar("category", { length: 50 }).notNull().$type<typeof categories[number]>(),
	state: varchar("state", { length: 100 }).notNull(),
	city: varchar("city", { length: 100 }).notNull(),
	address: text("address"),
	qrImage: text("qr_image"),
	qrContent: text("qr_content"),
	supportedPayment: jsonb("supported_payment").$type<typeof supportedPayments[number][]>(),
	// Store coordinates as [latitude, longitude]
	coords: jsonb("coords").$type<[number, number]>(),
	// Store social media links
	socialMedia: jsonb("social_media").$type<{
		facebook?: string;
		instagram?: string;
		website?: string;
	}>(),
	// Contributor information
	contributorId: integer("contributor_id"),
	contributorRemarks: text("contributor_remarks"),
	sourceUrl: text("source_url"),
	isVerified: boolean("is_verified").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	...timestamps,
});

export const institutionsRelations = relations(institutions, ({ one, many }) => ({
	contributor: one(users, {
		fields: [institutions.contributorId],
		references: [users.id],
	}),
	contributions: many(contributions),
	qrImages: many(qrImages),
}));

export type Institution = typeof institutions.$inferSelect;
export type NewInstitution = typeof institutions.$inferInsert;