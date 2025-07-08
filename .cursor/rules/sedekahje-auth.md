---
description: sedekahje authentication rules
globs:
alwaysApply: false
---

# Authentication Rules - sedekah.je

## Better Auth Setup

### Configuration
```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { /* auth tables */ },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
});
```

## Route Protection

### Layout-Based Protection
```typescript
// Protected layout for (user) routes
export default async function ProtectedLayout({ children }) {
  const session = await auth.api.getSession({ headers: headers() });
  
  if (!session) {
    redirect("/auth");
  }
  
  return <ClientLayout>{children}</ClientLayout>;
}
```

### Admin Route Protection
```typescript
// Admin-only protection
export default async function AdminLayout({ children }) {
  const session = await auth.api.getSession({ headers: headers() });
  
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }
  
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
```

## Auth Hooks & Utilities

### Client-Side Auth Hook
```typescript
export function useAuth() {
  const session = useSession();
  return {
    user: session.data?.user,
    isAuthenticated: !!session.data?.user,
    isAdmin: session.data?.user?.role === "admin",
  };
}
```

### Server-Side Auth Check
```typescript
// In server actions or queries
export async function serverFunction() {
  const session = await auth.api.getSession({ headers: headers() });
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  const userId = session.user.id;
  // ... rest of function
}
```

## User Roles & Permissions

### Role Types
- `user` - Default role for contributors
- `admin` - Can approve/reject institutions

### Permission Checks
```typescript
// Check admin role
if (session.user.role !== "admin") {
  throw new Error("Admin access required");
}

// Check user owns resource
if (resource.contributorId !== session.user.id) {
  throw new Error("Access denied");
}
```

## Authentication Flow
1. User signs in with Google OAuth
2. Better Auth handles token exchange
3. User session stored in database
4. Protected routes check session
5. Client components use auth hooks