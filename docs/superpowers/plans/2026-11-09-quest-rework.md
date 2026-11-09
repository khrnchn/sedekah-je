# Mosque Quest Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/quest` as a mobile-first Map / Board / Grid page backed by a `quest_attempts` model where anyone can submit until a mosque has an approved QR.

**Architecture:** A new `quest_attempts` table records every submission (new pending institution, or pointer to an existing approved listing). `quest_mosques.institution_id` stays "the approved listing" and is recomputed by one deep module (`lib/features/quest/sync.ts`) that every review, revert and undo path calls. The page is a server-fetched list rendered by a client shell with URL state; Leaflet loads only for the Map view.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Drizzle + PostgreSQL, Bun test, Leaflet/react-leaflet 4, Tailwind + shadcn/ui, Zod.

**Spec:** `docs/superpowers/specs/2026-11-09-quest-rework-design.md`
**Ticket:** KC-258. Branch: `kc/kc-258-rework-mosque-quest-for-mobile`.

## Global Constraints

- Bun only. Verify with `bun run check`, `bun run type-check`, `bun test`.
- English copy throughout the quest feature (user override of the repo's BM default for this feature only).
- No emoji, no "hunt"/"bounty"/sticker language in UI.
- Light, neutral UI; one accent `emerald` for Has QR, `amber` only for In review; dark mode via existing theme tokens.
- Touch targets ≥ 44px; icon-only buttons have `aria-label`.
- Tuple constants, not PG enums. `@/` imports. No `any`.
- Pending attempts show a count only, never a submitter name. Contributor name shows only on Has QR.
- The only quest submit rule: once a mosque has an approved QR, nobody can submit to it. Otherwise anyone can, subject to the shared duplicate QR check and `checkSubmissionRateLimit`.
- Never run `drizzle-kit migrate`/`push`, seed, or other scripts against `DATABASE_URL` without asking the user first; it is production.
- DB-backed tests are opt-in with `QUEST_LOCAL_TESTS=true` and must refuse non-loopback hosts, same guard as `lib/integrations/telegram/review-database.test.ts:31-37`.
- Commits: short imperative conventional subject (`feat(quest): ...`), no body, no attribution, no em dashes.
- Cache tag `quest-mosques`, revalidate 300s, unchanged.

## Review Focus

1. Mosque gets approved while a user has its card open, then they submit → server re-checks inside the transaction and returns "This mosque already has a QR." (Task 5 test).
2. Admin undoes the only approved attempt → mosque drops back to Missing (or In review if others are pending), leaderboard loses the credit (Task 3 test).
3. Mosque with no coords → still reachable from Board and Grid; card shows "No map location"; Directions falls back to name + address search (Task 7/8 tests).
4. User denies location on "Nearest" sort → list stays A to Z with an inline "Location unavailable" note, no crash (Task 8 test).
5. Deep link `?m=` to a removed id (e.g. 99) or junk → ignored, Map view renders with nothing selected (Task 7 test).

---

### Task 1: `quest_attempts` table, migration and backfill

**Files:**
- Create: `db/quest_attempts.ts`
- Modify: `db/schema.ts` (export), `db/quest_mosques.ts` (relation `attempts: many(questAttempts)`)
- Create: `db/migrations/0012_quest_attempts.sql` (generated, then hand-append backfill)

**Interfaces:**
- Produces:
  - `questAttemptKinds = ["new", "existing"] as const`, `QuestAttemptKind`
  - `questAttemptStatuses = ["pending", "approved", "rejected"] as const`, `QuestAttemptStatus`
  - `questAttempts` table: `id serial pk`, `questMosqueId integer not null → quest_mosques.id on delete cascade`, `userId text null → users.id`, `institutionId integer not null → institutions.id on delete cascade`, `kind varchar(20) $type<QuestAttemptKind>`, `status varchar(20) $type<QuestAttemptStatus> default 'pending'`, `reviewedBy text null → users.id`, `reviewedAt timestamp null`, `...timestamps`
  - Indexes: `quest_attempts_mosque_idx (quest_mosque_id)`, `quest_attempts_institution_idx (institution_id)`, unique `quest_attempts_mosque_institution_uq (quest_mosque_id, institution_id)`
  - Types `QuestAttempt`, `NewQuestAttempt` via `$inferSelect` / `$inferInsert`

- [ ] **Step 1:** Write `db/quest_attempts.ts` with the columns above, following `db/claim_requests.ts` for tuple-constant style.
- [ ] **Step 2:** Run `bunx drizzle-kit generate --name quest_attempts`. Expected: new `db/migrations/0012_quest_attempts.sql` and snapshot. It only diffs schema, no DB writes.
- [ ] **Step 3:** Append the backfill to the generated SQL, after a `--> statement-breakpoint`:

```sql
INSERT INTO "quest_attempts" ("quest_mosque_id", "user_id", "institution_id", "kind", "status", "reviewed_at", "created_at")
SELECT qm."id", i."contributor_id", i."id", 'new', 'approved', i."reviewed_at", i."created_at"
FROM "quest_mosques" qm JOIN "institutions" i ON i."id" = qm."institution_id"
WHERE i."status" = 'approved'
ON CONFLICT DO NOTHING;
```

- [ ] **Step 4:** Run `bun run type-check`. Expected: pass.
- [ ] **Step 5:** Commit `feat(quest): add quest_attempts table`. Do not apply the migration; Task 12 asks the user.

### Task 2: Pure quest rules

**Files:**
- Create: `lib/features/quest/rules.ts`
- Test: `lib/features/quest/rules.test.ts`

**Interfaces:**
- Produces:
  - `type QuestStatus = "missing" | "in_review" | "has_qr"`
  - `deriveQuestStatus(input: { linkedInstitutionStatus: "approved" | "pending" | "rejected" | null; pendingAttempts: number }): QuestStatus`
  - `type LinkCandidate = { institutionId: number; attemptStatus: QuestAttemptStatus; institutionStatus: string; createdAt: Date }`
  - `resolveQuestLink(currentInstitutionId: number | null, candidates: LinkCandidate[]): number | null`
  - `classifyQuestQr(input: { duplicate: { existingInstitution?: ExistingInstitution } | null; linkedToQuestMosqueId: number | null }): { kind: "new" } | { kind: "existing"; institutionId: number } | { kind: "blocked" }`

- [ ] **Step 1: Write failing tests** (`bun:test`):

```ts
test("has_qr only when linked listing is approved", () => {
  expect(deriveQuestStatus({ linkedInstitutionStatus: "approved", pendingAttempts: 3 })).toBe("has_qr");
  expect(deriveQuestStatus({ linkedInstitutionStatus: "rejected", pendingAttempts: 0 })).toBe("missing");
  expect(deriveQuestStatus({ linkedInstitutionStatus: null, pendingAttempts: 2 })).toBe("in_review");
});
test("keeps current link while it is still valid", () => {
  expect(resolveQuestLink(10, [c(5, "approved", "approved", t1), c(10, "approved", "approved", t2)])).toBe(10);
});
test("relinks to earliest valid attempt when current is invalid", () => {
  expect(resolveQuestLink(10, [c(10, "rejected", "rejected", t1), c(7, "approved", "approved", t3), c(6, "approved", "approved", t2)])).toBe(6);
});
test("unlinks when nothing valid", () => {
  expect(resolveQuestLink(10, [c(10, "approved", "rejected", t1), c(8, "pending", "pending", t2)])).toBeNull();
});
test("classifies QR", () => {
  expect(classifyQuestQr({ duplicate: null, linkedToQuestMosqueId: null })).toEqual({ kind: "new" });
  expect(classifyQuestQr({ duplicate: { existingInstitution: { id: 4, status: "approved", name: "x", url: "u" } }, linkedToQuestMosqueId: null })).toEqual({ kind: "existing", institutionId: 4 });
  expect(classifyQuestQr({ duplicate: { existingInstitution: { id: 4, status: "approved", name: "x", url: "u" } }, linkedToQuestMosqueId: 9 })).toEqual({ kind: "blocked" });
  expect(classifyQuestQr({ duplicate: { existingInstitution: { id: 4, status: "pending" } }, linkedToQuestMosqueId: null })).toEqual({ kind: "blocked" });
  expect(classifyQuestQr({ duplicate: {}, linkedToQuestMosqueId: null })).toEqual({ kind: "blocked" });
});
```

(`c` is a local helper building a `LinkCandidate`; `t1 < t2 < t3`.)

- [ ] **Step 2:** `bun test lib/features/quest/rules.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement the three functions. A candidate is valid when `attemptStatus === "approved" && institutionStatus === "approved"`. Current link is kept if it matches a valid candidate; else earliest valid by `createdAt`, tie by lower `institutionId`.
- [ ] **Step 4:** Re-run → PASS.
- [ ] **Step 5:** Commit `feat(quest): add quest status and link rules`.

### Task 3: Link sync wired into every review path

**Files:**
- Create: `lib/features/quest/sync.ts`
- Modify: `lib/features/institution-review/review.ts` (store approve/reject ~L243-251, `undoInstitutionReview` ~L96, `undoInstitutionApprovals` ~L345-378), `app/(admin)/admin/institutions/_lib/actions.ts` (`undoApproval` L212-257)
- Test: `lib/features/quest/sync.test.ts` (opt-in DB)

**Interfaces:**
- Consumes: `resolveQuestLink`, `LinkCandidate` (Task 2), `questAttempts` (Task 1)
- Produces:
  - `type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]`
  - `syncQuestForInstitutions(tx: DbOrTx, institutionIds: number[]): Promise<number[]>` mirrors `kind = 'new'` attempt status from `institutions.status` for those ids, then recomputes links for every affected mosque (from attempts and from current `quest_mosques.institution_id`). Returns affected mosque ids.
  - `syncQuestMosques(tx: DbOrTx, questMosqueIds: number[]): Promise<void>` recomputes the link for each mosque via `resolveQuestLink`, one batched candidate query.

- [ ] **Step 1: Write failing DB tests** (guarded, seed users/institutions/quest_mosques/attempts on loopback DB):
  - `approve new attempt links mosque`: pending institution + pending `new` attempt → set institution approved → `syncQuestForInstitutions` → mosque `institution_id` = it, attempt `approved`.
  - `second approval does not steal link`: mosque linked to A; approve B → link still A.
  - `undo only approval unlinks` (Review Focus 2): linked A, set A rejected → sync → link null, attempt rejected.
  - `undo relinks to other approved attempt`: A linked, B approved later; reject A → link B.
- [ ] **Step 2:** `QUEST_LOCAL_TESTS=true bun test lib/features/quest/sync.test.ts` against a local DB → FAIL. Without the flag → skipped.
- [ ] **Step 3:** Implement `sync.ts`.
- [ ] **Step 4:** Replace the three inline `update(questMosques).set({ institutionId: null })` blocks in `review.ts` with `await syncQuestForInstitutions(tx, ids)` for both decisions. Add the same call to `undoInstitutionReview` after the revert, and to `undoApproval` (wrap its update + sync in `db.transaction`). Add `revalidateTag("quest-mosques", "max")` to `runReviewSideEffects` and `undoApproval`.
- [ ] **Step 5:** Re-run DB tests → PASS; `bun test` → existing suites still pass; `bun run type-check` → pass.
- [ ] **Step 6:** Commit `feat(quest): sync quest links on review and undo`.

### Task 4: Quest queries

**Files:**
- Modify: `app/quest/_lib/queries.ts`, `app/quest/_lib/types.ts`

**Interfaces:**
- Consumes: `deriveQuestStatus`, `QuestStatus` (Task 2)
- Produces:

```ts
export type QuestMosqueView = {
  id: number; name: string; address: string | null; coords: [number, number] | null;
  status: QuestStatus; pendingAttempts: number;
  institutionSlug: string | null; institutionCategory: string | null;   // has_qr only
  qrContent: string | null; supportedPayment: PaymentOption[] | null;   // has_qr only
  contributorName: string | null;                                       // has_qr only
};
export type QuestStats = { total: number; hasQr: number; inReview: number; missing: number; unmapped: number };
export type QuestLeaderboardEntry = { rank: number; userId: string; name: string | null; image: string | null; count: number };
getQuestMosques(): Promise<QuestMosqueView[]>
getQuestLeaderboard(): Promise<QuestLeaderboardEntry[]>
```

- [ ] **Step 1:** Rewrite `getQuestMosques` as one query: `quest_mosques` left join linked `institutions`, left join `users` on the linking attempt's `user_id`, plus a grouped subquery counting `quest_attempts` with `status = 'pending'` per mosque. Map through `deriveQuestStatus`; null out has_qr-only fields otherwise. Keep `unstable_cache` key `quest-mosques`, tag `quest-mosques`, revalidate 300.
- [ ] **Step 2:** Drop `getQuestStats`; the page derives `QuestStats` from the mosque list (one pass, no extra query).
- [ ] **Step 3:** Rewrite `getQuestLeaderboard`: count `quest_attempts` where `status = 'approved'`, `user_id is not null`, and `institution_id = quest_mosques.institution_id` for that mosque; group by user; top 10.
- [ ] **Step 4:** `bun run type-check` → fails only in `app/quest/_components/*` (fixed in Tasks 7 to 10). Leave `page.tsx` compiling by passing the new shapes.
- [ ] **Step 5:** Commit `feat(quest): query attempts and status per mosque`.

### Task 5: Quest submit action

**Files:**
- Create: `app/quest/_lib/schema.ts`
- Rewrite: `app/quest/_lib/actions.ts`
- Test: `app/quest/_lib/schema.test.ts`, `app/quest/_lib/actions.test.ts` (opt-in DB, only the transactional core)

**Interfaces:**
- Consumes: `findDuplicateQr`, `checkSubmissionRateLimit`, `decodeQrFromBuffer`, `classifyQuestQr` (Task 2), `DbOrTx` (Task 3)
- Produces:

```ts
export const questSubmitSchema: z.ZodType<{ questMosqueId: number; qrContent?: string; sourceUrl?: string }>;
export type QuestSubmitState =
  | { status: "idle" }
  | { status: "success"; kind: "new" | "existing" }
  | { status: "error"; message: string; cooldownEndsAt?: string; existingUrl?: string };
export async function submitQuestAttempt(prev: QuestSubmitState, formData: FormData): Promise<QuestSubmitState>;
export async function insertQuestAttempt(tx: DbOrTx, input: { questMosqueId: number; userId: string; kind: "new" | "existing"; institutionId: number }): Promise<"ok" | "has_qr" | "already_submitted">;
```

- [ ] **Step 1: Write failing tests:**
  - schema: `"12junk"` rejected, `"12"` → 12, `sourceUrl: "ftp://x"` rejected, empty `sourceUrl` → undefined.
  - DB (Review Focus 1): mosque linked to an approved listing → `insertQuestAttempt` returns `"has_qr"` and inserts nothing; same `(mosque, institution)` twice → `"already_submitted"`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `submitQuestAttempt` in this order: session (else `"Sign in to submit."`) → zod → mosque exists and not has_qr (else `"This mosque already has a QR."`) → `checkSubmissionRateLimit(userId, isAdmin)` → image required, ≤5MB, `image/*` → `decodeQrFromBuffer`, fall back to client `qrContent` → `findDuplicateQr` + look up which quest mosque (if any) the matched listing is linked to → `classifyQuestQr`. Then:
  - `blocked`: `"This QR is already on sedekah.je."` with `existingUrl` when approved.
  - `existing`: no upload; transaction with `insertQuestAttempt(kind "existing")`. Telegram notify is wired in Task 6.
  - `new`: upload to R2, transaction inserting the pending institution (same fields as today, `contributorRemarks` kept) + `insertQuestAttempt(kind "new")`; on failure delete the R2 object; then `notifyInstitutionSubmission`.
  - `insertQuestAttempt` locks only `quest_mosques` (`FOR UPDATE` on that table alone, no join), re-checks has_qr, inserts with `onConflictDoNothing` on the unique index.
  - Revalidate `quest-mosques`, `pending-institutions`, `institutions-count`, `user_contributions_count:${userId}`.
- [ ] **Step 4:** Run tests → PASS; type-check → pass for `_lib`.
- [ ] **Step 5:** Commit `feat(quest): accept parallel attempts until approved`.

### Task 6: Review "existing" attempts, and quest context on review cards

**Files:**
- Create: `app/(admin)/admin/quest/page.tsx`, `app/(admin)/admin/quest/_lib/actions.ts`, `app/(admin)/admin/quest/_lib/queries.ts`
- Modify: `lib/integrations/telegram/review-bot.ts` (add `notifyQuestAttempt`), `lib/integrations/telegram/review-ui.ts` (`TelegramReviewCandidate.quest`, `buildReviewCard`), `lib/integrations/telegram/review-repository.ts` (fill `quest`), admin nav where `claim-requests` is linked
- Test: `lib/integrations/telegram/review-ui.test.ts` (add case)

**Interfaces:**
- Consumes: `syncQuestMosques` (Task 3)
- Produces:
  - `reviewQuestAttempt(attemptId: number, decision: "approved" | "rejected"): Promise<void>` server action: `requireAdminSession`, only `kind = 'existing'` and `status = 'pending'`, sets status/reviewedBy/reviewedAt, `syncQuestMosques(tx, [mosqueId])`, revalidates `quest-mosques` and the admin page.
  - `notifyQuestAttempt(attemptId: number): Promise<boolean>`: plain text via `sendReviewText` to `TELEGRAM_CHAT_ID`: `Quest attempt: {mosque} → existing listing {name} ({url}). Review: {adminBase}/admin/quest`.
  - `TelegramReviewCandidate.quest?: { mosqueName: string; attempts: number }` rendered in `buildReviewCard` as `Quest: {mosqueName}, {attempts} attempts`.

- [ ] **Step 1:** Failing test in `review-ui.test.ts`: `buildReviewCard` with `quest: { mosqueName: "Masjid Al-Irsyad", attempts: 2 }` contains `Quest: Masjid Al-Irsyad, 2 attempts`; without `quest` contains no `Quest:` line.
- [ ] **Step 2:** Run → FAIL. Implement card line and repository fill (left join attempts by `institution_id`, count pending + approved for that mosque). Run → PASS.
- [ ] **Step 3:** Call `notifyQuestAttempt` from the `existing` branch of `submitQuestAttempt` (Task 5), errors logged not thrown. Build the admin page: table of pending `existing` attempts (mosque name + address, listing name + link, hunter name, submitted at) with Approve / Reject buttons calling `reviewQuestAttempt`. Follow `app/(admin)/admin/claim-requests/` structure. Add nav entry "Quest attempts".
- [ ] **Step 4:** `bun run type-check`, `bun test` → pass.
- [ ] **Step 5:** Commit `feat(quest): review attempts on existing listings`.

### Task 7: Page shell, URL state and mosque card

**Files:**
- Rewrite: `app/quest/page.tsx`, `app/quest/_components/quest-page-client.tsx`, `app/quest/_components/quest-header.tsx`, `app/quest/_components/quest-leaderboard.tsx` (restyle, sheet from header)
- Create: `app/quest/_components/quest-card.tsx`, `app/quest/_lib/url-state.ts`
- Delete: `quest-sidebar.tsx`, `quest-bottom-sheet.tsx`, `quest-mosque-detail.tsx`, `quest-mosque-list-item.tsx`
- Test: `app/quest/_lib/url-state.test.ts`

**Interfaces:**
- Consumes: `QuestMosqueView`, `QuestStats`, `QuestLeaderboardEntry` (Task 4)
- Produces:
  - `type QuestView = "map" | "board" | "grid"`
  - `parseQuestParams(params: { view?: string; m?: string }, ids: Set<number>): { view: QuestView; selectedId: number | null }`
  - `directionsUrl(m: Pick<QuestMosqueView, "name" | "address" | "coords">): string`: `https://www.google.com/maps/search/?api=1&query=` + `lat,lng` when coords, else encoded `name, address`
  - `<QuestCard mosque onClose />` used by every view
  - `QuestPageClient` props: `{ mosques; stats; leaderboard; initialView; initialSelectedId }`; children views receive `{ mosques; selectedId; onSelect(id: number | null) }`

- [ ] **Step 1: Failing tests** (Review Focus 5 and 3): `parseQuestParams({ view: "board", m: "41" }, ids{41})` → `{ view: "board", selectedId: 41 }`; `{ m: "99" }` with 99 absent → `{ view: "map", selectedId: null }`; `{ view: "x", m: "abc" }` → map, null. `directionsUrl` with coords → contains `query=3.1%2C101.5` (or `3.1,101.5`, pick one and assert it); without coords → contains encoded name.
- [ ] **Step 2:** Run → FAIL; implement `url-state.ts`; run → PASS.
- [ ] **Step 3:** `page.tsx` reads `searchParams`, fetches mosques + leaderboard, computes `QuestStats`, passes initial state. Metadata in English ("Mosque Quest", "Find the missing donation QR codes for mosques in Petaling.").
- [ ] **Step 4:** Shell: header (`Mosque Quest`, `Petaling`, `{hasQr}/{total} have QR`, 3px progress bar, Leaderboard button), segmented control Map / Board / Grid, `router.replace` keeping `?view=&m=` in sync (omit defaults). Map view loaded via the existing `next/dynamic` wrapper only when `view === "map"`.
- [ ] **Step 5:** `QuestCard`: name, address, status pill (`Has QR` emerald, `In review` amber, `Missing QR` neutral outline). Missing / In review: amber notice `"{n} submission(s) in review. You can still submit."` when n > 0, buttons `Submit QR` and `Directions`. Has QR: `QrCodeDisplay`, `Added by {name}` (omit line if null), link `View listing`. No coords: `No map location` under address. Mobile: fixed bottom panel max 40dvh, scrolls inside; desktop: right-side panel 360px.
- [ ] **Step 6:** `bun run check`, `bun run type-check` → pass.
- [ ] **Step 7:** Commit `feat(quest): new shell with view switcher and mosque card`.

### Task 8: Board and Grid views

**Files:**
- Create: `app/quest/_components/quest-board.tsx`, `app/quest/_components/quest-grid.tsx`, `app/quest/_lib/board.ts`
- Test: `app/quest/_lib/board.test.ts`

**Interfaces:**
- Produces: `filterAndSortMosques(mosques: QuestMosqueView[], opts: { query: string; status: QuestStatus | "all" | "unmapped"; sort: "az" | "nearest"; origin: [number, number] | null }): QuestMosqueView[]`

- [ ] **Step 1: Failing tests:** default order is missing → in_review → has_qr, then name; query matches name or address case-insensitively; `status: "unmapped"` returns only `coords === null`; `sort: "nearest"` with origin orders by haversine distance and puts unmapped last; `sort: "nearest"` with `origin: null` falls back to A to Z order (Review Focus 4).
- [ ] **Step 2:** Run → FAIL; implement; run → PASS.
- [ ] **Step 3:** Board: search input, status chips (All / Missing / In review / Has QR), sort select (A to Z / Nearest). Nearest calls `navigator.geolocation.getCurrentPosition` on select only; on error show `Location unavailable` and keep A to Z. Rows: name, area, right side `1 in review` (amber) or chevron; `No map location` when unmapped. Empty state: `No mosques match.` + `Clear filters` button.
- [ ] **Step 4:** Grid: all mosques as squares (8 columns mobile, more on desktop), coloured by status, legend underneath, tap selects and opens the card, `aria-label` = mosque name + status.
- [ ] **Step 5:** `bun run check`, type-check → pass.
- [ ] **Step 6:** Commit `feat(quest): add board and grid views`.

### Task 9: Map view restyle

**Files:**
- Rewrite: `app/quest/_components/quest-map-leaflet.tsx`; keep `quest-map.tsx` as the dynamic wrapper

**Interfaces:**
- Consumes: `{ mosques; selectedId; onSelect; statusFilter; onStatusFilterChange; onShowUnmapped }`

- [ ] **Step 1:** On mount fit bounds to `data/petaling-boundary.json`, boundary drawn as thin 1px line with near-transparent fill. Light, quiet tiles (CARTO Positron light / Dark Matter for dark theme, keep attribution).
- [ ] **Step 2:** Replace divIcon pins with `CircleMarker`s, radius 5 (8 when selected, with a soft halo): Has QR solid emerald, Missing white fill + dark stroke, In review solid amber. No clustering.
- [ ] **Step 3:** Bottom bar: legend chips with counts (`Has QR n`, `Missing n`, `In review n`) that toggle the status filter; line `{unmapped} mosques have no map location` + `View list` → switches to Board with `status: "unmapped"`.
- [ ] **Step 4:** On select, pan so the marker sits in the upper half of the visible map (offset by the card height on mobile). Remove the unused `bottomSheetOpen` prop.
- [ ] **Step 5:** `bun run check`, type-check → pass.
- [ ] **Step 6:** Commit `feat(quest): restyle map as overview with status dots`.

### Task 10: Contribute form

**Files:**
- Modify: `app/quest/_components/quest-contribute-form.tsx`

**Interfaces:**
- Consumes: `submitQuestAttempt`, `QuestSubmitState` (Task 5)

- [ ] **Step 1:** Switch to `useActionState(submitQuestAttempt, { status: "idle" })`. Keep browser decode as a fallback field `qrContent`.
- [ ] **Step 2:** English copy: title `Submit QR for {mosque}`, image field `QR photo`, optional `Source link`, button `Submit`. Success `new`: `Thanks. Your QR is in review.` Success `existing`: `Thanks. We'll check this matches the existing listing.` Errors render `message`; `existingUrl` renders `View existing listing`; `cooldownEndsAt` renders the existing `CooldownTimer`.
- [ ] **Step 3:** Signed-out: sign-in link `callbackURL` = `/quest?view={view}&m={id}` so the user returns to the same card.
- [ ] **Step 4:** `bun run check`, type-check → pass.
- [ ] **Step 5:** Commit `feat(quest): update submit form for attempts`.

### Task 11: Loading, error, seed guard, ignore

**Files:**
- Modify: `app/quest/loading.tsx` (mobile: header + segmented control + map placeholder skeleton), `app/quest/error.tsx` (English copy), `scripts/seed-quest-mosques.ts`, `.gitignore`

- [ ] **Step 1:** Seed: skip JAIS ids `433, 443, 444, 445` (removed duplicates) with a one-line comment explaining they duplicate other rows.
- [ ] **Step 2:** Add `.superpowers/` to `.gitignore`.
- [ ] **Step 3:** `bun run check`, type-check, `bun test` → pass.
- [ ] **Step 4:** Commit `chore(quest): english states and seed duplicate guard`. Commit the spec and plan in a separate `docs(quest): add rework spec and plan`.

### Task 12: Migrate, verify, ship

- [ ] **Step 1:** Ask the user before applying `0012_quest_attempts.sql` to the real DB, and with which command they normally migrate. After applying, run a read-only check: `quest_attempts` approved count equals linked mosque count (57 at time of writing, minus any listing not approved).
- [ ] **Step 2:** `bun run check && bun run type-check && bun test` → all pass.
- [ ] **Step 3:** `bun dev`, then use Playwright at 390×844: Map loads zoomed to Petaling with dots; tap a dot shows card and the dot stays visible; switch Board / Grid; `?m=99` renders Map with nothing selected; Nearest with location denied shows the note. Screenshot each for the user.
- [ ] **Step 4:** Ask the user before pushing or opening a PR.
