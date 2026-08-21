import { relations } from "drizzle-orm";
import {
	date,
	integer,
	pgTable,
	serial,
	text,
	unique,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";
import { users } from "./users";

export const ramadhanCampaigns = pgTable(
	"ramadhan_campaigns",
	{
		id: serial("id").primaryKey(),
		year: integer("year").notNull(),
		dayNumber: integer("day_number").notNull(),
		featuredDate: date("featured_date", { mode: "date" }).notNull(),
		institutionId: integer("institution_id")
			.notNull()
			.references(() => institutions.id),
		caption: text("caption"),
		curatedBy: text("curated_by").references(() => users.id),
		...timestamps,
	},
	(t) => [
		unique().on(t.year, t.dayNumber),
		unique().on(t.year, t.institutionId),
	],
);

export const ramadhanCampaignsRelations = relations(
	ramadhanCampaigns,
	({ one }) => ({
		institution: one(institutions),
		curator: one(users, {
			fields: [ramadhanCampaigns.curatedBy],
			references: [users.id],
		}),
	}),
);

export type RamadhanCampaign = typeof ramadhanCampaigns.$inferSelect;
export type NewRamadhanCampaign = typeof ramadhanCampaigns.$inferInsert;
