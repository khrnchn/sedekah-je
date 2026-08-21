# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

sedekah.je is a community-driven Malaysian directory of donation QR codes for
mosques, suraus, tahfiz schools, charities, and other Islamic institutions.

The application uses Next.js 16, React 19, TypeScript, PostgreSQL with Drizzle
ORM, Better Auth, Cloudflare R2, Tailwind CSS, and shadcn/ui. Bun is the only
supported package manager and runtime.

## Commands

```bash
# Development
bun dev
bun build
bun start

# Quality
bun run check
bun run lint
bun run format
bun run type-check
bun test

# Database
bun run db:seed
bun run db:truncate
```

Use the named scripts in `package.json` for imports, matching, reviews,
backfills, and campaign generation. Read a script before running it because
several utilities mutate production data.

## Architecture

- `app/` contains Next.js App Router pages, layouts, and route handlers.
- `app/(admin)/` contains role-protected administration features.
- `app/(user)/` contains contributor-facing features.
- `app/api/` contains public integrations, authentication, and MCP routes.
- `components/` contains shared components; `components/ui/` contains
  shadcn/ui primitives.
- `lib/` contains shared services, queries, integrations, and utilities.
- `db/` contains Drizzle table definitions, the schema barrel, and migrations.
- `hooks/` contains shared client hooks.

Prefer feature-local `_components/` and `_lib/` directories. Reuse the
organization of the closest existing feature rather than forcing every route
into an identical template.

Use Server Components by default. Fetch initial data on the server instead of
using `useEffect`. Use Server Actions for authenticated mutations and Route
Handlers for public APIs or integration protocols.

## Code Quality

- Keep TypeScript strict; do not introduce `any`.
- Use Biome for formatting and linting.
- Use absolute `@/` imports.
- Prefer named exports for shared symbols.
- Use object or tuple constants instead of PostgreSQL enums.
- Treat this as a public repository: do not expose credentials, tokens,
  private user data, or operational secrets.
- Preserve Malaysian terminology and use Bahasa Malaysia for public product
  copy where the surrounding feature does.

## Authentication and Authorization

Better Auth provides Google OAuth and session management.

- `proxy.ts` performs the initial cookie-based checks for `/admin`,
  `/my-contributions`, and `/auth`.
- `app/(admin)/layout.tsx` verifies the session and the database-backed admin
  role after the proxy check.
- Server code should await `headers()` before passing the result to
  `auth.api.getSession`.
- Client components should use the existing `useAuth()` hook.
- Authentication is not authorization. Server mutations must verify ownership
  or the required role.

Example:

```typescript
const headersList = await headers();
const session = await auth.api.getSession({ headers: headersList });
```

## Database and Caching

- Runtime institution data is PostgreSQL-backed.
- `app/data/institutions.ts` is a legacy migration/maintenance source, not a
  runtime data source.
- Use Drizzle for database access and export table types with `$inferSelect`
  and `$inferInsert`.
- Authenticate private queries and mutations. Public institution queries are
  intentionally unauthenticated but must return approved records only.
- Use SQL aggregation and batch operations rather than fetching data to count
  it or issuing query loops.
- Follow nearby cache lifetimes and tags. Current Next.js invalidation calls
  use a cache profile, for example `revalidateTag("institutions", "max")`.

## Forms and Uploads

- Define Zod validation in the feature's `_lib/` directory.
- Validate input, authentication, authorization, and ownership on the server.
- Use React Hook Form where the existing feature does; use React 19
  `useActionState` for action-state flows.
- Upload QR and blog images through the existing R2 storage service. Do not
  write uploads into `public/`.
- Institution submission requires a QR image, applies rate limits, validates
  the upload, and checks decoded payment content for duplicates when available.

## Testing

Run `bun test` for the Bun test suite. Existing tests include Friday campaign
behavior and onboarding-tour step selection. Add tests for new observable
business behavior when existing coverage does not protect it.

## Business Constants

Source category, state, payment, and status values from
`lib/institution-constants.ts`.

- Categories: `masjid`, `surau`, `tahfiz`, `kebajikan`, `lain-lain`
- Payments: `duitnow`, `tng`, `boost`, `toyyibpay`
- Statuses: `pending`, `approved`, `rejected`
- Roles: `user`, `admin`

Only approved institutions are public. New submissions are pending until an
admin approves or rejects them.

## Product Context

The primary experience is mobile-first discovery and verification of Malaysian
donation QR codes. Keep search, filters, QR previews, maps, sharing, and
contribution workflows fast and direct. Treat QR legitimacy, contributor
privacy, and admin authorization as security-sensitive.