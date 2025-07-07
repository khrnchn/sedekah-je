# Business Logic Rules - sedekah.je

## Project Context
Malaysian QR code directory for mosques, suraus, and other religious institutions. Always consider the Malaysian context when implementing features.

## Institution Types
- `mosque` (masjid) - Blue theme color
- `surau` - Green theme color  
- `others` (lain-lain) - Violet theme color

## Payment Methods
- `duitnow` - Malaysian instant payment system
- `tng` - Touch 'n Go eWallet
- `boost` - Boost eWallet

## Malaysian States
All 16 Malaysian states and federal territories:
- Johor, Kedah, Kelantan, Melaka, Negeri Sembilan
- Pahang, Perak, Perlis, Pulau Pinang
- Sabah, Sarawak, Selangor, Terengganu
- WP Kuala Lumpur, WP Labuan, WP Putrajaya

Each state has corresponding SVG flag in `public/flags/`

## Institution Status Workflow
- `pending` - Awaiting admin approval (default for new submissions)
- `approved` - Approved by admin and visible to public
- `rejected` - Rejected by admin with reason

## User Roles
- `user` - Default role for contributors who can submit institutions
- `admin` - Can approve/reject institutions and manage users

## Data Sources
- **Static Data**: Historical institutions in `app/data/institutions.ts`
- **Dynamic Data**: User-contributed institutions in PostgreSQL database
- **Combined Display**: Both sources shown together on maps and listings

## Business Rules

### Institution Submission
- Users must be authenticated to submit institutions
- All submissions start with `pending` status
- QR code images are optional but encouraged
- Automatic geocoding if coordinates not provided
- Contributor information is tracked for each submission

### Admin Approval Process
- Only admin users can approve/reject institutions
- Admin can add notes when approving/rejecting
- Approved institutions become visible to public
- Rejected institutions remain visible to contributor only

### QR Code Handling
- QR codes are automatically processed to extract payment information
- Supported formats: images containing QR codes
- QR content is stored for validation and display
- Invalid QR codes don't prevent submission

### Geographic Features
- Coordinates are used for map display
- Automatic geocoding via OpenStreetMap Nominatim
- State-based filtering using Malaysian states
- Location-based "nearest" institution detection

## UI/UX Considerations

### Language & Localization
- Primary language: Bahasa Malaysia
- Form labels and messages in Bahasa Malaysia
- Error messages in Bahasa Malaysia
- Consider Malaysian cultural context

### Payment Method Display
- Show payment method icons (DuitNow, TNG, Boost)
- QR codes displayed prominently
- Easy sharing functionality for QR codes

### Mobile-First Design
- Responsive design for Malaysian mobile users
- Touch-friendly interfaces
- Offline capability considerations

## Data Privacy & Security
- User data protection following Malaysian standards
- Secure handling of payment QR codes
- No storage of sensitive financial information
- Proper authentication and authorization

## Performance Considerations
- Optimize for Malaysian internet speeds
- Efficient image handling for QR codes
- Minimize data usage for mobile users
- Fast loading times for map and institution data