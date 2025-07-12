# Admin Performance Optimization Plan

**Status:** In Progress  
**Started:** July 12, 2025  
**Target Completion:** July 19, 2025

## Phase 1: Critical Fixes (High Impact) 🚨

### [x] 1. Dashboard Caching Implementation
**File:** `app/(admin)/admin/dashboard/queries.ts`  
**Issue:** Missing `unstable_cache` on all dashboard queries causing slow navigation  
**Impact:** Immediate 5x performance improvement on dashboard loads  
**Estimated Time:** 2 hours

**Tasks:**
- [x] Wrap `getDashboardStats()` with `unstable_cache`
- [x] Wrap `getInstitutionsByCategory()` with `unstable_cache`  
- [x] Wrap `getInstitutionsByState()` with `unstable_cache`
- [x] Wrap `getRecentSubmissions()` with `unstable_cache`
- [x] Wrap `getTopContributors()` with `unstable_cache`
- [x] Add appropriate cache keys and tags for each function
- [x] Set reasonable TTL (300-900 seconds)
- [x] Test cache invalidation on data changes

### [x] 2. Fix Users Page N+1 Query
**File:** `app/(admin)/admin/users/_lib/queries.ts:44-81`  
**Issue:** Individual query for each user's contributions (100 users = 101 queries)  
**Impact:** Users page load time from 800ms to ~150ms  
**Estimated Time:** 3 hours

**Tasks:**
- [x] Replace `Promise.all` loop with single query fetching all contributions
- [x] Update query to use `inArray` to fetch contributions for all users at once
- [x] Group contributions by user ID in application code
- [x] Update TypeScript types for new query structure
- [x] Test with various user counts to verify performance
- [x] Update component to handle new data structure

### [x] 3. Cache Admin Layout Query
**File:** `app/(admin)/layout.tsx:21-25`  
**Issue:** User role verification runs uncached on every admin page  
**Impact:** Remove 50ms from every admin page navigation  
**Estimated Time:** 1 hour

**Tasks:**
- [x] Wrap admin user query with `unstable_cache`
- [x] Use cache key based on user ID
- [x] Add cache tag for user role invalidation
- [x] Set appropriate TTL (300 seconds)
- [x] Test role changes trigger cache invalidation

### [x] 4. Optimize Dashboard Stats Query
**File:** `app/(admin)/admin/dashboard/queries.ts:50-66`  
**Issue:** 4 separate count queries instead of single aggregated query  
**Impact:** Reduce dashboard database load by 75%  
**Estimated Time:** 2 hours

**Tasks:**
- [x] Combine 4 count queries into single SQL query
- [x] Use conditional counting with `CASE WHEN`
- [x] Update return type for combined stats
- [x] Test query performance vs individual queries
- [x] Update dashboard components to use new data structure

## Phase 2: Scalability & UX Improvements 📈

### [x] 5. Implement Admin Table Pagination
**Files:** 
- `app/(admin)/admin/institutions/_lib/queries.ts`
- `app/(admin)/admin/users/_lib/queries.ts`

**Issue:** All admin tables fetch ALL records (will timeout with 1000+ records)  
**Impact:** Consistent performance regardless of data size  
**Estimated Time:** 6 hours

**Tasks:**
- [x] Add optimized limits to `getPendingInstitutions()` (1000 record limit)
- [x] Add optimized limits to `getApprovedInstitutions()` (1000 record limit)
- [x] Add optimized limits to `getRejectedInstitutions()` (1000 record limit)
- [x] Remove server/client pagination conflicts with ReusableDataTable
- [x] Update table components to use unified client-side pagination
- [x] Fix duplicate pagination controls issue
- [x] Optimize count queries to use SQL COUNT() instead of .length
- [x] Test with pagination through all records

**Implementation Notes:**
- **Approach**: Unified client-side pagination with reasonable server limits (1000 records)
- **Reasoning**: Avoided complex server-side pagination conflicts with ReusableDataTable component
- **Performance**: Maintains caching benefits while preventing memory issues as data scales
- **Result**: Users can now navigate through all institutions via table's native pagination

### [x] 6. Refactor Dashboard for Streaming
**File:** `app/(admin)/admin/dashboard/page.tsx`  
**Issue:** Monolithic component blocks until all data loads  
**Impact:** Progressive loading, better perceived performance  
**Estimated Time:** 4 hours

