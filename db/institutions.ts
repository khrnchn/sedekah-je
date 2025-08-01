import type {
	categories,
	institutionStatuses,
	states,
	supportedPayments,
} from "@/lib/institution-constants";
import { relations } from "drizzle-orm";
import {
	boolean,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { users } from "./users";

export const institutions = pgTable("institutions", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	slug: text("slug").unique().notNull(),
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
	contributorId: text("contributor_id").references(() => users.id),
	contributorRemarks: text("contributor_remarks"),
	sourceUrl: text("source_url"),
	reviewedBy: text("reviewed_by").references(() => users.id),
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
