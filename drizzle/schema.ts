import { pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const institutionTypeEnum = pgEnum('institution_type', ['mosque', 'surau', 'rumah kebajikan', 'others']);
export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected']);
export const paymentMethodEnum = pgEnum('payment_method', ['duitnow', 'tng', 'boost']);

export const institutions = pgTable('institutions', {
  id: varchar('id').primaryKey().notNull(),
  name: varchar('name').notNull(),
  type: institutionTypeEnum('type').notNull(),
  city: varchar('city').notNull(),
  state: varchar('state').notNull(),
  facebookLink: varchar('facebook_link'),
  qrContent: text('qr_content').notNull(),
  supportedPayments: paymentMethodEnum('supported_payments').array(),
  status: statusEnum('status').notNull().default('pending'),
  uploadedBy: varchar('uploaded_by').notNull(),
  approvedBy: varchar('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});