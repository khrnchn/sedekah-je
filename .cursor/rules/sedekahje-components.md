# Component Rules - sedekah.je

## Component Patterns

### Server Components (Default)
```typescript
export default async function ServerComponent() {
  // Can use server-side APIs
  const session = await auth.api.getSession({ headers: headers() });
  const data = await getServerData();
  
  return (
    <div>
      <h1>Welcome {session?.user?.name}</h1>
      {data.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

### Client Components
```typescript
"use client";

export default function ClientComponent() {
  const [state, setState] = useState();
  const { user } = useAuth();
  
  return (
    <div>
      <button onClick={() => setState(prev => !prev)}>
        Toggle
      </button>
    </div>
  );
}
```

### Forward Refs for UI Components
```typescript
const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn("base-classes", className)} 
        {...props} 
      />
    );
  }
);
Component.displayName = "Component";
```

## Styling Patterns

### Tailwind + shadcn/ui
```typescript
// Use cn utility for conditional classes
<div className={cn(
  "base-classes",
  "hover:bg-gray-100 dark:hover:bg-zinc-800",
  condition && "conditional-classes",
  className
)}>
  {children}
</div>
```

### CSS Variables
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
}
```

## State Management

### TanStack Query Setup
```typescript
const queryClient = new QueryClient();

export const QueryProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

### Custom Hooks
```typescript
export function useCustomHook() {
  const [state, setState] = useState();
  
  const handler = useCallback(() => {
    // Logic here
  }, []);
  
  return { state, handler };
}
```

## Performance Patterns

### Loading States
```typescript
const [isLoading, setIsLoading] = useState(false);

// Show loading UI
{isLoading && <Skeleton className="h-4 w-20" />}
```

### Optimization
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers
- Implement debouncing for search inputs
- Use React.lazy for code splitting

## Error Handling

### Error Boundaries
```typescript
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Centralized Error Handling
```typescript
export function getErrorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.issues.map(issue => issue.message).join("\n");
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong, please try again later.";
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);
  return toast.error(errorMessage);
}
```

## Component Guidelines

### Functions vs Components
- Use arrow functions for components and utilities
- Use function declarations for server actions
- Use async/await instead of promises

### Props & Types
```typescript
interface ComponentProps {
  title: string;
  optional?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Component({ title, optional = false, children, className }: ComponentProps) {
  return (
    <div className={cn("default-classes", className)}>
      <h2>{title}</h2>
      {optional && <span>Optional content</span>}
      {children}
    </div>
  );
}
```

### Comments
- Use JSDoc for complex functions
- Add TODO comments for future improvements
- Document complex business logic