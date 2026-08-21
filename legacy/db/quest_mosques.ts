import { relations } from "drizzle-orm";
import {
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";

export const questMosques = pgTable("quest_mosques", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	address: text("address"),
	district: varchar("district", { length: 100 }).notNull(),
	jaisId: varchar("jais_id", { length: 50 }).unique().notNull(),
	coords: jsonb("coords").$type<[number, number]>(),
	institutionId: integer("institution_id").references(() => institutions.id),
	...timestamps,
});

export const questMosquesRelations = relations(questMosques, ({ one }) => ({
	institution: one(institutions, {
		fields: [questMosques.institutionId],
		references: [institutions.id],
	}),
}));

export type QuestMosque = typeof questMosques.$inferSelect;
export type NewQuestMosque = typeof questMosques.$inferInsert;
