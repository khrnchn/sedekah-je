# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

sedekah.je is a directory of QR codes for mosques, suraus, and other religious institutions in Malaysia. It's a community-driven platform built with Next.js 14, TypeScript, PostgreSQL (Drizzle ORM), and Better Auth.

## Development Commands

```bash
# Development
bun dev                    # Start development server
bun build                  # Production build
bun start                  # Production server

# Code Quality
bun run check              # Run Biome lint + format
bun run lint               # Lint only
bun run format             # Format code
bun run type-check         # TypeScript checking

# Database
bun run db:seed            # Seed database
bun run db:truncate        # Clear database

# Utilities
bun run clean              # Remove node_modules, .next, locks
```

**Important**: This project uses Bun as the package manager and runtime. Always use `bun` instead of `npm` or `yarn`.

## Architecture

### App Router Structure (Next.js 13+)
- `/app/(admin)/` - Admin dashboard with role-based access
- `/app/(user)/` - User-facing features
- `/app/api/` - API routes and server actions
- `/app/[institution]/[slug]/` - Dynamic institution pages

### Key Directories
- `/components/` - React components (uses shadcn/ui)
- `/lib/` - Utilities, database queries, server actions
- `/db/` - Database schema and migrations (Drizzle ORM)
- `/hooks/` - Custom React hooks

### Database Schema
Core entities:
- **users** - Authentication and profiles
- **institutions** - QR codes, locations, approval status
- **auth sessions/accounts** - Better Auth tables

Workflow: Institutions go through Pending → Approved/Rejected states.

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth with Google OAuth
- **Styling**: Tailwind CSS + shadcn/ui components
- **Code Quality**: Biome (replaces ESLint + Prettier)
- **State**: TanStack React Query + URL state (nuqs)
- **Storage**: Cloudflare R2 for images
- **Security**: Cloudflare Turnstile

## Development Guidelines

### Code Quality
- Use Biome for all formatting and linting (tabs, 80 chars, configured in `biome.json`)
- TypeScript strict mode - NO `any` types, proper inference
- Run `bun run check` before committing
- Follow Malaysian context for UI/UX (Bahasa Malaysia, payment systems)

### File Organization & Architecture
**Feature-Based Structure** (avoid file type grouping):
```
app/(user)/feature/
├── _lib/
│   ├── queries.ts     # Server queries (cached with unstable_cache)
│   ├── actions.ts     # Server actions (mutations)
│   ├── validations.ts # Zod schemas
│   └── types.ts       # TypeScript types
├── _components/       # Private components
└── page.tsx          # Route page
```

### Key Principles
1. **Server Actions First** - Use server actions instead of API routes
2. **Avoid pg enums** - Use object constants for easier production management
3. **No useEffect for data fetching** - Fetch at server component, pass as props
4. **Server Components by Default** - Only use "use client" when needed

### Authentication (Better Auth)
- Layout-based route protection: `/app/(user)/layout.tsx` and `/app/(admin)/layout.tsx`
- Server-side: `const session = await auth.api.getSession({ headers: headers() })`
- Client-side: `useAuth()` hook for user state
- Roles: "user" (contributors) and "admin" (approval rights)

### Database Patterns (Drizzle ORM)
- **Performance**: Wrap queries with `unstable_cache` for caching
- **Batch Operations**: Use `inArray()` instead of Promise.all loops
- **Counting**: Use Drizzle `count()` function, not `.length`
- **Cache Invalidation**: Use `revalidateTag()` for targeted invalidation
- **Schema**: Export types with `$inferSelect` and `$inferInsert`

### Form Handling Pattern
1. Zod schema in `_lib/validations.ts`
2. Server action in `_lib/actions.ts` with proper validation
3. React Hook Form + useFormState for client component
4. Always validate on server, handle authentication
5. Use `revalidatePath()` after mutations

### Performance Optimizations
- **UI Streaming**: Break complex pages into async components with `<Suspense>`
- **Caching**: Use `unstable_cache` with appropriate TTL (300s for dynamic, 900s for stable)
- **Server Components**: Fetch data at server level, minimize client-side requests

## Testing

No formal testing framework is currently set up. Consider this when making changes that require testing.

## Business Context (Malaysian Focus)

### Institution Types & Themes
- `mosque` (masjid) - Blue theme color
- `surau` - Green theme color  
- `others` (lain-lain) - Violet theme color

### Payment Methods
- `duitnow` - Malaysian instant payment system
- `tng` - Touch 'n Go eWallet
- `boost` - Boost eWallet

### Institution Workflow
- `pending` - Awaiting admin approval (default for new submissions)
- `approved` - Approved by admin and visible to public
- `rejected` - Rejected by admin with reason

### Data Sources
- **Static Data**: Historical institutions in `app/data/institutions.ts`
- **Dynamic Data**: User-contributed institutions in PostgreSQL
- **Combined Display**: Both sources shown together on maps and listings

## Special Features

- **QR Code Processing**: Automatic extraction and validation of payment QR codes
- **Geolocation**: Institution mapping with Malaysian state-based filtering
- **PWA**: Progressive Web App configuration
- **Telegram Integration**: Logging for new user registrations and institution submissions
- **Workflow Management**: Institution approval system with admin controls
- **Malaysian States**: All 16 states and federal territories with flag support

## Common Tasks

### Adding New Institution Fields
1. Update schema in `/db/schema/institutions.ts`
2. Create migration with Drizzle
3. Update form components in `/components/`
4. Update validation schemas

### Adding New API Endpoints
1. Create route in `/app/api/`
2. Use server actions for mutations
3. Add queries in `/lib/queries/`
4. Update React Query hooks

### Database Operations
- Connection configured through `DATABASE_URL`
- Optional `DIRECT_URL` for connection pooling
- Schema changes require migrations via Drizzle

Remember: This is a community project focused on Malaysian religious institutions. Maintain respect for the cultural context and ensure all QR codes are legitimate donation channels.