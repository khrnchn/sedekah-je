---
description: sedekahje database rules
globs:
alwaysApply: false
---

# Database Rules - sedekah.je

## Database Structure
- Separate schema files: `db/users.ts`, `db/institutions.ts`
- Main export file: `db/schema.ts`
- Shared utilities: `db/helpers.ts`
- Migrations in `db/migrations/`

## Schema Definition Patterns

### Table Definition
```typescript
export const tableName = pgTable("table_name", {
  id: serial("id").primaryKey(),
  field: varchar("field", { length: 255 }).notNull(),
  enumField: varchar("enum_field", { length: 20 })
    .notNull()
    .$type<(typeof enumValues)[number]>(),
  ...timestamps,
});

export const tableRelations = relations(tableName, ({ one, many }) => ({
  relatedTable: one(otherTable, {
    fields: [tableName.foreignKey],
    references: [otherTable.id],
  }),
}));
```

### Type Exports
```typescript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## Query Patterns

### Server Queries (in _lib/queries.ts)
```typescript
"use server";

export async function getServerData() {
  const result = await db
    .select({
      field: table.field,
      count: count().as("count"),
    })
    .from(table)
    .where(eq(table.isActive, true))
    .orderBy(desc(table.createdAt));
  
  return result;
}
```

### Common Query Patterns
- Use `eq()`, `desc()`, `count()` from drizzle-orm
- Always handle authentication in server queries
- Use proper error handling with try-catch
- Return typed results

## Database Operations

### Mutations
```typescript
// Insert
const [newRecord] = await db
  .insert(table)
  .values(data)
  .returning({ id: table.id });

// Update
await db
  .update(table)
  .set(data)
  .where(eq(table.id, id));

// Delete
await db
  .delete(table)
  .where(eq(table.id, id));
```

### Drizzle ORM Best Practices
- Use transactions for related operations
- Properly handle foreign key constraints
- Use `returning()` for insert/update operations
- Handle unique constraint violations