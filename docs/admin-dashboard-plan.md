# Admin Dashboard Implementation Plan

## Overview
This document outlines the implementation plan for the sedekah.je admin dashboard. The system will enable administrators to manage institution approvals, user accounts, and oversee the platform's operations.

## Current State Analysis

### ✅ What We Have
- **Authentication System**: Better Auth with Google OAuth
- **User Roles**: `user` and `admin` roles defined in database
- **Database Schema**: Complete schema with admin workflow support
- **Institution Workflow**: Pending → Approved/Rejected status system
- **User Contributions**: Users can submit institutions and track status
- **Protected Routes**: Infrastructure for role-based access control

### ❌ What's Missing
- Admin dashboard interface
- Institution review and approval system
- User management interface
- Admin role assignment functionality
- Analytics and reporting
- Bulk operations

## 🎯 Core Admin Features

### 2. **Dashboard Overview**
- **Institution Statistics**
  - Total institutions (static + dynamic)
  - Pending approvals count
  - Approved/rejected counts
  - Recent submissions
- **User Statistics**
  - Total registered users
  - Active contributors
  - Recent registrations
- **Activity Feed**
  - Recent submissions
  - Recent approvals/rejections
  - User activity highlights

### 1. **Institution Management**
- **Pending Approvals Queue**
  - List all pending institutions
  - Filter by category, state, contributor
  - Sort by submission date, priority
  - Bulk actions (approve/reject multiple)
- **Review Interface**
  - Institution details view
  - QR code preview
  - Contributor information
  - Admin notes and review history
  - One-click approve/reject with comments
  - Admin can edit all the details submitted by contributor
- **All Institutions Browser**
  - View all institutions (static + dynamic)
  - Edit institution details
  - Manage categories and tags
  - Archive/restore institutions
  - Bulk operations

### 3. **User Management**
- **User Directory**
  - Search and filter users
  - View user profiles and contribution history
  - Role management (promote to admin)
  - Account status (active/inactive)
- **Admin Invitations**
  - Send admin invitations via email
  - Temporary invitation links
  - Role-based permissions
- **User Analytics**
  - Top contributors
  - User engagement metrics
  - Registration trends

### 4. **Content Management**
- **Static Institution Data**
  - Import/export static institutions
  - Bulk update operations
  - Data validation and cleanup
- **Categories & Tags**
  - Manage institution categories
  - Add/edit payment methods
  - State and location management
- **QR Code Management**
  - QR code validation tools
  - Bulk QR code processing
  - Dead link detection

### 5. **Analytics & Reporting**
- **Usage Statistics**
  - Page views and user engagement
  - Popular institutions and categories
  - Geographic distribution
- **Contribution Analytics**
  - Submission patterns
  - Approval/rejection rates
  - Contributor performance
- **Export Capabilities**
  - CSV/Excel exports
  - Data backup and migration
  - API usage reports

## 🏗️ Technical Implementation

### Directory Structure
```
app/
├── (admin)/                    # Admin-only routes
│   ├── admin/
│   │   ├── dashboard/         # Main dashboard
│   │   │   ├── _lib/          # Server actions for dashboard
│   │   │   └── page.tsx       # Dashboard page
│   │   ├── institutions/      # Institution management
│   │   │   ├── _lib/          # Server actions for institutions
│   │   │   │   ├── queries.ts # Institution queries
│   │   │   │   └── actions.ts # Institution actions
│   │   │   ├── pending/       # Pending approvals
│   │   │   │   └── page.tsx
│   │   │   ├── approved/      # Approved institutions
│   │   │   │   └── page.tsx
│   │   │   └── rejected/      # Rejected institutions
│   │   │       └── page.tsx
│   │   ├── users/             # User management
│   │   │   ├── _lib/          # Server actions for users
│   │   │   │   ├── queries.ts # User queries
│   │   │   │   └── actions.ts # User actions
│   │   │   ├── directory/     # User directory
│   │   │   │   └── page.tsx
│   │   │   ├── admins/        # Admin management
│   │   │   │   └── page.tsx
│   │   │   └── invitations/   # Admin invitations
│   │   │       └── page.tsx
│   │   ├── analytics/         # Reports and analytics
│   │   │   ├── _lib/          # Server actions for analytics
│   │   │   └── page.tsx
│   │   └── settings/          # System settings
│   │       ├── _lib/          # Server actions for settings
│   │       └── page.tsx
│   └── layout.tsx             # Admin layout with navigation
```

### Database Enhancements
```sql
-- Admin invitations table
CREATE TABLE admin_invitations (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  invited_by TEXT REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin activity log
CREATE TABLE admin_activity_log (
  id SERIAL PRIMARY KEY,
  admin_id TEXT REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Server Actions Structure
```typescript
// app/(admin)/admin/institutions/_lib/actions.ts
export async function approveInstitution(id: number, adminNotes?: string)
export async function rejectInstitution(id: number, adminNotes: string)
export async function updateInstitution(id: number, data: Partial<Institution>)
export async function deleteInstitution(id: number)
export async function bulkUpdateInstitutions(ids: number[], action: 'approve' | 'reject')

