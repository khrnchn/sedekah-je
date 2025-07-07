# Form Handling Rules - sedekah.je

## Form with Server Actions Pattern

### 1. Zod Schema (in _lib/validations.ts)
```typescript
export const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["mosque", "surau", "others"]),
  state: z.string().min(1, "State is required"),
});

export type FormData = z.infer<typeof formSchema>;
```

### 2. Server Action (in _lib/actions.ts)
```typescript
"use server";

export type FormState = 
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; errors: Record<string, string[]> };

export async function submitForm(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Extract form data
  const raw = {
    name: formData.get("name"),
    category: formData.get("category"),
    state: formData.get("state"),
  };

  // Validate with Zod
  const parsed = formSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  // Check authentication
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    return {
      status: "error",
      errors: { general: ["Authentication required"] },
    };
  }

  try {
    // Database operation
    await db.insert(table).values({
      ...parsed.data,
      contributorId: session.user.id,
    });

    // Revalidate affected paths
    revalidatePath("/");
    revalidatePath("/my-contributions");

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      errors: { general: ["Failed to save data"] },
    };
  }
}
```

### 3. Form Component
```typescript
"use client";

export default function FormComponent() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "mosque",
      state: "",
    },
  });

  const [state, formAction] = useFormState(submitForm, { status: "idle" });

  const onSubmit = (data: FormData) => {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("category", data.category);
    formData.set("state", data.state);
    
    formAction(formData);
  };

  return (
    <form action={formAction} onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("name")} />
      {form.formState.errors.name && (
        <p className="text-red-500">{form.formState.errors.name.message}</p>
      )}
      
      <select {...form.register("category")}>
        <option value="mosque">Mosque</option>
        <option value="surau">Surau</option>
        <option value="others">Others</option>
      </select>
      
      <button type="submit">Submit</button>
      
      {state.status === "error" && (
        <div className="text-red-500">
          {Object.values(state.errors).flat().join(", ")}
        </div>
      )}
    </form>
  );
}
```

## File Upload Pattern

### Server Action with File Upload
```typescript
export async function uploadForm(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const file = formData.get("qrImage") as File | null;
  let qrImageUrl: string | undefined;

  if (file && file.size > 0) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const filename = `${randomUUID()}.${file.name.split(".").pop()}`;
    const relativePath = path.join("uploads", filename);
    const diskPath = path.join(process.cwd(), "public", relativePath);
    
    await fs.mkdir(path.dirname(diskPath), { recursive: true });
    await fs.writeFile(diskPath, buffer);
    
    qrImageUrl = `/${relativePath}`;
  }

  // Continue with form processing...
}
```

## Form State Management

### Loading States
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (data: FormData) => {
  setIsLoading(true);
  // Form submission
  setIsLoading(false);
};
```

### Error Handling
```typescript
// Display errors from server action
{state.status === "error" && (
  <div className="space-y-1">
    {Object.entries(state.errors).map(([field, errors]) => (
      <p key={field} className="text-red-500 text-sm">
        {errors.join(", ")}
      </p>
    ))}
  </div>
)}
```

## Best Practices

1. **Always validate on server** - Never trust client-side validation alone
2. **Use `revalidatePath()`** - Refresh affected pages after mutations
3. **Handle authentication** - Check user session in server actions
4. **Structured error states** - Return consistent error objects
5. **Loading states** - Show feedback during form submission
6. **File uploads** - Handle files properly with proper validation