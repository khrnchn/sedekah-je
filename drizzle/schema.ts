import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// enums
export const paymentOptionEnum = pgEnum("payment_option", [
  "duitnow",
  "tng",
  "boost",
]);

export const institutionStatusEnum = pgEnum("institution_status", [
  "pending",
  "approved",
  "rejected",
]);

// tables
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    nickname: text("nickname").notNull(),
    email: text("email").notNull(),
    gender: text("gender").notNull(),
    hasCompletedOnboarding: boolean("hasCompletedOnboarding").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (users) => ({
    emailIdx: uniqueIndex("user_email_idx").on(users.email),
  })
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    icon: text("icon").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (categories) => ({
    slugIdx: uniqueIndex("category_slug_idx").on(categories.slug),
  })
);

export const institutions = pgTable(
  "institutions",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    city: text("city").notNull(),
    state: text("state").notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    qrContent: text("qr_content"),
    supportedPayment: paymentOptionEnum("supported_payment").array(),
    source: text("source").notNull(),
    status: institutionStatusEnum("status").default("pending").notNull(),
    contributedById: integer("contributed_by_id")
      .notNull()
      .references(() => users.id),
    approvedById: integer("approved_by_id").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (institutions) => ({
    nameIdx: uniqueIndex("institution_name_idx").on(institutions.name),
    statusIdx: index("status_idx").on(institutions.status),
    locationIdx: index("location_idx").on(
      institutions.latitude,
      institutions.longitude
    ),
  })
);

// relations
export const userRelations = relations(users, ({ many }) => ({
  contributedInstitutions: many(institutions, {
    relationName: "contributor",
  }),
  approvedInstitutions: many(institutions, {
    relationName: "approver",
  }),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  institutions: many(institutions, {
    relationName: "category",
  }),
}));

export const institutionRelations = relations(institutions, ({ one }) => ({
  category: one(categories, {
    fields: [institutions.categoryId],
    references: [categories.id],
  }),
  contributor: one(users, {
    fields: [institutions.contributedById],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [institutions.approvedById],
    references: [users.id],
  }),
}));

// model type inference
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Institution = InferSelectModel<typeof institutions>;
export type NewInstitution = InferInsertModel<typeof institutions>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;
