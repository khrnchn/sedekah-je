1. In app/(user)/contribute/_components/qr-processor.tsx around lines 75 to 87,
remove the isInitialized.current check inside the useEffect so that the handlers
onHandleFileChange and onClearQrContent are updated whenever their dependencies
change. This will prevent stale closures by allowing the parent callbacks to
receive the latest versions of handleQrImageChange and clearQrContent. If
redundant calls are a concern, advise the parent component to memoize its
callbacks using useMemo or useCallback instead.

gemini's review:
This is a valid concern. Using `isInitialized.current` prevents the `useEffect` from re-running, causing it to hold on to stale callback functions if they are redefined by the parent component. Removing the check and ensuring the parent component memoizes the callbacks with `useCallback` is the correct approach to fix this potential bug and improve robustness.
claude's review:
**Agreement: Strong** - This is a classic React bug. The `isInitialized.current` check prevents the effect from re-running when dependencies change, causing stale closures. Removing this check and having the parent memoize callbacks with `useCallback` is the correct solution. This could cause subtle bugs where QR processing callbacks become outdated.

2. In hooks/use-qr-extraction-lazy.ts around lines 78 to 88, the code creates an
object URL with URL.createObjectURL(file) but does not revoke it, causing a
memory leak. To fix this, call URL.revokeObjectURL on the created URL in both
the img.onload success handler and the img.onerror error handler after
processing is complete to release the memory associated with the blob URL.

gemini's review:
This is a critical finding. `URL.createObjectURL` creates a reference to a file that the browser holds in memory. Failing to call `URL.revokeObjectURL` after the object is no longer needed will lead to a memory leak, which can degrade performance and cause crashes, especially on mobile devices. The suggestion to revoke the URL in both `onload` and `onerror` handlers is the correct way to fix this.
claude's review:
**Agreement: Critical** - This is a serious memory leak that accumulates over time. `URL.createObjectURL()` without corresponding `URL.revokeObjectURL()` creates memory leaks that are especially problematic on mobile devices with limited memory. This should be fixed immediately as it can cause performance degradation and crashes with repeated QR uploads.

3. In app/(user)/contribute/_components/institution-form-optimized.tsx around lines
141 to 147, remove the arbitrary 100ms delay in the useEffect that enables
advanced features. Instead of using setTimeout, replace it with a more
appropriate mechanism like requestIdleCallback or trigger enabling advanced
features based on user interaction to avoid confusing users with sudden UI
changes.

gemini's review:
I agree. Using an arbitrary `setTimeout` is a code smell and can lead to unpredictable behavior. It makes the UI feel unresponsive and can cause layout shifts. Replacing it with `requestIdleCallback` would be a better technical solution for deferring non-critical work. However, a better approach from a UX perspective would be to enable the advanced features based on a specific user interaction, making the behavior more predictable and intuitive for the user.
claude's review:
**Agreement: Strong** - The 100ms delay is a code smell that creates unpredictable UX. `requestIdleCallback` would be technically better, but triggering advanced features based on user interaction would provide the best UX. The arbitrary delay can confuse users and cause layout shifts, especially on slower mobile devices.

4. In app/(user)/leaderboard/_lib/queries.ts around lines 42 to 47, replace the use
of the fragile array index institutionStatuses[1] with a named constant from an
object representing institution statuses. Define an object with descriptive keys
for each status and use the appropriate key instead of the array index to
improve code clarity and maintainability. Apply the same refactor to lines 104
to 110 where similar array indexing occurs.

gemini's review:
This is a great point on code quality and maintainability. Relying on an array index like `institutionStatuses[1]` is fragile because the meaning of the index can change if the array order is modified, leading to subtle bugs. The code should be refactored to use a more descriptive and stable approach, such as an object constant (e.g., `INSTITUTION_STATUS.APPROVED`) to eliminate magic numbers and make the intent of the code clearer.
claude's review:
**Agreement: Strong** - Using `institutionStatuses[1]` is fragile and makes code hard to maintain. A constants object like `INSTITUTION_STATUS.APPROVED` would be much clearer and safer against refactoring errors. This is especially important for leaderboard queries where data accuracy is critical.

final todos:
- [x] Fix stale closure bug in QR processor by removing isInitialized check in useEffect (qr-processor.tsx:75-87) - done by gemini
- [x] Add useCallback memoization to parent component callbacks for QR processor to prevent redundant calls - done by gemini
- [x] Fix critical memory leak by adding URL.revokeObjectURL calls in both onload and onerror handlers (use-qr-extraction-lazy.ts:78-88) - done by gemini
- [x] Replace arbitrary 100ms setTimeout delay with requestIdleCallback or user interaction trigger (institution-form-optimized.tsx:141-147) - done by gemini
- [x] Create INSTITUTION_STATUS constants object to replace fragile array indexing institutionStatuses[1] (leaderboard queries.ts:42-47, 104-110) - done by gemini 

