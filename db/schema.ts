// Main schema exports - import from individual files
export * from "./users";
export * from "./institutions";
export * from "./claims";
export * from "./auth";

// Relations defined here to avoid circular imports
import { relations } from "drizzle-orm";
import { institutionClaims } from "./claims";
import { institutions } from "./institutions";
import { users } from "./users";

export const usersRelations = relations(users, ({ many }) => ({
	institutionsContributed: many(institutions),
	institutionsReviewed: many(institutions, { relationName: "reviewer" }),
	claimsMade: many(institutionClaims),
	claimsReviewed: many(institutionClaims, { relationName: "reviewer" }),
}));

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
		claims: many(institutionClaims),
	}),
);

export const institutionClaimsRelations = relations(
	institutionClaims,
	({ one }) => ({
		institution: one(institutions, {
			fields: [institutionClaims.institutionId],
			references: [institutions.id],
		}),
		claimant: one(users, {
			fields: [institutionClaims.claimantId],
			references: [users.id],
		}),
		reviewer: one(users, {
			fields: [institutionClaims.reviewedBy],
			references: [users.id],
			relationName: "reviewer",
		}),
	}),
);
