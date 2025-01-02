"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QRSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload QR Image</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Image Avatar Skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" /> {/* Circular avatar */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" /> {/* Placeholder for text */}
              <Skeleton className="h-4 w-32" /> {/* Placeholder for text */}
            </div>
          </div>

          {/* Upload Button Skeleton */}
          <Skeleton className="h-10 w-full rounded-md" /> {/* Upload button */}
        </div>
      </CardContent>
    </Card>
  );
}