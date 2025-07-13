# Mobile QR Extraction Analysis and Recommendations

## Current Implementation

The app currently uses `jsqr` library for client-side QR extraction with the following flow:
1. User uploads/captures image via `qr-extraction-feature.tsx`
2. `use-qr-extraction-lazy.ts` hook processes image using HTML5 Canvas API
3. `jsQR()` attempts to extract QR data from image pixels
4. Form validation requires successful QR extraction before submission
5. Server-side backup extraction using Sharp + jsQR

## Mobile QR Extraction Issues

### Technical Challenges
1. **Image Quality**: Mobile cameras often produce high-resolution images that need resizing
2. **Processing Power**: Canvas API processing can be slow on mobile devices
3. **Memory Constraints**: Large images can cause memory issues on mobile browsers
4. **Lighting Conditions**: Poor lighting affects QR detection accuracy
5. **Camera Focus**: Mobile auto-focus may not be optimal for QR codes
6. **Orientation**: Image rotation can affect detection

### User Experience Problems
1. Users frustrated when QR extraction fails repeatedly
2. No way to proceed if QR extraction keeps failing
3. Form becomes unusable if QR detection is mandatory

## Recommendations

### Option 1: Make QR Extraction Optional (Recommended)
- Allow users to submit any image without requiring QR extraction
- Move QR validation to admin review process
- Benefits:
  - Removes user friction
  - Allows contributions even with difficult QR codes
  - Admin can manually verify QR codes during review

### Option 2: Improve QR Detection
- Add image preprocessing (contrast, brightness adjustment)
- Implement multiple detection attempts with different image modifications
- Add manual cropping tool for users to isolate QR area

### Option 3: Hybrid Approach
- Try QR extraction first
- If fails after 2-3 attempts, allow user to skip with warning
- Flag submissions without successful QR extraction for admin review

## Implementation Recommendation

**Go with Option 1** - Make QR extraction optional:

1. **Remove validation requirement** in `validations.ts`
2. **Update form UI** to show QR extraction as "helpful but not required"
3. **Enhance admin interface** to prioritize reviewing submissions without extracted QR data
4. **Keep server-side extraction** as backup during admin review

This approach maximizes user success while maintaining QR code quality through admin moderation.

## Mobile-Specific Improvements

If keeping QR extraction:
1. Add image resizing before processing (max 800px width)
2. Implement retry with different image processing filters
3. Add user guidance for better QR capture (lighting, distance, stability)
4. Consider using a more robust QR library like `qr-scanner`

## Next Steps

1. Discuss approach with team
2. Update form validation logic
3. Enhance admin review workflow
4. Consider A/B testing optional vs required QR extraction