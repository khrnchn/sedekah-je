# User-Facing Features: Performance & UX Optimization Analysis

This document outlines key performance and user experience issues identified within the user-facing sections of the application (`app/(user)`), with a primary focus on improving the mobile experience.

---

## 1. Leaderboard Page (`/leaderboard`)

The leaderboard is a key engagement feature, but its data loading process is highly inefficient.

### 🔴 Finding 1: Sequential Database Queries (Waterfall)
- **File:** `app/(user)/leaderboard/_lib/queries.ts`
- **Issue:** The `getLeaderboardData` function executes five independent database queries sequentially (`await`). This creates a request waterfall, where each query waits for the previous one to complete, drastically increasing the total data fetching time.
- **Impact:** Slow page loads for the leaderboard, especially on mobile networks.
- **Solution:** Parallelize all independent database queries using `Promise.all`. This will allow the queries to run concurrently, reducing the total wait time to that of the single longest query.

### 🔴 Finding 2: N+1 Query for Contributor Details
- **File:** `app/(user)/leaderboard/_lib/queries.ts`
- **Issue:** After fetching the list of top contributor IDs, the code loops through this list and executes a separate database query for *each user* to retrieve their name and avatar. This is a classic N+1 query problem.
- **Impact:** Unnecessary database load and increased latency that scales with the number of contributors displayed. For the top 5, this means 1 query for the list + 5 queries for user details = 6 total queries.
- **Solution:**
    1. **JOIN Query:** The most efficient solution is to refactor the main query to `JOIN` the `institutions` table with the `users` table.
    2. **`inArray`:** Alternatively, fetch the list of top contributor IDs first, then fetch all required user details in a single second query using Drizzle's `inArray` operator.

---

## 2. My Contributions Page (`/my-contributions`)

This page is likely to become slow for active users over time.

### 🟡 Finding 3: Inefficient Stats Calculation
- **File:** `app/(user)/my-contributions/_lib/queries.ts`
- **Issue:** The `getMyContributions` function fetches all contribution records for a user and then calculates statistics (total, approved, pending) by filtering the array in JavaScript.
- **Impact:** High memory usage on the server and inefficient processing. The database is much better at counting and aggregating than the application server.
- **Solution:** Refactor the query to perform the aggregation directly in the database. This can be done with a single SQL query using conditional counts (e.g., `COUNT(*) FILTER (WHERE status = 'approved')`). This reduces the data transferred from the database and offloads the computation.

### 🔴 Finding 4: No Pagination for Contributions
- **File:** `app/(user)/my-contributions/_lib/queries.ts`
- **Issue:** The page fetches a user's *entire* contribution history in a single request. For power users with hundreds of contributions, this will lead to very slow page loads and a poor mobile experience.
- **Impact:** High data transfer, slow server response times, and high memory consumption on the client's device, potentially causing the browser to become unresponsive.
- **Solution:** Implement pagination.
    - **API:** Update `getMyContributions` to accept `limit` and `offset` (or a cursor) to fetch contributions in chunks.
    - **Frontend:** Modify the `ContributionList` component to support either infinite scrolling (preferred for mobile) or a "Load More" button to fetch and append the next page of results.

---

## 3. Contribution Form (`/contribute`)

The contribution form has potential client-side and server-side performance bottlenecks.

### 🟡 Finding 5: Redundant QR Code Processing
- **Files:** `hooks/use-qr-extraction.ts`, `app/(user)/contribute/_lib/submit-institution.ts`
- **Issue:** The QR code image is processed twice: once on the client-side for immediate feedback and then again on the server-side for validation.
- **Impact:** This is CPU-intensive and can drain battery on mobile devices. While server-side validation is non-negotiable for security, the double processing is redundant.
- **Solution:** Since server-side validation is mandatory, this isn't a critical flaw. However, for a better UX, we could consider sending the client-extracted QR content to the server. The server would still receive the image but would only run its own extraction logic if the provided content seems invalid or is missing. This maintains security while avoiding redundant work in the happy path.

### 🟡 Finding 6: Synchronous Geocoding in Server Action
- **File:** `app/(user)/contribute/_lib/submit-institution.ts`
- **Issue:** If GPS coordinates are not provided, the form submission process is blocked by a synchronous, blocking network call to an external geocoding service (`nominatim.openstreetmap.org`). This API call can be slow or time out.
- **Impact:** Users will experience a long, unexplained delay after hitting "Submit," which may lead them to believe the submission failed or to try submitting again.
- **Solution:** Decouple geocoding from the user request cycle.
    1. Immediately accept the user's submission and save the institution with a `geocoding_status` of `pending`.
    2. Use a background job (e.g., using a service like Inngest or Vercel Cron Jobs) to process pending institutions, call the geocoding API, and update the database record with the coordinates.
