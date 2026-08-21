<div align="center">

# sedekah.je

</div>

sedekah.je is a directory of QR codes of mosques, suraus, or other islamic institutions (eg: tahfiz) in malaysia.
the primary goal is to make it easier for people to donate to these institutions.

This repository contains the **Rust rewrite** of the former Next.js application. The previous
TypeScript/Next.js codebase is preserved for reference under [`legacy/`](legacy/).

## about the rewrite

Everything from the original app has been ported to a single Rust binary that serves server-rendered pages:

- **Web framework** — [axum](https://github.com/tokio-rs/axum) `0.8`
- **Database** — PostgreSQL via [sqlx](https://github.com/launchbadge/sqlx), schema in `migrations/0001_init.sql`
  (idempotent, safe to run against the existing production database)
- **Auth** — Google OAuth with DB-backed sessions (7-day lifetime), compatible with the legacy
  `better-auth.session_token` cookie
- **Storage** — Cloudflare R2 uploads for QR images (`object_store`)
- **QR rendering** — server-side SVG and PNG generation (`qrcode`), including dynamic OG images
- **Templates** — hand-rolled HTML/CSS/JS rendered by Rust (no frontend framework)

### Routes

Public: `/`, `/{category}/{slug}`, `/rawak`, `/quest`, `/blog`, `/blog/{slug}`, `/ramadhan`,
`/ramadhan-wrapped-2026`, `/data`, `/faq`, `/contribute`, `/my-contributions`, `/leaderboard`,
`/embed/{slug}`, `/qr/{slug}`, `/legal`, `/privacy`, `/terms`, `/offline`, `/docs`.

API: `/api/institutions`, `/api/random`, `/api/getdoa`, `/api/getdoa/random`,
`/api/institutions/submit`, `/api/og/{slug}`, `/api/og/ramadhan/{day}`, `/api/onboarding-tour`,
`/api/meta/*` (Threads OAuth + data-deletion), `/api/mcp` (MCP tools), `/api/admin/institutions/export`.

Admin: `/admin/dashboard`, `/admin/institutions/{pending,approved,rejected}`, `/admin/claim-requests`,
`/admin/users`, `/admin/friday`, `/admin/ramadhan`, `/admin/blog`, `/admin/threads`.

SEO: `/sitemap.xml`, `/robots.txt`, `/manifest.json`.

### Business rules preserved from the original

- Only `status = 'approved'` institutions are ever public.
- Search is case-insensitive `ILIKE '%query%'` over name/description/city.
- Category URLs are canonical `/{category}/{slug}` with legacy `mosque → masjid`, `others → lain-lain`.
- 3-submissions-per-day rolling limit for non-admins (cooldown = max(newest+12h, oldest+24h)).
- Friday campaign: active window Thursday 19:00 → Friday 18:59 MYT; override wins, then the persisted
  run, then a one-time `ORDER BY RANDOM()` pick.
- Leaderboard counts `is_active AND status='approved'` contributions only.
- Slug generation: `slugify(name)` with `-1`, `-2`, … dedup.

## running

```bash
cp .env.example .env   # fill in DATABASE_URL and friends
cargo run --release
```

The server listens on `$PORT` (default 3000). The schema is applied automatically on boot
(`CREATE TABLE IF NOT EXISTS …`), so it works against both a fresh database and the existing one.

## scripts

```bash
cargo build --bins
JAIS_DATA=legacy/data/jais-petaling.json ./target/release/seed-quest-mosques
./target/release/geocode-quest-mosques  --limit 50 --pause-ms 1100
./target/release/ramadhan-wrapped-report --outDir ./reports
```

## contributing

everyone is welcome to contribute! fork the repo and start cooking. you may also propose an idea by
creating an issue.

## legacy

The full TypeScript/Next.js codebase that this port replaces lives in [`legacy/`](legacy/). It is
preserved for behavioral comparison and history.

## sponsor

1. thank you [altaf](https://x.com/danielminho_?s=21&t=uaExBAqkDxtuY8KYLJBCLQ) for sponsoring 3 domains: `sedekah.je`, `sedekahje.com`, and `sedekah-je.com`.
2. thank you [farhan helmy](https://www.farhanhelmy.com/) for sponsoring analytics.
3. thank you [rempah](https://rz.my/) for sponsoring railway bill for ramadhan 2026.
