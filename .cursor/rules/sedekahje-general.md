# General Rules - sedekah.je

This is a Next.js 14 Malaysian QR code directory for mosques, suraus, and other religious institutions.

## Tech Stack
- **Framework**: Next.js 14 App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with Google OAuth
- **Styling**: Tailwind CSS + shadcn/ui
- **Package Manager**: Bun exclusively
- **Code Quality**: Biome (tabs, 80 chars)

## Core Principles
1. **Server Actions First** - Use server actions instead of API routes
2. **Feature-Based Organization** - Group by features, not file types
3. **TypeScript Strict** - No `any` types, proper inference
4. **Malaysian Context** - Consider local payment systems and culture
5. **Performance** - Server components by default, client when needed

## Quick Commands
```bash
# Development
bun dev

# Code Quality
bun run check      # lint + format
bun run type-check

# Database
bun run db:seed
bun run db:truncate
```

## Development Workflow
1. Use TypeScript strictly - no `any` types
2. Use Biome for linting and formatting (tabs, 80 char limit)
3. Use Drizzle ORM for all database operations
4. Use Better Auth for authentication
5. Use server actions for form submissions (NO API routes unless necessary)
6. Use TanStack Query for client-side data fetching
7. Use shadcn/ui components (don't modify them)
8. Use Tailwind for all styling
9. Use proper error handling with try-catch
10. Use proper loading states for async operations