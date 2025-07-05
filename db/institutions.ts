import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
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

export const states = [
	"Johor",
	"Kedah",
	"Kelantan",
	"Melaka",
	"Negeri Sembilan",
	"Pahang",
	"Perak",
	"Perlis",
	"Pulau Pinang",
	"Sabah",
	"Sarawak",
	"Selangor",
	"Terengganu",
	"W.P. Kuala Lumpur",
	"W.P. Labuan",
	"W.P. Putrajaya",
] as const;

export const supportedPayments = ["duitnow", "tng", "boost"] as const;

export const institutionStatuses = ["pending", "approved", "rejected"] as const;

export const institutions = pgTable("institutions", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	category: varchar("category", { length: 50 })
		.notNull()
		.$type<(typeof categories)[number]>(),
	state: varchar("state", { length: 100 })
		.notNull()
		.$type<(typeof states)[number]>(),
	city: varchar("city", { length: 100 }).notNull(),
	address: text("address"),
	qrImage: text("qr_image"),
	qrContent: text("qr_content"),
	supportedPayment:
		jsonb("supported_payment").$type<(typeof supportedPayments)[number][]>(),
	// Store coordinates as [latitude, longitude]
	coords: jsonb("coords").$type<[number, number]>(),
	// Store social media links
	socialMedia: jsonb("social_media").$type<{
		facebook?: string;
		instagram?: string;
		website?: string;
	}>(),
	// Workflow fields
	status: varchar("status", { length: 20 })
		.default("pending")
		.notNull()
		.$type<(typeof institutionStatuses)[number]>(),
	contributorId: integer("contributor_id"),
	contributorRemarks: text("contributor_remarks"),
	sourceUrl: text("source_url"),
	reviewedBy: integer("reviewed_by"),
	reviewedAt: timestamp("reviewed_at"),
	adminNotes: text("admin_notes"),

	// Legacy fields (keeping for backward compatibility)
	isVerified: boolean("is_verified").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	...timestamps,
});

export const institutionsRelations = relations(
	institutions,
	({ one, many }) => ({
		contributor: one(users, {
			fields: [institutions.contributorId],
			references: [users.id],
		}),
		reviewer: one(users, {
			fields: [institutions.reviewedBy],
			references: [users.id],
			relationName: "reviewer",
		}),
		qrImages: many(qrImages),
	}),
);

export type Institution = typeof institutions.$inferSelect;
export type NewInstitution = typeof institutions.$inferInsert;

// Utility types for workflow management
export type InstitutionStatus = (typeof institutionStatuses)[number];
export type PendingInstitution = Institution & { status: "pending" };
export type ApprovedInstitution = Institution & { status: "approved" };
export type RejectedInstitution = Institution & { status: "rejected" };

// Helper type for creating new contributions (will have pending status by default)
export type NewContribution = Omit<NewInstitution, "status"> & {
	status?: "pending"; // Optional, defaults to pending for new contributions
};
