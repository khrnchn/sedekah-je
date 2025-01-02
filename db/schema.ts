import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

// TODO: if this gets too big, split it into multiple files

export const institutionStatus = t.pgEnum("institution_status", [
  "pending",
  "approved",
  "rejected",
]);

const timestamps = {
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t.timestamp("updated_at"),
};

export type Institution = typeof institutions.$inferSelect;
export type NewInstitution = typeof institutions.$inferInsert;

export type InstitutionWithRelations = Institution & {
  category: Category;
  state: State;
  city: City;
};

export const institutions = t.pgTable("institutions", {
  id: t.serial("id").primaryKey(),

  name: t.varchar("name", { length: 255 }).notNull(),
  description: t.text("description"),
  phone: t.varchar("phone", { length: 15 }),
  email: t.varchar("email", { length: 255 }),

  categoryId: t
    .integer("category_id")
    .references(() => categories.id)
    .notNull(),
  stateId: t
    .integer("state_id")
    .references(() => malaysianStates.id)
    .notNull(),
  cityId: t
    .integer("city_id")
    .references(() => malaysianCities.id)
    .notNull(),

  qrImagePath: t.text("qr_image_path"),
  qrContent: t.text("qr_content"),

  latitude: t.decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: t.decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  address: t.text("address"),
  postcode: t.varchar("postcode", { length: 5 }),

  contributorId: t
    .integer("contributor_id")
    .references(() => users.id)
    .notNull(),
  status: institutionStatus("status").notNull().default("pending"),
  approvedById: t.integer("approved_by_id").references(() => users.id),
  approvedAt: t.timestamp("approved_at"),
  rejectionReason: t.text("rejection_reason"),

  ...timestamps,
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export const categories = t.pgTable("categories", {
  id: t.serial("id").primaryKey(),
  name: t.varchar("name", { length: 50 }).notNull().unique(),
  description: t.text("description"),

  ...timestamps,
});

export type State = typeof malaysianStates.$inferSelect;

export const malaysianStates = t.pgTable("malaysian_states", {
  id: t.serial("id").primaryKey(),
  name: t.varchar("name", { length: 50 }).notNull().unique(),
  code: t.varchar("code", { length: 3 }).notNull().unique(), // e.g. SGR, KUL, etc.

  ...timestamps,
});

export type City = typeof malaysianStates.$inferSelect;

export const malaysianCities = t.pgTable("malaysian_cities", {
  id: t.serial("id").primaryKey(),
  name: t.varchar("name", { length: 100 }).notNull(),
  stateId: t
    .integer("state_id")
    .references(() => malaysianStates.id)
    .notNull(),

  ...timestamps,
});

export const socialPlatforms = t.pgTable("social_platforms", {
  id: t.serial("id").primaryKey(),
  name: t.varchar("name", { length: 50 }).notNull().unique(), // e.g. Facebook, Instagram, etc.
  baseUrl: t.varchar("base_url", { length: 255 }), // e.g. https://facebook.com/

  ...timestamps,
});

export const institutionSocialLinks = t.pgTable("institution_social_links", {
  id: t.serial("id").primaryKey(),
  institutionId: t
    .integer("institution_id")
    .references(() => institutions.id)
    .notNull(),
  platformId: t
    .integer("platform_id")
    .references(() => socialPlatforms.id)
    .notNull(),
  username: t.varchar("username", { length: 255 }).notNull(), // Store just username/handle
  url: t.varchar("url", { length: 255 }).notNull(), // Full URL

  ...timestamps,
});

export const banks = t.pgTable("banks", {
  id: t.serial("id").primaryKey(),
  name: t.varchar("name", { length: 100 }).notNull().unique(),
  code: t.varchar("code", { length: 10 }).notNull().unique(), // Bank code like MBB, CIMB

  ...timestamps,
});

export const institutionBankAccounts = t.pgTable("institution_bank_accounts", {
  id: t.serial("id").primaryKey(),
  institutionId: t
    .integer("institution_id")
    .references(() => institutions.id)
    .notNull(),
  bankId: t
    .integer("bank_id")
    .references(() => banks.id)
    .notNull(),
  accountName: t.varchar("account_name", { length: 255 }).notNull(),
  accountNumber: t.varchar("account_number", { length: 50 }).notNull(),
  isDefault: t.boolean("is_default").default(false),

  ...timestamps,
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;

export const paymentMethods = t.pgTable("payment_methods", {
  id: t.serial("id").primaryKey(),
  name: t.varchar("name", { length: 50 }).notNull().unique(),
  description: t.text("description"),

  ...timestamps,
});

export type InstitutionPaymentMethod =
  typeof institutionPaymentMethods.$inferSelect;
export type NewInstitutionPaymentMethod =
  typeof institutionPaymentMethods.$inferInsert;

export const institutionPaymentMethods = t.pgTable(
  "institution_payment_methods",
  {
    institutionId: t
      .integer("institution_id")
      .references(() => institutions.id)
      .notNull(),
    paymentMethodId: t
      .integer("payment_method_id")
      .references(() => paymentMethods.id)
      .notNull(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: t.primaryKey(table.institutionId, table.paymentMethodId),
    };
  }
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const users = t.pgTable("users", {
  id: t.serial("id").primaryKey(),
  clerkId: t.varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: t.varchar("email", { length: 255 }).notNull(),
  name: t.varchar("name", { length: 255 }).notNull(),
  isAdmin: t.boolean("is_admin").default(false).notNull(),

  ...timestamps,
});

export const institutionsRelations = relations(
  institutions,
  ({ one }) => ({
    category: one(categories, {
      fields: [institutions.categoryId],
      references: [categories.id],
    }),
    state: one(malaysianStates, {
      fields: [institutions.stateId],
      references: [malaysianStates.id],
    }),
    city: one(malaysianCities, {
      fields: [institutions.cityId],
      references: [malaysianCities.id],
    }),
  })
);
