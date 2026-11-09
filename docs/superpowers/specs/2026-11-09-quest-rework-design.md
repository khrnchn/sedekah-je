# Mosque Quest rework

## Intent

`/quest` tracks the JAIS list of 100 Petaling mosques and which of them have a
donation QR on sedekah.je. Today it is a plain Leaflet map with a list drawer.
The rework turns it into a page that pushes visitors to go find the missing QRs
and submit them.

Visitors can be anywhere: near a mosque, at home, or arriving from a shared
link. The page has to make two things clear at a glance: how much is left, and
what to do about it.

Reward for now is the leaderboard, plus the contributor's name on the mosque
they unlocked.

## Goals

- Mobile-first, crisp, restrained UI.
- Map is the default view, zoomed out to the whole Petaling boundary.
- Board and Grid are alternative views of the same data.
- Missing mosques are the obvious call to action.
- Pending mosques show that an attempt exists, but stay open for more
  submissions.
- Approved mosques show the QR and who submitted it.

## Non-goals

- New districts or states beyond the existing `quest_mosques` data.
- Badges, streaks, points, check-ins, or other gamification beyond the
  leaderboard.
- Backfilling the 32 missing coordinates (separate task, existing geocode
  script).
- Changes to the main `/contribute` flow.

## Anti-goals

- Cringe: no emoji in UI, no "hunt", "bounty", or sticker-album language, no
  dark gamer styling.
- A drawer that hides the map when a mosque is selected.
- Unmapped mosques silently disappearing.
- Showing unverified submitters' names publicly.

## Current data (snapshot 2026-11-09, after cleanup)

