// app/dashboard/institutions/create/loading.tsx

import { Spinner } from "@/components/ui/spinner";

// TODO: use form skeleton
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner className="h-12 w-12" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
