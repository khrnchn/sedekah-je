### Subject: Improving Mobile QR Code Submission

**1. The Problem**

The current client-side QR code extraction, which uses the `jsqr` library directly in the browser, is proving unreliable on mobile devices. This is a common issue for several reasons:

-   **Image Quality:** Photos taken with mobile cameras often suffer from blur, poor lighting, shadows, or perspective distortion, which makes it difficult for QR decoding libraries to work effectively.
-   **Performance:** Decoding image data is computationally intensive. Mobile browsers have more limited resources than desktops, which can lead to the process failing or timing out, especially with large, high-resolution images.
-   **User Experience:** When the extraction fails, it blocks the user from contributing, leading to frustration and abandoned submissions.

**2. Analysis of Your Suggestion**

You suggested removing the extraction step from the form and simply accepting the image upload. This is an excellent idea because it prioritizes the user's ability to complete their primary task: submitting the institution.

**3. My Recommendation: Decouple Extraction from Submission (Immediate Solution)**

I recommend we adopt your suggestion and take it a step further by making the client-side extraction an optional "helper" rather than a mandatory step. This gives us the best of both worlds: a smooth path for all users and helpful feedback for those who provide clean images.

**Proposed Plan:**

1.  **Decouple UI from Logic:** Modify the contribution form so that the "Submit" button is **always enabled**, regardless of the outcome of the client-side QR check. The user's ability to submit should not depend on the browser's ability to decode the image.

2.  **Run Extraction as a Non-Blocking Helper:**
    -   When a user uploads an image, we still run the `jsqr` process in the background.
    -   **On Success:** Display a positive, reassuring message.
        -   *Example: "Success! We read the QR code. This will help our team approve your submission faster."*
    -   **On Failure:** Display a non-blocking, informative message that does not imply user error.
        -   *Example: "Couldn't read the QR code automatically. No problem—please continue. Our team will review the image manually."*

3.  **Rely on Existing Backend Verification:** The current server-side logic (`submit-institution.ts`) already attempts to decode the QR image after upload. This will become our primary automated check. The existing admin workflow for manually reviewing failed decodes will handle the rest.

**Benefits of this Approach:**

-   **Solves the Core Problem:** Users are no longer blocked from contributing on mobile.
-   **Improves User Confidence:** The process feels more reliable, and users are not blamed for technical failures.
-   **Maintains Data Quality:** It still encourages users to upload good images by providing positive feedback when they do.
-   **No Major Increase in Admin Workload:** It funnels all submissions into the existing verification pipeline, which is already designed to handle manual reviews.

**4. Future Enhancements (Long-Term)**

Once the immediate issue is resolved, we can focus on making the client-side "helper" more powerful and reliable.

-   **Explore a Better Library:** We could investigate switching from `jsqr` to a more modern library like **`zxing-js/browser`**. It's a port of Google's robust ZXing library and may offer better performance and error correction.
-   **Implement a Live Camera Scanner:** The most effective long-term solution would be to implement a live scanning interface using `getUserMedia`. This would show a real-time camera feed with an overlay guiding the user to position the QR code correctly, similar to native banking or payment apps. This approach provides the best user experience and dramatically increases the decoding success rate.
