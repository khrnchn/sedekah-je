# Mobile QR Contribution Flow Overhaul

**Status:** Phase 1 Complete  
**Target Completion:** Phase 1 completed on 2025-07-13

## Phase 1: Immediate UX Improvements (Unblocking Users)

### 1. Decouple Submission from QR Extraction
**File:** `app/(user)/contribute/_components/institution-form-optimized.tsx`  
**Issue:** The main form's submit button is disabled if client-side QR extraction fails, which blocks users on mobile from contributing.  
**Impact:** Guarantees that all users can submit their contribution, which will dramatically improve the mobile experience and increase successful submissions.  
**Estimated Time:** 1 hour

**Tasks:**
- [x] Locate the primary form component and the submit button.
- [x] Remove any logic that disables the submit button based on the QR extraction status.
- [x] Ensure the form's `isSubmitting` state is the only factor controlling the submit button's active state.

### 2. Remove Strict QR Validation Rule
**File:** `app/(user)/contribute/_lib/validations.ts`  
**Issue:** The Zod validation schema has a rule (`qrExtractionSuccess`) that requires the client-side QR extraction to succeed, preventing form submission.  
**Impact:** Allows the form data to be sent to the server for processing even if the browser fails to read the QR code.  
**Estimated Time:** 30 minutes

**Tasks:**
- [x] Find the `institutionFormServerSchema`.
- [x] Remove the `qrExtractionSuccess` field and any associated `.refine()` or `.superRefine()` logic that makes QR success mandatory.
- [x] Verify that no other part of the code relies on this validation rule.

### 3. Implement Daily Submission Limit
**File:** `app/(user)/contribute/_lib/submit-institution.ts`  
**Issue:** With the removal of strict QR validation, the form is more susceptible to spam or low-quality submissions.  
**Impact:** Protects the system from abuse by limiting anonymous or authenticated users to a reasonable number of submissions per day.  
**Estimated Time:** 2 hours

**Tasks:**
- [x] In the `submitInstitution` server action, get the current user's ID.
- [x] Before processing the submission, query the `institutions` table to count how many submissions the user has made in the last 24 hours.
- [x] If the count is 3 or more, return a specific error message.
- [x] Update the form component to gracefully handle and display this "rate limit exceeded" error to the user.

## Phase 2: Technical Upgrade and Refined Feedback

### 4. Replace `jsqr` with `@zxing/browser`
**File:** `hooks/use-qr-extraction-lazy.ts`  
**Issue:** The current `jsqr` library has proven unreliable with real-world mobile images (due to blur, lighting, etc.).  
**Impact:** Increased client-side decoding success rate thanks to a more modern and robust library.  
**Estimated Time:** 2 hours

**Tasks:**
- [x] Add the `@zxing/browser` dependency to `package.json`.
- [x] Remove the `jsqr` dependency if it is no longer used elsewhere.
- [x] Refactor the `handleQrImageChange` function in the hook to use `BrowserQRCodeReader` from the new library.
- [x] Ensure the new implementation correctly handles image loading and decoding errors.
- [x] Test with various challenging QR code images to confirm improved performance.

### 5. Update UI with Non-Blocking Feedback
**File:** `app/(user)/contribute/_components/qr-extraction-feature.tsx`  
**Issue:** The UI messaging is tied to the old, blocking workflow and needs to be updated to be more reassuring.  
**Impact:** Provides clear, empathetic communication to the user, which builds trust and improves the overall experience.  
**Estimated Time:** 1.5 hours

**Tasks:**
- [x] When extraction succeeds, display the message: *"Success! We read the QR code. This will help our team approve your submission faster."*
- [x] When extraction fails, display the message: *"Couldn't read the QR code automatically. No problem—please continue. Our team will review the image manually."*
- [x] Ensure the component's UI correctly reflects the loading, success, and failure states from the newly refactored hook.

✅ **COMPLETED:** All changes committed to kc/kc-44-review-qr-extraction-on-mobile branch (commit 755f299)

## Success Metrics

-   **Primary Goal:** A user must be able to submit a contribution with a QR image, regardless of whether the client-side extraction succeeds or fails.
-   **Secondary Goal:** Increase the client-side QR extraction success rate by at least 25% after implementing the `@zxing/browser` library.
-   **User Experience:** Eliminate user reports of being "stuck" or "blocked" on the contribution form due to QR scanning issues.

## Notes & Decisions

-   **Decision:** We are immediately upgrading the QR library to `@zxing/browser` instead of keeping it as a long-term option. This avoids technical debt and provides a better user experience from the outset.
-   **Backend:** No changes are required for the backend. The existing server-side decoding logic and the manual admin review process will serve as the final verification steps.
