---
description: sedekahje architecture rules
globs:
alwaysApply: false
---

# Architecture Rules - sedekah.je

## File Structure & Organization

### Route Structure
- Use Next.js 14 App Router with `app/` directory
- Group related routes with `()` syntax: `app/(user)/`, `app/(admin)/`
- Use private folders with `_` prefix: `_components/`, `_lib/`
- Dynamic routes: `[param]/`, catch-all: `[...param]/`
- API routes in `app/api/` (only when server actions aren't suitable)

### Component Organization
- Feature-based component organization
- Private components in `_components/` folders
- Shared components in `components/`
- UI components in `components/ui/` (shadcn/ui - don't modify)
- Group related components by feature

### Server Actions Architecture
```
app/
├── (user)/
│   ├── feature/
│   │   ├── _lib/
│   │   │   ├── queries.ts     # Server queries
│   │   │   ├── actions.ts     # Server actions
│   │   │   └── validations.ts # Zod schemas
│   │   ├── _components/       # Private components
│   │   └── page.tsx          # Route page
│   └── layout.tsx            # Protected layout
├── (admin)/                  # Admin routes
│   └── admin/
│       ├── dashboard/_lib/
│       ├── institutions/_lib/
│       └── users/_lib/
```

### Import/Export Patterns
```typescript
// Prefer named exports
export const users = pgTable("users", {});
export type User = typeof users.$inferSelect;

// Re-export from index files
export * from "./users";
export * from "./institutions";

// Use absolute imports with @/ prefix
import { auth } from "@/auth";
import { db } from "@/db";
import { Button } from "@/components/ui/button";
```

## Code Quality Standards

### Imports
- Use absolute imports with `@/` prefix
- Group imports: external libraries, then internal modules
- Use type imports when importing only types: `import type { User } from`

### Naming Conventions
- camelCase for variables and functions
- PascalCase for components and types
- UPPER_SNAKE_CASE for constants
- kebab-case for file names

### TypeScript Patterns
- Use Drizzle's `$inferSelect` and `$inferInsert` for table types
- Export types alongside table definitions
- Use `typeof` for enum-like constants: `$type<(typeof userRoles)[number]>()`
- Create utility types for specific use cases
- No `any` types - use proper typing