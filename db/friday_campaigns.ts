import { relations } from "drizzle-orm";
import {
	date,
	integer,
	pgTable,
	serial,
	text,
	unique,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";
import { users } from "./users";

export const fridayCampaignFavourites = pgTable(
	"friday_campaign_favourites",
	{
		id: serial("id").primaryKey(),
		institutionId: integer("institution_id")
			.notNull()
			.references(() => institutions.id),
		note: text("note"),
		sortOrder: integer("sort_order").default(0).notNull(),
		createdBy: text("created_by").references(() => users.id),
		...timestamps,
	},
	(t) => [unique().on(t.institutionId)],
);

export const fridayCampaignSettings = pgTable("friday_campaign_settings", {
	id: integer("id").primaryKey().default(1),
	activeOverrideInstitutionId: integer(
		"active_override_institution_id",
	).references(() => institutions.id),
	updatedBy: text("updated_by").references(() => users.id),
	...timestamps,
});

export const fridayCampaignRuns = pgTable(
	"friday_campaign_runs",
	{
		id: serial("id").primaryKey(),
		featuredDate: date("featured_date", { mode: "date" }).notNull(),
		institutionId: integer("institution_id")
			.notNull()
			.references(() => institutions.id),
		source: varchar("source", { length: 20 })
			.notNull()
			.$type<"random" | "override">(),
		selectedBy: text("selected_by").references(() => users.id),
		...timestamps,
	},
	(t) => [unique().on(t.featuredDate)],
);

export const fridayCampaignFavouritesRelations = relations(
	fridayCampaignFavourites,
	({ one }) => ({
		institution: one(institutions, {
			fields: [fridayCampaignFavourites.institutionId],
			references: [institutions.id],
		}),
		creator: one(users, {
			fields: [fridayCampaignFavourites.createdBy],
			references: [users.id],
		}),
	}),
);

export const fridayCampaignSettingsRelations = relations(
	fridayCampaignSettings,
	({ one }) => ({
		activeOverrideInstitution: one(institutions, {
			fields: [fridayCampaignSettings.activeOverrideInstitutionId],
			references: [institutions.id],
		}),
		updater: one(users, {
			fields: [fridayCampaignSettings.updatedBy],
			references: [users.id],
		}),
	}),
);

export const fridayCampaignRunsRelations = relations(
	fridayCampaignRuns,
	({ one }) => ({
		institution: one(institutions, {
			fields: [fridayCampaignRuns.institutionId],
			references: [institutions.id],
		}),
		selector: one(users, {
			fields: [fridayCampaignRuns.selectedBy],
			references: [users.id],
		}),
	}),
);

export type FridayCampaignFavourite =
	typeof fridayCampaignFavourites.$inferSelect;
export type NewFridayCampaignFavourite =
	typeof fridayCampaignFavourites.$inferInsert;
export type FridayCampaignSettings = typeof fridayCampaignSettings.$inferSelect;
export type NewFridayCampaignSettings =
	typeof fridayCampaignSettings.$inferInsert;
export type FridayCampaignRun = typeof fridayCampaignRuns.$inferSelect;
export type NewFridayCampaignRun = typeof fridayCampaignRuns.$inferInsert;
