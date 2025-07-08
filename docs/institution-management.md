# Institution Management Implementation Log

## Findings
- `db/institutions.ts` already contains a `status` column with the possible values `"pending" | "approved" | "rejected"`.
- There were no admin-side queries or UI for managing institution approval yet.
- A versatile `DataTable` component exists, but it is tailored to a different dataset. For a quick MVP, a simpler table is sufficient; we can iterate later.

## Plan
1. 🗂️  Server utilities
   - Create `app/(admin)/admin/institutions/_lib/queries.ts` with helper functions starting with `getPendingInstitutions()`.
2. 🖥️  UI – Pending Approvals Queue
   - Route: `/admin/institutions/pending`
   - Display a list of pending institutions with basic metadata (id, name, category, state, city, contributor, date).
   - Keep the implementation minimal for now; later we can extend/replace with an interactive `DataTable` supporting filters, bulk actions, etc.
3. ✅  Review / Approve / Reject actions
   - Add server actions `approveInstitution` and `rejectInstitution`.
   - Surface these actions in the table via buttons or a dropdown.
4. 🔄  Bulk operations & nice UX
   - Replace the simple table with an extended version of the existing `DataTable` component.
5. 🧭  Navigation & Layout
   - Add sidebar links to Institutions → Pending / Approved / Rejected.

## Progress
- [x] `getPendingInstitutions()` implemented.
- [x] Basic Pending Approvals page created.
- [ ] Approve / Reject actions.
- [ ] Bulk operations & filters.
- [ ] Navigation entry for the new page.

## Blockers / Notes
- No blockers right now.
- When adding approve/reject actions we must keep migrations simple (user rule: avoid `pgenums`). 