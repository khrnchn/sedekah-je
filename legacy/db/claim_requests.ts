import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";
import { users } from "./users";

export const claimRequestStatuses = [
	"pending",
	"approved",
	"rejected",
] as const;

export const claimRequests = pgTable("claim_requests", {
	id: serial("id").primaryKey(),
	institutionId: integer("institution_id")
		.notNull()
		.references(() => institutions.id),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	sourceUrl: text("source_url"), // Optional
	description: text("description"), // Optional
	status: varchar("status", { length: 20 })
		.default("pending")
		.notNull()
		.$type<(typeof claimRequestStatuses)[number]>(),
	adminNotes: text("admin_notes"),
	reviewedBy: text("reviewed_by").references(() => users.id),
	reviewedAt: timestamp("reviewed_at"),
	...timestamps,
});

export const claimRequestsRelations = relations(claimRequests, ({ one }) => ({
	institution: one(institutions, {
		fields: [claimRequests.institutionId],
		references: [institutions.id],
	}),
	user: one(users, {
		fields: [claimRequests.userId],
		references: [users.id],
	}),
	reviewer: one(users, {
		fields: [claimRequests.reviewedBy],
		references: [users.id],
		relationName: "reviewer",
	}),
}));

export type ClaimRequest = typeof claimRequests.$inferSelect;
export type NewClaimRequest = typeof claimRequests.$inferInsert;

// Utility types for workflow management
export type ClaimRequestStatus = (typeof claimRequestStatuses)[number];
export type PendingClaimRequest = ClaimRequest & { status: "pending" };
export type ApprovedClaimRequest = ClaimRequest & { status: "approved" };
export type RejectedClaimRequest = ClaimRequest & { status: "rejected" };
