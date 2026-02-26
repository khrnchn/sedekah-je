# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

| Service | Notes |
|---|---|
| **Next.js dev server** | `bun dev` — runs on port 3000 with Turbopack |
| **PostgreSQL** | Local instance on port 5432. DB name/user/password: `sedekahje` |

### Quick reference

- **Development commands** are documented in `CLAUDE.md` and `package.json` scripts.
- **Lint/format**: `bun run check` (Biome). Pre-existing lint warnings/errors exist in the codebase; this is expected.
- **Type-check**: `bun run type-check` — passes cleanly.
- **Dev server**: `bun dev` (Next.js 15 + Turbopack on port 3000).

### Non-obvious caveats

- **Bun is required**: The project enforces Bun via a `preinstall` script (`npx only-allow bun`). Always use `bun` instead of npm/yarn/pnpm.
- **PostgreSQL must be running**: Start with `sudo pg_ctlcluster 16 main start` before running the dev server or any DB commands. The update script handles this automatically.
- **Database schema push**: Use `bunx drizzle-kit push --force` for non-interactive schema sync. The interactive `drizzle-kit push` will hang waiting for TTY input.
- **Seed script missing**: `bun run db:seed` references `db/main.ts` which does not exist. The app still works because the homepage loads static data from `app/data/institutions.ts` combined with dynamic DB data.
- **R2 / Google OAuth placeholders**: The `.env` file uses placeholder values for Cloudflare R2 and Google OAuth. Image uploads and Google login will not work without real credentials, but the app runs and displays institution data fine.
- **Map feature bug**: The "Tunjukkan Peta" (Show Map) toggle on the homepage triggers a Leaflet "Map container is already initialized" error. This is a pre-existing bug unrelated to environment setup.
- **No formal test framework**: The project has `@playwright/test` as a devDependency but no test files. `bun test` finds nothing to run.
