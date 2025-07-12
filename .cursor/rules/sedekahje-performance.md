---
description: sedekahje performance and caching rules
globs:
alwaysApply: false
---

# Performance & Caching Rules - sedekah.je

These rules are based on the optimizations implemented in the admin dashboard. Following them will help maintain a fast and scalable application.

## 1. Data Caching with `unstable_cache`

All server-side data fetching functions (`_lib/queries.ts`) should be wrapped with `unstable_cache` to reduce database load and improve response times.

**Pattern:**
```typescript
import { unstable_cache } from "next/cache";
import { db } from "@/db";

export const getCachedData = unstable_cache(
  async () => {
    // Your database query here
    return await db.select().from(users);
  },
  ["unique-cache-key"], // A unique key for this cache entry
  {
    revalidate: 300, // Time in seconds (TTL). E.g., 300s = 5 minutes
    tags: ["tag1", "tag2"], // Tags for granular revalidation
  }
);
```

**Guidelines:**
- **Unique Keys:** Always provide a unique, descriptive key for the cache entry.
- **TTL (`revalidate`):**
    - Use shorter TTLs (e.g., `300` seconds) for data that changes frequently (e.g., pending institutions list).
    - Use longer TTLs (e.g., `900` seconds) for more stable data (e.g., approved/rejected lists).
- **Tags:** Use specific tags to allow for on-demand, granular cache invalidation.

## 2. UI Streaming with Server Components & Suspense

To improve perceived performance, stream complex pages by breaking them into smaller, independent async components and wrapping them in `<Suspense>` boundaries. This avoids monolithic components that block rendering until all data is fetched.

**Pattern:**

**a. Create async components for each section:**
```typescript
// app/feature/_components/async-components.tsx
import { getSomeData } from "../_lib/queries";
import { UiComponent } from "./ui-component";

export async function AsyncComponent() {
  const data = await getSomeData();
  return <UiComponent data={data} />;
}
```

**b. Use Suspense in the page component:**
```typescript
// app/feature/page.tsx
import { Suspense } from "react";
import { AsyncComponent } from "./_components/async-components";
import { LoadingSkeleton } from "./_components/loading-skeletons";

export default function FeaturePage() {
  return (
    <div>
      {/* Other content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <AsyncComponent />
      </Suspense>
    </div>
  );
}
```

## 3. Efficient Database Queries

### Batch Operations
For bulk updates or deletes, use a single query with `inArray` from Drizzle instead of running multiple queries in a loop (`Promise.all`).

**Example:**
```typescript
// Good: Single batch update
await db
  .update(institutions)
  .set({ status: "approved" })
  .where(inArray(institutions.id, ids));

// Bad: Multiple individual updates
await Promise.all(
  ids.map(id => 
    db.update(institutions).set({ status: "approved" }).where(eq(institutions.id, id))
  )
);
```

### Counting Records
To count records, use the Drizzle `count()` function, which translates to an efficient SQL `COUNT()`. Avoid fetching all records and using `.length` in JavaScript.

**Example:**
```typescript
// Good: Efficient SQL count
const [result] = await db
  .select({ count: count() })
  .from(institutions)
  .where(eq(institutions.status, "pending"));
return result.count;

// Bad: Inefficiently fetching all data
const results = await db
  .select({ id: institutions.id })
  .from(institutions)
  .where(eq(institutions.status, "pending"));
return results.length;
```

## 4. Cache Invalidation Strategy

Use `revalidateTag` for on-demand invalidation. This is more efficient and targeted than `revalidatePath`.

**Pattern:**
- Invalidate specific tags after a mutation.
- This ensures only the relevant cached data is refetched.

```typescript
// In a server action after an institution is approved
import { revalidateTag } from "next/cache";

// ... database update logic ...

// Invalidate only the caches related to pending and approved institutions
revalidateTag("pending-institutions");
revalidateTag("approved-institutions");
``` 