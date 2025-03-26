# Enhance QR Code Handling in PR Descriptions

## Current Issue
- QR code decoding sometimes fails even with valid QR image URLs
- PR is created without indicating QR code decoding status
- No mechanism to manually provide QR content when decoding fails

## Proposed Enhancement

### 1. Enhanced PR Description
Add the following sections to PR description:
- Appended Institution Details
  - All institution information from the issue
  - Generated ID
- QR Code Decoding Status
  - Success/Failure indicator
  - Number of retry attempts made
  - QR content (if successfully decoded)
- Manual QR Content Input
  - If decoding fails, add a comment section for manual QR content input
  - Format: `<!-- QR_CONTENT: [content] -->`

### 2. Implementation Plan
1. Update `appendInstitution` function to:
   - Track QR decoding attempts and results
   - Include QR status in PR description
   - Add manual input section when decoding fails

2. Update PR description template to include:
   ```
   ## Appended Institution Details
   - Type: [typeOfInstitute]
   - Name: [nameOfTheMasjid]
   - City: [nameOfTheCity]
   - State: [state]
   - Generated ID: [nextId]
   - QR Image URL: [qrCodeImage]
   - Remarks: [remarks]
   - Issue ID: [issueId]

   ## QR Code Status
   - Status: [SUCCESS/FAILED]
   - Attempts: [X]
   - QR Content: [decoded content or "Not decoded"]
   
   <!-- If QR decoding failed -->
   ## Manual QR Content Input
   Please provide the QR content in the following format:
   <!-- QR_CONTENT: [content] -->
   ```

### 3. Future Improvements
- Consider implementing GitHub Actions workflow to:
  - Parse PR description for manual QR content
  - Update database with provided content
  - Add success/failure status check
  - Close PR automatically on successful update

## Benefits
- Better visibility of QR code processing status
- Clear indication when manual intervention is needed
- Structured approach for manual QR content updates
- Improved tracking of QR code processing issues
- Complete visibility of appended institution details for verification
