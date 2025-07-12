# User Features Performance Optimization Plan

**Status:** Planning Complete  
**Started:** July 12, 2025  
**Target Completion:** August 2, 2025  
**Focus:** Mobile-first user experience optimization

## Phase 1: Critical Performance Fixes (High Impact) =�

### [x] 1. Implement Server-Side Caching for User Queries
**Files:** 
- `app/(user)/my-contributions/_lib/queries.ts:29-63`
- `app/(user)/leaderboard/_lib/queries.ts:26-131`

**Issue:** Complete absence of `unstable_cache` for user-facing queries causing every page load to hit database  
**Impact:** 4-5x performance improvement for all user pages, especially on mobile 3G/4G  
**Estimated Time:** 3 hours

**Tasks:**
- [x] Wrap `getMyContributions()` with `unstable_cache`
- [x] Wrap `getLeaderboardData()` with `unstable_cache`
- [x] Use user-specific cache keys to prevent data leakage
- [x] Set appropriate TTL (300-600 seconds for user data)
- [x] Add cache tags for selective invalidation (`user-contributions`, `leaderboard`)
- [x] Test cache invalidation when users submit new contributions
- [x] Verify cache isolation between different users

### [x] 2. Fix Leaderboard N+1 Query Pattern
**File:** `app/(user)/leaderboard/_lib/queries.ts:93-120`  
**Issue:** Individual database query for each top contributor (1 + N pattern = 6 total queries)  
**Impact:** 70% reduction in leaderboard load time, critical for mobile users  
**Estimated Time:** 2.5 hours

**Tasks:**
- [x] Replace `Promise.all` user lookups with single JOIN query
- [x] Combine contributor stats and user details in one database call
- [x] Update TypeScript types for new joined data structure
- [x] Test query performance with different contributor counts
- [x] Update `LeaderboardContent` component to handle new data structure
- [x] Add database indexes if needed for JOIN performance

### [x] 3. Optimize Leaderboard Stats Calculation
**File:** `app/(user)/leaderboard/_lib/queries.ts:26-78`  
**Issue:** 4 separate count queries creating unnecessary database round trips  
**Impact:** Single optimized query reduces database load by 75%  
**Estimated Time:** 2 hours

**Tasks:**
- [x] Combine all stats queries into single aggregated query
- [x] Use conditional counting with `CASE WHEN` for different metrics
- [x] Update return type for combined `LeaderboardStats`
- [x] Test query performance vs individual queries
- [x] Update stats display components for new data structure
- [x] Ensure parallel execution with contributor query using `Promise.all`

### [x] 4. Implement My Contributions Database Aggregation
**File:** `app/(user)/my-contributions/_lib/queries.ts:45-52`  
**Issue:** Fetching all records then calculating stats in JavaScript  
**Impact:** Reduced memory usage and faster stats calculation  
**Estimated Time:** 2 hours

**Tasks:**
- [x] Replace JavaScript filtering with SQL conditional counting
- [x] Use `COUNT(*) FILTER (WHERE status = 'approved')` pattern
- [x] Update `MyContributionsStats` calculation to be database-driven
- [x] Test stats accuracy vs current JavaScript approach
- [ ] Optimize query with proper indexes on status column
- [x] Maintain backward compatibility during transition

## Phase 2: Mobile UX Enhancement (User Experience) =

### [ ] 5. Add Progressive Loading to User Pages
**Files:**
- `app/(user)/my-contributions/page.tsx`
- `app/(user)/leaderboard/page.tsx`

**Issue:** Blocking page render until all data loads, causing blank screens on mobile  
**Impact:** Immediate perceived performance improvement, better mobile experience  
**Estimated Time:** 4 hours

**Tasks:**
- [ ] Create `AsyncMyContributionsStats` component
- [ ] Create `AsyncContributionList` component  
- [ ] Create `AsyncLeaderboardStats` component
- [ ] Create `AsyncTopContributors` component
- [ ] Wrap each async component in `<Suspense>` boundaries
- [ ] Design mobile-optimized loading skeletons for each section
- [ ] Test streaming behavior on slow 3G connections
- [ ] Ensure graceful error boundaries for failed data loads

