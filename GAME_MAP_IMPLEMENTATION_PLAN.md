 Mosque Quest - Phase 0 Implementation Plan

 Context

 Mosque Quest is a map-based discovery feature for sedekah.je. Users explore mosques in the Petaling district on a dark-themed interactive map, see which ones already have QR codes in
 Sedekahje (unlocked/green) vs those that don't yet (locked/grey). Phase 0 is read-only discovery — no contribution flow or gamification yet.

 Scope

 - New quest_mosques DB table seeded from JAIS data (user handles scraping separately)
 - New /quest route with dark map + mosque list
 - Desktop: sidebar + map. Mobile: full-screen map + vaul Drawer bottom sheet
 - Pin states: green (unlocked/linked to institution), grey (locked/JAIS only)
 - Detail card on marker click with mosque info and status

 Key Decisions

 - Route at app/quest/ (NOT under (user)/ — that requires auth, quest should be public, but to contribute you need to login)
 - Dark map tiles: CartoDB Dark Matter (just a tile URL, no new deps)
 - CircleMarker instead of icon markers for full color control
 - vaul Drawer (already installed) for mobile bottom sheet instead of Sheet
 - use-media-query hook already exists at hooks/use-media-query.tsx
 - Points calculated on the fly in Phase 2 (no points table needed)

 ---
 Files to Create/Modify

 1. Database Schema

 Create db/quest_mosques.ts
 - Table: quest_mosques with fields: id (serial PK), name (varchar 255), address (text, nullable), district (varchar 100), jaisId (varchar 50, unique), coords (jsonb [lat, lng],
 nullable), institutionId (integer FK to institutions, nullable), timestamps
 - Relations: one(institutions) via institutionId
 - Export types: QuestMosque, NewQuestMosque
 - Follow pattern from db/ramadhan_campaigns.ts

 Modify db/schema.ts — add export * from "./quest_mosques"

 Run migration — bunx drizzle-kit generate && bunx drizzle-kit push

 2. Seed Script

 Create scripts/seed-quest-mosques.ts
 - Skeleton script with onConflictDoNothing on jaisId for idempotent seeding
 - User fills in JAIS data array later
 - Add "db:seed-quest" script to package.json

 3. Quest Route Structure

 app/quest/
 ├── page.tsx                          # Server component - fetches data
 ├── loading.tsx                       # Loading skeleton
 ├── _lib/
 │   ├── types.ts                      # QuestMosqueWithStatus, sort options
 │   └── queries.ts                    # getQuestMosques(), getQuestStats()
 └── _components/
     ├── quest-page-client.tsx          # Layout orchestrator (desktop/mobile)
     ├── quest-map.tsx                  # Dynamic import wrapper
     ├── quest-map-leaflet.tsx          # Actual Leaflet map (dark tiles, circle markers)
     ├── quest-header.tsx               # Top bar with progress
     ├── quest-sidebar.tsx              # Desktop left panel with mosque list
     ├── quest-bottom-sheet.tsx         # Mobile vaul Drawer
     ├── quest-mosque-list-item.tsx     # Reusable list row
     └── quest-mosque-detail.tsx        # Floating detail card on map

 4. Server Query (app/quest/_lib/queries.ts)

 - getQuestMosques(): left join quest_mosques with institutions, return with isUnlocked boolean and institution slug/category
 - getQuestStats(): total count and unlocked count
 - Cached with unstable_cache, tag "quest-mosques", 300s revalidation
 - Pattern: app/ramadhan/_lib/queries.ts

 5. Types (app/quest/_lib/types.ts)

 - QuestMosqueWithStatus = QuestMosque + { isUnlocked, institutionSlug, institutionCategory }
 - QuestSortOption = "alphabetical" | "status"

 6. Page Components

 page.tsx — Server component, fetches mosques + stats, renders QuestPageClient

 quest-page-client.tsx — Client layout orchestrator:
 - Uses useMediaQuery for desktop/mobile switch
 - State: selectedId, sort, sheetOpen
 - Desktop: QuestHeader + QuestSidebar + QuestMap + QuestMosqueDetail
 - Mobile: QuestHeader + QuestMap + QuestMosqueDetail + QuestBottomSheet

 quest-map.tsx — Dynamic import wrapper (SSR disabled) for quest-map-leaflet

 quest-map-leaflet.tsx — Core Leaflet component:
 - Dark tiles: https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
 - CircleMarker for each mosque (green=#22c55e unlocked, grey=#71717a locked, yellow=#eab308 selected)
 - FlyToSelected subcomponent using useMap() hook
 - Center on Petaling: ~[3.1, 101.65], zoom 12
 - Tooltip on hover with mosque name
 - Import order matches existing components/map.tsx pattern

 quest-header.tsx — Compact dark header bar:
 - "Mosque Quest" title + "Petaling" badge
 - Progress: "X/Y masjid" + progress bar (green on zinc-800)

 quest-sidebar.tsx — Desktop only (w-80):
 - Sort dropdown (A-Z / Status)
 - ScrollArea with mosque list items

 quest-bottom-sheet.tsx — Mobile only, uses vaul Drawer:
 - Floating trigger button at bottom of map
 - Drawer opens from bottom (70dvh height)
 - Same sort + list content as sidebar

 quest-mosque-list-item.tsx — Reusable row:
 - Lock/Unlock icon + mosque name + address
 - Green text for unlocked, zinc/muted for locked
 - Selected state with ring highlight

 quest-mosque-detail.tsx — Floating card overlay on map:
 - Appears at bottom of map viewport
 - Mosque name, address, status badge
 - Unlocked: green "Tersedia" badge + "Lihat QR" link to institution page
 - Locked: grey "Belum tersedia" badge
 - Close button
 - Framer Motion enter/exit animation

 7. Dark Theme CSS

 - Add small Leaflet control overrides for dark theme (zoom buttons, attribution)
 - Either inline styles or a quest-specific CSS block

 ---
 Existing Code to Reuse

 - db/ramadhan_campaigns.ts — schema pattern (FK to institutions, relations, type exports)
 - components/map.tsx — Leaflet import order, useMap patterns
 - components/custom-map.tsx — dynamic import pattern
 - components/ui/drawer.tsx (vaul) — mobile bottom sheet
 - components/ui/badge.tsx, card.tsx, scroll-area.tsx, select.tsx
 - hooks/use-media-query.tsx — already exists
 - app/ramadhan/_lib/queries.ts — unstable_cache with left join pattern

 No New Dependencies

 Everything needed is already installed: react-leaflet, leaflet, vaul, framer-motion, lucide-react.

 ---
 Implementation Order (Progress)

 1. [x] db/quest_mosques.ts + update db/schema.ts
 2. [x] Generate & push migration
 3. [x] scripts/seed-quest-mosques.ts + package.json script
 4. [x] app/quest/_lib/types.ts
 5. [x] app/quest/_lib/queries.ts
 6. [x] app/quest/loading.tsx
 7. [x] app/quest/_components/quest-map-leaflet.tsx
 8. [x] app/quest/_components/quest-map.tsx
 9. [x] app/quest/_components/quest-mosque-list-item.tsx
 10. [x] app/quest/_components/quest-header.tsx
 11. [x] app/quest/_components/quest-sidebar.tsx
 12. [x] app/quest/_components/quest-bottom-sheet.tsx
 13. [x] app/quest/_components/quest-mosque-detail.tsx
 14. [x] app/quest/_components/quest-page-client.tsx
 15. [x] app/quest/page.tsx
 16. [ ] bun run check — verify lint/format

 Verification (Not run yet)

 1. bun run type-check — no TypeScript errors
 2. bun run check — Biome lint + format passes
 3. bun dev → navigate to /quest — dark map renders centered on Petaling
 4. Empty state: map loads with no markers (no seed data yet), header shows 0/0
 5. After seeding test data: grey markers appear, clicking shows detail card with "Belum tersedia"
 6. If any quest mosque has institutionId linked to an approved institution: green marker, "Tersedia" badge, "Lihat QR" link works
 7. Mobile viewport: bottom sheet trigger visible, drawer opens with mosque list
 8. Desktop viewport: sidebar visible with mosque list, selecting item highlights marker on map
