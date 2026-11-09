import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";
import { questMosques } from "./quest_mosques";
import { users } from "./users";

export const questAttemptKinds = ["new", "existing"] as const;
export const questAttemptStatuses = [
	"pending",
	"approved",
	"rejected",
] as const;

export type QuestAttemptKind = (typeof questAttemptKinds)[number];
export type QuestAttemptStatus = (typeof questAttemptStatuses)[number];

export const questAttempts = pgTable(
	"quest_attempts",
	{
		id: serial("id").primaryKey(),
		questMosqueId: integer("quest_mosque_id")
			.notNull()
			.references(() => questMosques.id, { onDelete: "cascade" }),
		userId: text("user_id").references(() => users.id),
		institutionId: integer("institution_id")
			.notNull()
			.references(() => institutions.id, { onDelete: "cascade" }),
		kind: varchar("kind", { length: 20 }).notNull().$type<QuestAttemptKind>(),
		status: varchar("status", { length: 20 })
			.default("pending")
			.notNull()
			.$type<QuestAttemptStatus>(),
		reviewedBy: text("reviewed_by").references(() => users.id),
		reviewedAt: timestamp("reviewed_at"),
		...timestamps,
	},
	(table) => [
		index("quest_attempts_mosque_idx").on(table.questMosqueId),
		index("quest_attempts_institution_idx").on(table.institutionId),
		uniqueIndex("quest_attempts_mosque_institution_uq").on(
			table.questMosqueId,
			table.institutionId,
		),
	],
);

export const questAttemptsRelations = relations(questAttempts, ({ one }) => ({
	questMosque: one(questMosques, {
		fields: [questAttempts.questMosqueId],
		references: [questMosques.id],
	}),
	institution: one(institutions, {
		fields: [questAttempts.institutionId],
		references: [institutions.id],
	}),
	user: one(users, {
		fields: [questAttempts.userId],
		references: [users.id],
	}),
}));

export type QuestAttempt = typeof questAttempts.$inferSelect;
export type NewQuestAttempt = typeof questAttempts.$inferInsert;
