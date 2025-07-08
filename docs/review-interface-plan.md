# Review Interface – Planning & TODOs

> Status: draft (created {{date}})

## 1. Context / Problem Statement
The **Institution Management** module now lists pending institutions and offers quick *Approve* / *Reject* actions.  
However, admins need a **dedicated review interface** to verify every submission in depth before taking action.  
Key pain-points today:

* Cannot inspect the QR code inside the admin dashboard – it must be scanned to confirm recipient name.
* No single page that aggregates institution details, contributor info, previous admin notes or edit capabilities.
* Review history is not surfaced.

## 2. Findings (current state)
1. `PendingInstitutionsTable` already shows a table of pending items with approve/reject callbacks.
2. Backend table `institutions` contains: `status`, `reviewedBy`, `reviewedAt`, `adminNotes` – so basic audit fields already exist.
3. We have a `QrCodeDisplay` component that is production-ready and supports multiple payment labels (duitnow / tng / boost).
4. Detailed institution view exists at `/[institution]/[slug]`, but it is user-facing and not editable.
5. No admin-scoped route that shows **pending** institution details with edit & review tools.
6. Google Maps integration exists but can be deferred as per requirement.

## 3. Goals / Non-Goals
✔ Show QR code preview large enough to scan with mobile banking app.  
✔ Display all submitted details (name, address, category, coordinates, etc.).  
✔ Show contributor profile & submission timestamp.  
✔ Allow admins to **edit any field** before approving.  
✔ Capture & persist admin notes with each decision.  
✔ Surface past review history if the record was previously rejected and resubmitted.  
✔ Maintain design system consistency (reuse `globals.css`, *ShadCN UI* components).

✘ Google Maps interaction (can be toggled later).  
✘ Bulk approval/rejection from this page (handled in table view).

## 4. Proposed UX Flow
1. From **Pending Institutions** table > click "View details".
2. Navigate to `/admin/institutions/pending/[id]` (server component).  
3. Page layout sections:
   * Header: breadcrumb, *Approve* + *Reject* buttons.
   * Left column: **Institution Details Form** (editable fields).
   * Right column: **QR Code Preview** (using `QrCodeDisplay`, tap to enlarge/download).
   * Footer: Review history timeline & contributor info.
4. After **Approve/Reject**, redirect back to pending list with toast.

## 5. Technical Plan
### 5.1 Routes & Components
* `app/(admin)/admin/institutions/pending/[id]/page.tsx` – server component to fetch data.
* Child client component `InstitutionReviewForm.tsx` for editable form.
* Reuse **QrCodeDisplay** and add modal/lightbox for enlarged scan.
* Optional: `ReviewHistory` component showing changelog.

### 5.2 Data Layer
* New query `getPendingInstitutionById(id)` in `app/(admin)/admin/institutions/_lib/queries.ts`.
* Mutation endpoint `updateInstitution(id, payload)` for admin edits (server action).
* Decide whether to introduce separate `institution_reviews` table for audit trail.  
  * MVP: append to `adminNotes` (JSON array) inside `institutions`.

### 5.3 Validation & Types
* Extend existing Zod `institution` schema in `contribute/validations.ts` so it can be reused for admin edits.
* Keep pgenums **avoided** per user rule – continue using `text` columns + TS enums.

### 5.4 Permissions
* Protect the route with `ProtectedRoute` or server side session check → only `role = admin`.

### 5.5 Manual QR Extraction Edge Case
* Display original QR image when extraction fails (`qrContent` is `null`).
* Provide **Image Toolbox** with Copy / Download / Open / QRaptor buttons.
* Show collapsible tips panel for manual extraction.
* Include a **Manual QR Content** textarea; required before approval if `qrContent` is null.
* Save manual `qrContent` via existing `updateInstitutionByAdmin` mutation and auto-record an audit note.

## 6. TODO List
[x] **Route & Data**
  * [x] Create `getPendingInstitutionById` query.
  * [x] Scaffold `[id]/page.tsx` with server fetch & layout.
[x] **Editable Form**
  * [x] Build `InstitutionReviewForm` client component (reuse contribute form).
  * [x] Wire **Save changes** action (mutates institution record).
[x] **QR Code Preview**
  * [x] Reuse `QrCodeDisplay` with larger size (320px) (done)
  * [x] Add **Lightbox / Download / Copy** buttons (implemented in QrImageToolbar)
[x] **Approve / Reject with Notes**
  * [x] Hoist approve/reject server actions.
  * [x] Capture `adminNotes` textarea; persist.
  * [x] Add composite **Save & Approve** action.
[ ] **Review History**
  * [ ] Decide on data structure (simple string, or JSON array).
  * [ ] Render timeline component if data exists.
[x] **Access Control & UX**
  * [x] Guard route  → admins only
  * [x] Toast & redirect flows.
[ ] **Testing & QA**
  * [ ] Manual scan of QR codes across payment types.
  * [ ] Edge cases: missing `qrContent`, invalid QR.
[x] **Manual QR Extraction**
  * [x] Image toolbox (Copy / Download / Open / QRaptor)
  * [x] Manual QR content textarea & validation
  * [x] Save manual qrContent & add audit note

## 7. Blockers / Open Questions
* Do we require multi-round reviews (i.e., multiple admins)? → If yes, we need `institution_reviews` table. - nope
* Should edits trigger a new *pending* state or be auto-approved after save? - stay pending, clicking on approve should be only way to approve
* Any additional metadata needed during approval (e.g., "legal entity number")? - nope

---
*Feel free to append comments or questions below.* 