### [ ] 6. Optimize Contribution Form for Mobile
**File:** `app/(user)/contribute/_components/institution-form.tsx`  
**Issue:** Heavy form bundle with QR extraction and location services loaded upfront  
**Impact:** 3x faster mobile form loading, reduced JavaScript bundle  
**Estimated Time:** 5 hours

**Tasks:**
- [ ] Create lazy-loaded `QRExtractionFeature` component
- [ ] Create lazy-loaded `LocationServicesFeature` component
- [ ] Implement dynamic imports for heavy dependencies (sharp, jsQR)
- [ ] Add progressive enhancement for form features
- [ ] Create mobile-optimized form field layout
- [ ] Implement touch-friendly file upload for QR images
- [ ] Test form performance on low-end mobile devices
- [ ] Add loading states for lazy-loaded features

### [ ] 7. Implement My Contributions Pagination
**File:** `app/(user)/my-contributions/_lib/queries.ts`  
**Issue:** Fetching entire user contribution history will fail for active users  
**Impact:** Consistent performance regardless of user contribution count  
**Estimated Time:** 4 hours

**Tasks:**
- [ ] Add `limit` and `offset` parameters to `getMyContributions()`
- [ ] Implement infinite scroll pagination for mobile
- [ ] Update contribution list component for incremental loading
- [ ] Add "Load More" fallback for users without JavaScript
- [ ] Optimize database query with proper pagination indexes
- [ ] Test with users having 100+ contributions
- [ ] Implement optimistic loading states

### [ ] 8. Enhance Service Worker for Better Offline Support
**File:** `public/sw.js`  
**Issue:** Minimal caching strategy limiting PWA experience  
**Impact:** Better offline functionality for mobile users  
**Estimated Time:** 3 hours

**Tasks:**
- [ ] Cache user contribution data in IndexedDB
- [ ] Implement offline indicators for user pages
- [ ] Add background sync for form submissions
- [ ] Cache critical user assets (icons, styles)
- [ ] Create offline fallback pages for user routes
- [ ] Test offline behavior on mobile devices
- [ ] Add cache versioning and cleanup strategies

## Phase 3: Advanced Mobile Optimizations (Modern Features) =

### [ ] 9. Implement Client-Side Request Deduplication
**Files:** User page components  
**Issue:** Multiple components triggering same queries causing redundant requests  
**Impact:** Reduced mobile data usage and improved battery life  
**Estimated Time:** 3 hours

**Tasks:**
- [ ] Integrate TanStack Query for client-side caching
- [ ] Configure query deduplication for user data
- [ ] Implement stale-while-revalidate strategy
- [ ] Add optimistic updates for form submissions
- [ ] Set up query invalidation patterns
- [ ] Test with multiple simultaneous page loads
- [ ] Monitor network request reduction

### [ ] 10. Optimize Form Submission with Background Processing
**File:** `app/(user)/contribute/_lib/submit-institution.ts:95-128`  
**Issue:** Synchronous geocoding blocking form submission  
**Impact:** Non-blocking form submissions, better mobile UX  
**Estimated Time:** 4 hours

**Tasks:**
- [ ] Decouple geocoding from form submission flow
- [ ] Accept submissions immediately with `geocoding_status: 'pending'`
- [ ] Implement background job for geocoding processing
- [ ] Add job queue using Vercel Cron or similar
- [ ] Update admin interface to show geocoding status
- [ ] Implement retry logic for failed geocoding
- [ ] Add user notifications for processing completion

### [ ] 11. Implement Image Optimization for Mobile
**Files:** QR image handling  
**Issue:** QR images not optimized for mobile viewing and data usage  
**Impact:** Faster image loads and reduced mobile data consumption  
**Estimated Time:** 3 hours

