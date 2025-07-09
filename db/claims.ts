import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";

export const claimStatuses = ["pending", "approved", "rejected"] as const;

export const institutionClaims = pgTable("institution_claims", {
	id: serial("id").primaryKey(),
	institutionId: text("institution_id").notNull(),
	claimantId: text("claimant_id").notNull(),
	claimReason: text("claim_reason"), // Optional reason from user
	status: varchar("status", { length: 20 })
		.default("pending")
		.notNull()
		.$type<(typeof claimStatuses)[number]>(),
	reviewedBy: text("reviewed_by"),
	reviewedAt: timestamp("reviewed_at"),
	adminNotes: text("admin_notes"),
	...timestamps,
});

// Relations will be defined in schema.ts to avoid circular imports

export type InstitutionClaim = typeof institutionClaims.$inferSelect;
export type NewInstitutionClaim = typeof institutionClaims.$inferInsert;
export type ClaimStatus = (typeof claimStatuses)[number];

// Utility types for workflow management
export type PendingClaim = InstitutionClaim & { status: "pending" };
export type ApprovedClaim = InstitutionClaim & { status: "approved" };
export type RejectedClaim = InstitutionClaim & { status: "rejected" };
