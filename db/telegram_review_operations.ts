import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { institutions } from "./institutions";
export const telegramReviewOperations = pgTable("telegram_review_operations", {
	id: text("id").primaryKey(),
	chatId: text("chat_id").notNull(),
	institutionId: integer("institution_id")
		.notNull()
		.references(() => institutions.id, { onDelete: "cascade" }),
	promptMessageId: integer("prompt_message_id").notNull(),
	version: text("version").notNull(),
	kind: text("kind").notNull(),
	payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	consumedAt: timestamp("consumed_at"),
});
