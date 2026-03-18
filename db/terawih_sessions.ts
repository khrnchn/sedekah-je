import { relations } from "drizzle-orm";
import {
	date,
	integer,
	pgTable,
	real,
	serial,
	text,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";
import { users } from "./users";

export const terawihSessions = pgTable("terawih_sessions", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	institutionId: integer("institution_id").references(() => institutions.id),
	pendingInstitutionName: varchar("pending_institution_name", {
		length: 255,
	}),
	pendingInstitutionSubmissionId: integer(
		"pending_institution_submission_id",
	).references(() => institutions.id),
	sessionDate: date("session_date", { mode: "string" }).notNull(),
	startTime: varchar("start_time", { length: 5 }).notNull(),
	endTime: varchar("end_time", { length: 5 }).notNull(),
	durationMinutes: integer("duration_minutes").notNull(),
	rakaat: integer("rakaat").notNull(),
	averageMpr: real("average_mpr").notNull(),
	notes: text("notes"),
	shareSlug: text("share_slug").notNull().unique(),
	...timestamps,
});

export const terawihSessionsRelations = relations(
	terawihSessions,
	({ one }) => ({
		user: one(users, {
			fields: [terawihSessions.userId],
			references: [users.id],
		}),
		institution: one(institutions, {
			fields: [terawihSessions.institutionId],
			references: [institutions.id],
		}),
		pendingInstitutionSubmission: one(institutions, {
			fields: [terawihSessions.pendingInstitutionSubmissionId],
			references: [institutions.id],
			relationName: "pendingInstitutionSubmission",
		}),
	}),
);

export type TerawihSession = typeof terawihSessions.$inferSelect;
export type NewTerawihSession = typeof terawihSessions.$inferInsert;
