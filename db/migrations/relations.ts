import { relations } from "drizzle-orm/relations";
import {
	accounts,
	institutionClaims,
	institutions,
	sessions,
	users,
} from "./schema";

export const institutionClaimsRelations = relations(
	institutionClaims,
	({ one }) => ({
		user_claimantId: one(users, {
			fields: [institutionClaims.claimantId],
			references: [users.id],
			relationName: "institutionClaims_claimantId_users_id",
		}),
		institution: one(institutions, {
			fields: [institutionClaims.institutionId],
			references: [institutions.id],
		}),
		user_reviewedBy: one(users, {
			fields: [institutionClaims.reviewedBy],
			references: [users.id],
			relationName: "institutionClaims_reviewedBy_users_id",
		}),
	}),
);

export const usersRelations = relations(users, ({ many }) => ({
	institutionClaims_claimantId: many(institutionClaims, {
		relationName: "institutionClaims_claimantId_users_id",
	}),
	institutionClaims_reviewedBy: many(institutionClaims, {
		relationName: "institutionClaims_reviewedBy_users_id",
	}),
	accounts: many(accounts),
	sessions: many(sessions),
}));

export const institutionsRelations = relations(institutions, ({ many }) => ({
	institutionClaims: many(institutionClaims),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));
