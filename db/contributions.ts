import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";
import { users } from "./users";

export const contributionTypes = ["new_institution", "update_institution", "qr_upload"] as const;
export const contributionStatuses = ["pending", "approved", "rejected"] as const;

export const contributions = pgTable("contributions", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull(),
	institutionId: integer("institution_id"),
	type: varchar("type", { length: 50 }).notNull().$type<typeof contributionTypes[number]>(),
	status: varchar("status", { length: 20 }).default("pending").notNull().$type<typeof contributionStatuses[number]>(),
	// Store the contribution data as JSON
	data: jsonb("data").$type<{
		// For new institution or updates
		name?: string;
		description?: string;
		category?: string;
		state?: string;
		city?: string;
		address?: string;
		coords?: [number, number];
		socialMedia?: {
			facebook?: string;
			instagram?: string;
			twitter?: string;
			website?: string;
			youtube?: string;
			telegram?: string;
			whatsapp?: string;
		};
		supportedPayment?: string[];
		qrContent?: string;
		sourceUrl?: string;
		remarks?: string;
		// For QR upload
		qrImageUrl?: string;
		extractedQrContent?: string;
	}>(),
	adminNotes: text("admin_notes"),
	reviewedBy: integer("reviewed_by"),
	reviewedAt: timestamp("reviewed_at"),
	...timestamps,
});

export const contributionsRelations = relations(contributions, ({ one }) => ({
	user: one(users, {
		fields: [contributions.userId],
		references: [users.id],
	}),
	institution: one(institutions, {
		fields: [contributions.institutionId],
		references: [institutions.id],
	}),
	reviewer: one(users, {
		fields: [contributions.reviewedBy],
		references: [users.id],
		relationName: "reviewer",
	}),
}));

export type Contribution = typeof contributions.$inferSelect;
export type NewContribution = typeof contributions.$inferInsert;