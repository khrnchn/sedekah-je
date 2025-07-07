# Feature Flags Documentation

## Overview
Feature flags allow you to toggle features on/off without deploying new code. This is useful for gradual rollouts, A/B testing, or quickly disabling features.

## Implementation Options for sedekah.je

### 1. Environment Variables (Simplest)
```env
# .env.local
FEATURE_EMAIL_AUTH=false
FEATURE_GOOGLE_ONLY_AUTH=true
```

**Pros:** Simple, no code changes needed
**Cons:** Requires server restart to update

### 2. Database Flags (Recommended)
Create a feature_flags table in PostgreSQL:

```sql
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Pros:** 
- No server restart needed
- Can build admin UI to toggle
- Supports gradual rollouts
- Can add metadata (description, timestamps)

**Cons:** Requires database queries

### 3. Config File (Middle Ground)
```json
// config/feature-flags.json
{
  "emailAuth": true,
  "googleOnlyAuth": false,
  "newMapFeature": false
}
```

**Pros:** Easy to edit, version controlled
**Cons:** Requires redeploy to update

## Implementation Plan for Email/Password Toggle

### Step 1: Create Feature Flag Utility
```typescript
// lib/feature-flags.ts
export const featureFlags = {
  emailAuth: process.env.FEATURE_EMAIL_AUTH === 'true',
  googleOnlyAuth: process.env.FEATURE_GOOGLE_ONLY_AUTH === 'true',
};

// For database approach:
export async function getFeatureFlag(name: string): Promise<boolean> {
  const flag = await db.query.featureFlags.findFirst({
    where: eq(featureFlags.name, name)
  });
  return flag?.enabled ?? false;
}
```

### Step 2: Update Auth Components
```typescript
// components/auth/auth-form.tsx
import { featureFlags } from '@/lib/feature-flags';

export function AuthForm() {
  const showEmailAuth = featureFlags.emailAuth;
  
  return (
    <div>
      <GoogleAuthButton />
      {showEmailAuth && (
        <EmailPasswordForm />
      )}
    </div>
  );
}
```

### Step 3: Update Auth Configuration
```typescript
// auth.ts
import { featureFlags } from '@/lib/feature-flags';

export const auth = betterAuth({
  plugins: [
    ...(featureFlags.emailAuth ? [emailAndPassword()] : []),
    // Google OAuth always enabled
  ],
  // ... rest of config
});
```

## Updating Feature Flags

### Environment Variables
1. Edit `.env.local` file
2. Restart development server: `bun dev`
3. For production: update environment variables and restart

### Database Flags
1. Build admin interface or use database client
2. Update flag value: `UPDATE feature_flags SET enabled = false WHERE name = 'emailAuth'`
3. Changes take effect immediately

### Config File
1. Edit `config/feature-flags.json`
2. Commit and deploy changes
3. Next.js will pick up changes on next request

## Best Practices

1. **Default to Safe Values**: New flags should default to false/disabled
2. **Clear Naming**: Use descriptive names like `enableEmailAuth` not `flag1`
3. **Documentation**: Document what each flag does
4. **Cleanup**: Remove unused flags and their code
5. **Testing**: Test both enabled and disabled states
6. **Gradual Rollout**: Start with small percentage of users

## Future Enhancements

1. **Percentage Rollouts**: Enable for 50% of users
2. **User Targeting**: Enable for specific user groups
3. **Time-based Flags**: Auto-enable/disable at certain times
4. **A/B Testing**: Multiple variants of a feature
5. **Admin Dashboard**: UI to manage all flags

## Example Admin Interface
```typescript
// app/admin/feature-flags/page.tsx
export default function FeatureFlagsAdmin() {
  const [flags, setFlags] = useState();
  
  const toggleFlag = async (name: string) => {
    await fetch('/api/admin/feature-flags', {
      method: 'POST',
      body: JSON.stringify({ name, enabled: !flags[name] })
    });
  };
  
  return (
    <div>
      {Object.entries(flags).map(([name, enabled]) => (
        <div key={name}>
          <span>{name}</span>
          <button onClick={() => toggleFlag(name)}>
            {enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

This approach gives you full control over feature visibility without losing code or requiring complex deployments.