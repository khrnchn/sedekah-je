import {
	integer,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import type { TelegramReviewScope } from "@/lib/integrations/telegram/review-ui";

export const telegramReviewSessions = pgTable("telegram_review_sessions", {
	telegramChatId: text("telegram_chat_id").primaryKey(),
	scope: varchar("scope", { length: 20 })
		.default("community")
		.notNull()
		.$type<TelegramReviewScope>(),
	cursorInstitutionId: integer("cursor_institution_id"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TelegramReviewSession = typeof telegramReviewSessions.$inferSelect;
export type TelegramReviewSessionInsert =
	typeof telegramReviewSessions.$inferInsert;