// app/(admin)/admin/institutions/_lib/queries.ts
export async function getPendingInstitutions()
export async function getApprovedInstitutions()
export async function getRejectedInstitutions()
export async function getInstitutionById(id: number)
export async function getInstitutionStats()

// app/(admin)/admin/users/_lib/actions.ts
export async function updateUserRole(userId: string, role: 'user' | 'admin')
export async function deactivateUser(userId: string)
export async function sendAdminInvitation(email: string)
export async function deleteInvitation(id: string)
export async function acceptInvitation(token: string)

// app/(admin)/admin/users/_lib/queries.ts
export async function getAllUsers()
export async function getAdminUsers()
export async function getPendingInvitations()
export async function getUserStats()

// app/(admin)/admin/dashboard/_lib/queries.ts
export async function getDashboardStats()
export async function getRecentActivity()
export async function getActivityFeed()

// app/(admin)/admin/analytics/_lib/queries.ts
export async function getAnalyticsData()
export async function getInstitutionAnalytics()
export async function getUserAnalytics()
export async function exportData(format: 'csv' | 'json')
```

## 🎨 UI/UX Design

### Navigation Structure
```
Admin Dashboard
├── 📊 Dashboard (Overview)
├── 🏛️ Institutions
│   ├── ⏳ Pending Review (5)
│   ├── ✅ Approved
│   └── ❌ Rejected
├── 👥 Users
│   ├── 📋 Directory
│   ├── 🔑 Admins
│   └── 📧 Invitations
├── 📈 Analytics
│   ├── 📊 Overview
│   ├── 🏛️ Institutions
│   └── 👥 Users
└── ⚙️ Settings
```

### Key Components
- **AdminLayout**: Sidebar navigation with role-based access
- **DataTables**: Sortable, filterable tables for institutions/users
- **ReviewModal**: Institution review interface with QR preview
- **UserInviteModal**: Admin invitation form
- **AnalyticsCharts**: Dashboard charts and metrics
- **BulkActions**: Multi-select operations

## 🔐 Security & Permissions

### Role-Based Access Control
```typescript
// Middleware enhancement
export const adminMiddleware = (requiredRole: 'admin' | 'super_admin' = 'admin') => {
  return async (req: Request) => {
    const user = await getUser(req);
    if (!user || user.role !== requiredRole) {
      throw new Error('Unauthorized');
    }
    return user;
  };
};
```

### Permission Matrix
| Feature | Admin | Super Admin |
|---------|-------|-------------|
| View Dashboard | ✅ | ✅ |
| Review Institutions | ✅ | ✅ |
| Manage Users | ❌ | ✅ |
| Invite Admins | ❌ | ✅ |
| System Settings | ❌ | ✅ |
| Analytics Export | ✅ | ✅ |

## 📱 Mobile Considerations
- Responsive admin interface
- Touch-friendly review interface
- Mobile-optimized data tables
- Offline capability for reviewing institutions

## 🔄 Implementation Phases

### Phase 1: Core Dashboard (Week 1-2)
- [ ] Admin layout and navigation
- [ ] Dashboard overview with statistics
- [ ] Institution pending queue
- [ ] Basic review interface

### Phase 2: User Management (Week 3)
- [ ] User directory and search
- [ ] Admin role assignment
- [ ] Admin invitation system
- [ ] User activity tracking

### Phase 3: Advanced Features (Week 4-5)
- [ ] Analytics and reporting
- [ ] Bulk operations
- [ ] Content management tools
- [ ] Export capabilities

### Phase 4: Polish & Testing (Week 6)
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Security audit
- [ ] User testing and feedback

## 🚀 Additional Feature Suggestions

### Enhanced Features
1. **Email Notifications**
   - Notify users when institutions are approved/rejected
   - Weekly digest for admins
   - Invitation emails with branding

2. **Advanced Analytics**
   - Geographic heat maps
   - Conversion funnels
   - User journey tracking
   - A/B testing capabilities

3. **Integration Features**
   - Webhook support for external systems
   - API for third-party integrations
   - Slack/Discord notifications
   - GitHub integration for static data updates

4. **Quality Assurance**
   - Automated QR code validation
   - Duplicate detection
   - Image quality checks
   - Geocoding verification

5. **Workflow Automation**
   - Auto-approval for trusted contributors
   - Scheduled reports
   - Bulk data imports
   - Backup and restore

6. **Advanced User Features**
   - Contributor badges and gamification
   - Institution claiming by owners
   - Public API for developers
   - Mobile app support

## 📊 Success Metrics
- **Efficiency**: Reduce approval time from manual to <5 minutes
- **User Satisfaction**: 95% contributor satisfaction with feedback
- **Data Quality**: 99% accuracy in approved institutions
- **Admin Productivity**: Process 10x more institutions per hour
- **User Growth**: Enable scaling to 10,000+ users

## 🎯 Next Steps
1. **Review and approve this plan**
2. **Set up development environment**
3. **Create admin database migrations**
4. **Implement Phase 1 features**
5. **Test with real data**
6. **Deploy to staging for feedback**

---

This plan provides a comprehensive roadmap for building a professional admin dashboard that will significantly improve the management and scalability of the sedekah.je platform.