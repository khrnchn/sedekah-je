import {
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import type { ApprovalEmailStatus } from "@/lib/email/approval-status";
import { institutions } from "./institutions";

export const approvalEmails = pgTable("approval_emails", {
	institutionId: integer("institution_id")
		.primaryKey()
		.references(() => institutions.id, { onDelete: "cascade" }),
	status: varchar("status", { length: 20 })
		.notNull()
		.default("pending")
		.$type<ApprovalEmailStatus>(),
	attemptCount: integer("attempt_count").notNull().default(0),
	attemptToken: uuid("attempt_token"),
	messageId: text("message_id").unique(),
	lastError: text("last_error"),
	attemptedAt: timestamp("attempted_at", { withTimezone: true }),
	acceptedAt: timestamp("accepted_at", { withTimezone: true }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

// Retain early webhook events even when they arrive before the send response.
// Only provider IDs and outcomes are stored; payloads contain recipient PII.
export const approvalEmailEvents = pgTable("approval_email_events", {
	messageId: text("message_id").primaryKey(),
	status: varchar("status", { length: 20 })
		.notNull()
		.$type<"delivered" | "bounced">(),
	occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
});