**Tasks:**
- [ ] Add WebP/AVIF conversion for uploaded QR codes
- [ ] Implement responsive image sizing for mobile displays
- [ ] Create image compression pipeline for user uploads
- [ ] Add lazy loading for QR images in lists
- [ ] Implement progressive image loading
- [ ] Test image optimization across different mobile screens
- [ ] Monitor image load performance improvements

### [ ] 12. Add Mobile Navigation Optimization
**File:** `app/(user)/_components/nav.tsx`  
**Issue:** No route prefetching causing navigation delays  
**Impact:** Faster navigation between user pages  
**Estimated Time:** 2 hours

**Tasks:**
- [ ] Implement route prefetching for main user pages
- [ ] Add preload hints for critical user resources
- [ ] Optimize drawer animation performance
- [ ] Implement swipe gestures for mobile navigation
- [ ] Add haptic feedback for mobile interactions
- [ ] Test navigation performance on older mobile devices

## Success Metrics =�

**Target Performance Improvements:**
- My Contributions load time: 800ms � 200ms (4x improvement)
- Leaderboard load time: 600ms � 150ms (4x improvement)
- Form initial load: 1.2s � 400ms (3x improvement)
- Contribution form submission: 3s � 1s (3x improvement)
- Cache hit rate: 0% � 70%+ for repeat visits

**Mobile Experience Metrics:**
- Core Web Vitals LCP: < 2.5s on 3G networks
- First Input Delay: < 100ms on mobile devices
- Cumulative Layout Shift: < 0.1 for all user pages
- Time to Interactive: < 3s on slow mobile connections

**Database Efficiency:**
- Leaderboard queries: 6 � 2 database calls (70% reduction)
- My Contributions queries: All records � Paginated chunks
- Stats calculations: JavaScript � SQL aggregation
- Overall query reduction: 60%+ across user pages

**User Engagement Targets:**
- Mobile bounce rate reduction: 15%+
- Form completion rate increase: 20%+
- Page transition speed improvement: 3x faster
- Offline usage capability: Basic functionality without network

## Implementation Strategy =�

**Week 1 (Critical Path):**
- Focus on server-side caching and database optimization
- Maximum impact with lowest implementation risk
- Establish performance monitoring baseline

**Week 2 (Mobile UX):**
- Progressive loading and form optimization
- Direct user experience improvements
- Mobile-specific testing and optimization

**Week 3 (Advanced Features):**
- Modern web app capabilities
- Request optimization and background processing
- Performance fine-tuning and monitoring

**Mobile Testing Approach:**
- Use real device testing with network throttling
- Test on low-end Android devices (common in Malaysia)
- Validate on slow 3G and intermittent connections
- Monitor Core Web Vitals throughout implementation

**Risk Mitigation:**
- Implement changes incrementally with feature flags
- Maintain backward compatibility during transitions
- Test each optimization with mobile device lab
- Set up performance monitoring before deployment
- Plan rollback strategy for each major change

**Cache Strategy:**
- User-specific cache keys prevent data leakage
- Short TTL (300-600s) balances performance vs freshness
- Selective invalidation using cache tags
- Monitor cache hit rates and adjust TTL accordingly

## Review Points =�

**After Phase 1:**
- [ ] Measure server-side caching impact on page load times
- [ ] Validate database query reduction and performance gains
- [ ] Confirm mobile load time improvements

**After Phase 2:**
- [ ] Test progressive loading experience on various mobile devices
- [ ] Validate form optimization impact on mobile conversion rates
- [ ] Confirm pagination works smoothly with large datasets

**After Phase 3:**
- [ ] Measure overall mobile experience improvements
- [ ] Validate offline capabilities and PWA functionality
- [ ] Confirm all success metrics are achieved

---

**Last Updated:** July 12, 2025  
**Next Review:** After each phase completion  
**Mobile Context:** Optimized for Malaysia's mobile-first user base with varying network conditions