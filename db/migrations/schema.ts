import { sql } from "drizzle-orm";
import {
	boolean,
	foreignKey,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/pg-core";

export const institutions = pgTable("institutions", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 50 }).notNull(),
	state: varchar({ length: 100 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	address: text(),
	qrImage: text("qr_image"),
	qrContent: text("qr_content"),
	supportedPayment: jsonb("supported_payment"),
	coords: jsonb(),
	socialMedia: jsonb("social_media"),
	status: varchar({ length: 20 }).default("pending").notNull(),
	contributorRemarks: text("contributor_remarks"),
	sourceUrl: text("source_url"),
	reviewedAt: timestamp("reviewed_at", { mode: "string" }),
	adminNotes: text("admin_notes"),
	isVerified: boolean("is_verified").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "string" }),
	contributorId: text("contributor_id"),
	reviewedBy: text("reviewed_by"),
});

export const institutionClaims = pgTable(
	"institution_claims",
	{
		id: serial().primaryKey().notNull(),
		institutionId: integer("institution_id").notNull(),
		claimantId: text("claimant_id").notNull(),
		claimReason: text("claim_reason"),
		status: varchar({ length: 20 }).default("pending").notNull(),
		reviewedBy: text("reviewed_by"),
		reviewedAt: timestamp("reviewed_at", { mode: "string" }),
		adminNotes: text("admin_notes"),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }),
	},
	(table) => [
		foreignKey({
			columns: [table.claimantId],
			foreignColumns: [users.id],
			name: "institution_claims_claimant_id_users_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.institutionId],
			foreignColumns: [institutions.id],
			name: "institution_claims_institution_id_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "institution_claims_reviewed_by_users_id_fk",
		}).onDelete("set null"),
	],
);

export const verifications = pgTable("verifications", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
	createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const users = pgTable(
	"users",
	{
		id: text().primaryKey().notNull(),
		email: varchar({ length: 255 }).notNull(),
		username: varchar({ length: 100 }),
		name: varchar({ length: 255 }),
		avatarUrl: text("avatar_url"),
		image: text(),
		emailVerified: boolean("email_verified").default(false).notNull(),
		role: varchar({ length: 20 }).default("user").notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }),
	},
	(table) => [
		unique("users_email_unique").on(table.email),
		unique("users_username_unique").on(table.username),
	],
);

export const accounts = pgTable(
	"accounts",
	{
		id: text().primaryKey().notNull(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id").notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			mode: "string",
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			mode: "string",
		}),
		scope: text(),
		password: text(),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk",
		}).onDelete("cascade"),
	],
);

export const sessions = pgTable(
	"sessions",
	{
		id: text().primaryKey().notNull(),
		expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
		token: text().notNull(),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id").notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk",
		}).onDelete("cascade"),
		unique("sessions_token_unique").on(table.token),
	],
);