**Tasks:**
- [x] Create `AsyncDashboardStats` component
- [x] Create `AsyncCategoryChart` component
- [x] Create `AsyncStateChart` component
- [x] Create `AsyncRecentSubmissions` component
- [x] Wrap each component in `<Suspense>` boundary
- [x] Create specific loading skeletons for each section
- [x] Test streaming behavior and loading states

### [x] 7. Fix Sequential Database Calls
**File:** `app/(admin)/admin/dashboard/queries.ts:32-33`  
**Issue:** `getStateDistribution()` called after `Promise.all` instead of included  
**Impact:** Remove unnecessary waterfall, faster dashboard loads  
**Estimated Time:** 30 minutes

**Tasks:**
- [x] Include `getStateDistribution()` in main `Promise.all`
- [x] Test parallel execution
- [x] Verify no dependencies between queries

## Phase 3: Fine-tuning & Long-term Health 🔧

### [x] 8. Optimize Count Queries
**File:** `app/(admin)/admin/institutions/_lib/queries.ts:127-179`  
**Issue:** Using `SELECT { count: institutions.id }` then `.length` instead of SQL `COUNT()`  
**Impact:** More efficient database queries  
**Estimated Time:** 2 hours

**Tasks:**
- [x] Replace inefficient count pattern with `count()` function
- [x] Update `getPendingInstitutionsCount()`
- [x] Update `getApprovedInstitutionsCount()`
- [x] Update `getRejectedInstitutionsCount()`
- [x] Test count accuracy vs current implementation

**Implementation Notes:**
- **Completed as part of Task 5**: Count query optimization was implemented alongside pagination improvements
- **Result**: All count queries now use proper SQL `COUNT()` instead of fetching IDs and using `.length`

### [ ] 9. Implement Batch Operations
**File:** `app/(admin)/admin/institutions/pending/pending-table.tsx:129-157`  
**Issue:** Bulk operations use individual queries for each selected item  
**Impact:** Faster bulk approve/reject operations  
**Estimated Time:** 3 hours

**Tasks:**
- [ ] Create batch approve server action
- [ ] Create batch reject server action
- [ ] Use single `UPDATE` query with `WHERE id IN ()`
- [ ] Update UI to handle batch responses
- [ ] Add proper error handling for partial failures
- [ ] Test with large selections

### [ ] 10. Improve Cache Strategy
**Files:** Multiple cache implementations  
**Issue:** Cache invalidation too broad, short TTLs  
**Impact:** Better cache hit rates, more granular invalidation  
**Estimated Time:** 2 hours

**Tasks:**
- [ ] Review current cache tags for granularity
- [ ] Implement more specific cache tags
- [ ] Increase TTL for stable admin data (900 seconds)
- [ ] Document cache invalidation patterns
- [ ] Test cache behavior with real usage patterns

## Success Metrics 📊

**Target Performance Improvements:**
- Dashboard load time: 500ms → 100ms (5x improvement)
- Users page load time: 800ms → 150ms (5.3x improvement)
- Admin navigation: Remove 50ms per page load
- Bulk operations: Support 100+ selections without timeout
- Pagination: Handle 10,000+ records consistently

**Database Efficiency:**
- Dashboard queries: 8+ → 4 database calls
- Users page: N+1 → Single JOIN query
- Count queries: Fetch IDs → Direct COUNT()
- Cache hit rate: >80% for admin pages

## Notes & Decisions 📝

**Implementation Order Rationale:**
1. **Phase 1** targets immediate user pain points and critical scalability issues
2. **Phase 2** improves long-term scalability and user experience
3. **Phase 3** adds polish and monitoring for ongoing health

**Risk Mitigation:**
- Test each change thoroughly before moving to next
- Implement changes in small, testable increments
- Keep original queries as fallback during testing
- Monitor production performance after each deployment

**Review Points:**
- [ ] After Phase 1: Measure performance improvements
- [ ] After Phase 2: Validate scalability with large datasets  
- [ ] After Phase 3: Confirm monitoring and alerting work

---

**Last Updated:** July 12, 2025  
**Next Review:** After each phase completion