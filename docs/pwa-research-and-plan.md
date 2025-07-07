# Progressive Web App (PWA) Research & Implementation Plan for SedekahJe

_Last updated: {{DATE}}_

---

## 1. Overview
SedekahJe currently runs as a standard Next.js application (App Router).
Turning it into a Progressive Web App (PWA) will allow users to:

1. Install the app to their home screen / dock.
2. Enjoy faster repeat visits thanks to offline-first caching.
3. Continue limited usage even with poor or no network connectivity.
4. Leverage platform capabilities such as **push notifications** and **background sync** (future scope).

## 2. Core PWA Requirements
| Requirement | Status | Notes |
|-------------|--------|-------|
| **HTTPS** | ✅ Already enforced via Vercel/Cloudflare | |
| **Web App Manifest** (`manifest.json`) | ❌ Not present | Needs icons, theme color, start_url, display mode, etc. |
| **Service Worker (SW)** | ❌ Not present | Handles caching & offline strategy. |
| **Caching Strategy** | ❌ | Determine what to cache (static assets, pages, API calls). |
| **Install Prompt** | ❌ | Browser handles automatically once manifest+SW served over HTTPS. |
| **App Shell / Offline Fallback** | ❌ | Provide fallback UI for offline navigation errors. |

## 3. Next.js-specific Findings
1. **next-pwa plugin (v5+)** supports Next.js 13/14 **App Router** via experimental `defaultRuntimeCaching`.
   - Generates & injects a Workbox-powered service worker at build time.
   - Supports custom runtime caching rules.
2. **next-manifest** or manual placement of `manifest.json` inside `public/` works fine.
3. Built-in Next.js images & static assets automatically get hashed filenames, ideal for long-term caching.
4. SW must live at the site root (`/service-worker.js`); next-pwa handles this by default.
5. For dynamic API routes (e.g. `/api/leaderboard`) we can opt-in cache strategies (NetworkFirst or StaleWhileRevalidate).
6. Vercel edge caching is separate; PWA caching runs in the browser and is complementary.

## 4. Implementation Plan
### Phase 1 – Minimal PWA (installable, offline shell)
1. **Install dependencies**
   ```bash
   bun add next-pwa workbox-webpack-plugin
   ```
2. **Configure plugin** – add to `next.config.mjs`:
   ```js
   import { withPWA } from "next-pwa";

   /** @type {import('next').NextConfig} */
   const nextConfig = {
     // existing config ...
     experimental: {
       appDir: true,
     },
     // PWA config
     pwa: {
       dest: "public", // service-worker output
       register: true,
       skipWaiting: true,
       runtimeCaching: [], // we will fill in Phase 2
     },
   };

   export default withPWA(nextConfig);
   ```
3. **Create `manifest.json`** in `public/` with:
   ```json
   {
     "name": "SedekahJe",
     "short_name": "SedekahJe",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#16a34a", // match design system primary
     "icons": [
       { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```
   > TODO: Generate & add the above icons (see asset checklist).
4. **Add meta tags** to `/app/layout.tsx` `<head>` section (theme-color etc.).
5. **Provide offline fallback** – create `app/offline.tsx` and update SW to serve it when navigation fails.
6. **Test** locally with `bun run dev` + Chrome DevTools > Lighthouse PWA audit.

### Phase 2 – Enhanced Caching & Performance
1. Define runtime caching rules:
   - Static assets: CacheFirst, max-age 1y.
   - API routes (`/api/leaderboard`, `/api/my-contributions`): StaleWhileRevalidate, max 1d.
   - Google Fonts / external assets: CacheFirst.
2. Add `runtimeCaching` array in `next.config.mjs` (see Workbox docs).
3. Tune SW size (remove unnecessary precache entries via `disable: [/.map$/, /manifest\.json$/]`).
4. Re-audit with Lighthouse; iterate until 90+ PWA score.

### Phase 3 – Optional Extras
1. **Push Notifications** – integrate Firebase Cloud Messaging for doa reminders.
2. **Background Sync** – queue failed contributions when offline & sync when online.
3. **Home Screen widgets (iOS 17)** – future research.

## 5. Asset Checklist
- [ ] 192×192 and 512×512 PNG icons (transparent background).
- [ ] Additional sizes: 1024×1024 (iOS splash), _maskable_ icon.
- [ ] Update `public/sedekahje-og.png` if needed.

## 6. Rollout Strategy
1. Deploy to **preview** branch, test installability on Android, iOS Safari, desktop Chrome.
2. Monitor error logs for SW issues.
3. Merge to production; announce PWA availability in release notes.

## 7. References
- Next.js + PWA: https://github.com/shadowwalker/next-pwa
- Workbox Recipes: https://developer.chrome.com/docs/workbox
- Web App Manifest: https://developer.mozilla.org/en-US/docs/Web/Manifest

---

> **TODO:** Track progress in this document and tick items above as tasks complete. 