import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { institutions } from "./institutions";
import { users } from "./users";

export const qrImages = pgTable("qr_images", {
	id: serial("id").primaryKey(),
	institutionId: integer("institution_id")
		.notNull()
		.references(() => institutions.id),
	uploadedBy: integer("uploaded_by")
		.notNull()
		.references(() => users.id),
	filename: varchar("filename", { length: 255 }).notNull(),
	originalName: varchar("original_name", { length: 255 }),
	mimeType: varchar("mime_type", { length: 100 }),
	size: integer("size"),
	url: text("url").notNull(),
	extractedContent: text("extracted_content"),
	isProcessed: boolean("is_processed").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	...timestamps,
});

export const qrImagesRelations = relations(qrImages, ({ one }) => ({
	institution: one(institutions, {
		fields: [qrImages.institutionId],
		references: [institutions.id],
	}),
	uploader: one(users, {
		fields: [qrImages.uploadedBy],
		references: [users.id],
	}),
}));

export type QrImage = typeof qrImages.$inferSelect;
export type NewQrImage = typeof qrImages.$inferInsert;