- 96 quest mosques, all `district = Petaling`.
- 57 linked, 39 unlinked.
- Cleanup done before this rework: 4 duplicate rows removed (#87, #97, #98,
  #99, same mosque under two JAIS ids) and 7 unlinked mosques linked to
  existing approved listings after manual review (#5, #26, #41, #53, #54, #62,
  #82). #72 Al-Muttaqin vs listing #2759 is still unconfirmed.
- `scripts/seed-quest-mosques.ts` dedupes on `jais_id` only, so a re-run
  would re-add the 4 removed rows. The rework adds a skip list or name and
  coords dedupe there.
- Some mosques have no coords, so not every mosque renders as a map pin.

## Status model

| Status | Condition | Public display | Can submit |
|---|---|---|---|
| Missing | not linked, no pending attempts | open target | yes |
| In review | not linked, 1+ pending attempts | "N submissions in review. You can still submit." | yes |
| Has QR | linked to an approved listing | QR, payment type, "Added by {name}" | no |

- Pending attempts show a count only, never the submitter name.
- Rejected attempts stop counting. The mosque falls back to Missing or In
  review.
- Leaderboard credit goes only to the user whose attempt the admin approves.
  One credit per mosque.

## Data model

Today `quest_mosques.institution_id` holds a single link and the quest action
blocks submission while it is pending. That cannot represent several attempts,
or an attempt that points at a listing that already exists.

New table `quest_attempts`:

| Column | Notes |
|---|---|
| `id` | serial |
| `quest_mosque_id` | FK, indexed |
| `user_id` | FK to users, the hunter |
| `institution_id` | FK. A new pending institution, or an existing approved listing |
| `kind` | `new` or `existing` (tuple constant, not a PG enum) |
| `status` | `pending`, `approved`, `rejected` |
| timestamps | |

- `quest_mosques.institution_id` keeps meaning "the approved listing for this
  mosque". It is written only when an attempt is approved.
- Backfill: one `approved` attempt per currently linked mosque, `kind = new`,
  `user_id = institutions.contributor_id`. This keeps today's leaderboard. Rows
  whose listing has no contributor get no attempt and no credit.
- Leaderboard counts approved attempts per user.

### Attempt kinds

- **new**: QR not in the system. Creates a pending institution like today plus
  a pending attempt. Approving or rejecting that institution through the
  existing review flow (`lib/features/institution-review/review.ts`, Telegram
  bot, admin pages) updates the attempt in the same transaction.
- **existing**: QR matches an approved listing that is not linked to any quest
  mosque. No new institution. The attempt is reviewed on its own: a small admin
  list (approve / reject) plus a Telegram notification. Approving links the
  listing to the mosque and credits the hunter.
- QR matching a listing already linked to another quest mosque, or a pending
  listing, is blocked with the normal duplicate message.

### Approval and revert rules

- Approving an attempt links the mosque only if it is still unlinked. If it
  is already linked, the attempt is approved without changing the link and
  gets no leaderboard credit (builder's call how to mark that).
- Other pending attempts are not auto-rejected. The admin decides. Review
  cards show "Quest: {mosque}, {N} attempts" so the conflict is visible.
- Reverting or undoing the linked listing (`review.ts` revert and
  `undoApproval` in `app/(admin)/admin/institutions/_lib/actions.ts`) rejects
  its attempt and relinks to another approved attempt for that mosque if one
  exists. Otherwise it unlinks (my call).
- All of these revalidate `quest-mosques`.
- Status derivation also checks the linked listing is actually approved, as a
  safeguard.

## Submission flow fixes

The quest server action is rewritten on the same rules as the main contribute
path:

- Decode the QR server-side from the uploaded image, browser decode as
  fallback, same as `app/(user)/contribute/_lib/submit-institution.ts`.
- Use the shared duplicate lookup (`lib/queries/institution-duplicate.ts`) to
  pick between `new`, `existing`, and blocked.
- Use the shared submission rate limit instead of the quest-only 3 per day.
- Zod-validate FormData in `app/quest/_lib/`.
- Remove the pending block. The only quest rule: once a mosque has an
  approved QR, nobody can submit to it. Until then anyone can submit an
  attempt (normal duplicate QR and rate limits still apply).
- Fix the `FOR UPDATE` on a LEFT JOIN. Submit no longer writes the link, so the
  lock can likely go.

## Screens (mobile)

Mockups: `.superpowers/brainstorm/*/content/direction-v2.html`.

### Shell

- Top: title "Mosque Quest", "Petaling", `{linked}/{total} have QR` with a thin
  progress bar.
- Segmented control: Map / Board / Grid.
- Leaderboard opens from the header as a sheet.
- View and selected mosque live in the URL (`?view=board&m=41`) so links are
  shareable and the sign-in redirect returns to the same mosque.

### Map (default)

- Fits the Petaling boundary on load.
- Small status dots, not tall pins. Has QR = solid green, Missing = hollow,
  In review = amber.
- Bottom bar: legend with counts, which also works as a filter.
- "{N} mosques have no map location · View list" opens Board filtered to those.
- Tapping a dot opens a short peek card (about 40% height max). The map pans
  so the dot stays visible above the card.

### Mosque card (shared by all views)

- Name, address, status pill. Pending mosques use the amber "In review" pill,
  not "Missing QR" as in the mockup (my call).
- Missing / In review: attempt notice if any, "Submit QR", "Directions"
  (Google Maps link from coords or name + address).
- Has QR: QR display, payment type, "Added by {name}", link to the
  institution page.

### Board

- List, Missing first, then In review, then Has QR.
- Search, status filter, sort A to Z or Nearest.
- Nearest asks for location only when tapped. No location prompt on load.
- Unmapped mosques show "No map location".

### Grid

- All 100 as small squares coloured by status, with legend.
- Tap opens the same card.

### Desktop

- Same views. Map and card side by side, Board and Grid use a wider layout.
  Builder's call on exact layout, keep it consistent with the mobile style.

## Visual style

- Light, neutral, one green accent (emerald), amber only for In review.
- Dark mode via existing theme tokens.
- Tabular numerals for counts.
- Touch targets at least 44px. Close buttons have accessible names.
- English copy throughout the quest feature.

## Performance

- Leaflet stays client-only and lazy. Board and Grid must not load Leaflet.
- Keep the existing 5 minute cache and `quest-mosques` tag.
- Stats and counts come from SQL aggregation, including pending attempt
  counts per mosque.

## Left to the builder

- Component breakdown inside `app/quest/_components/`. Remove the duplicated
  floating/sheet detail markup.
- Tile provider and map styling, as long as it reads light and quiet.
- Loading and empty states, including "No mosques match" with a clear filters
  action.
- Tests: status derivation (Missing / In review / Has QR), approval linking
  rules, and the quest action's validation paths.
