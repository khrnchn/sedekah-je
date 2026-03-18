# Repository Guidelines

## Project Structure
This is a Next.js App Router project. Key paths:
- `app/` route segments, including `app/(admin)`, `app/(user)`, and `app/api`.
- `components/` shared UI and layout components (shadcn/ui patterns).
- `lib/` utilities, server actions, and data helpers.
- `db/` Drizzle schema files and `db/migrations/`.
- `public/` static assets.
- `docs/` project documentation.
- `scripts/` one-off maintenance and data tasks.

## Build, Test, and Development Commands
Use Bun only (`npx only-allow bun` enforces this).
- `bun dev` run local dev server (Turbopack).
- `bun build` create production build.
- `bun start` run production server.
- `bun run check` Biome lint + format in one pass.
- `bun run lint` Biome lint only.
- `bun run format` format code with Biome.
- `bun run type-check` TypeScript type checking.
- `bun test` run Bun test suite.
- `bun run db:seed` seed the database.
- `bun run db:truncate` clear the database.
- `bun run clean` remove `node_modules/`, `.next/`, and lockfiles.

## Coding Style & Naming Conventions
- Indentation: tabs, width 2; line width 80 (see `biome.json`).
- Semicolons on; trailing commas; double quotes in JSX.
- Prefer feature-based folders under `app/` with `_lib/` and `_components/`.
- Avoid client-side data fetching with `useEffect`; favor server components/actions.
- Tailwind CSS is the primary styling system.

## Testing Guidelines
- Current tests use Bun’s test runner. Example: `lib/onboarding-tour/steps.test.js`.
- Name tests `*.test.js` or `*.test.ts` and colocate near the module.
- Run `bun test` before PRs; add tests for behavior changes when practical.

## Commit & Pull Request Guidelines
- Commit history follows Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` with optional scopes like `fix(contribute):`.
- Commitizen (`git-cz`) is configured; emojis are enabled.
- PRs should include a clear summary, linked issue (if any), and screenshots or recordings for UI changes. Note any DB migrations or data impacts.

## Configuration & Data Notes
- Environment settings are centralized in `env.ts` and Next config in `next.config.mjs`.
- Database access uses Drizzle (`db/`); keep schema changes and migrations in sync.
- This project targets Malaysian institutions and payment methods; keep copy and UX culturally aligned.
