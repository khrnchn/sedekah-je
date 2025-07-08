import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
	columns: number;
	rows: number;
	showHeader?: boolean;
	showToolbar?: boolean;
}

export function TableSkeleton({ 
	columns, 
	rows, 
	showHeader = true, 
	showToolbar = true 
}: TableSkeletonProps) {
	return (
		<div className="space-y-4">
			{/* Toolbar skeleton */}
			{showToolbar && (
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-8 w-36" />
						<Skeleton className="h-8 w-36" />
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-8 w-32" />
					</div>
				</div>
			)}

			{/* Table skeleton */}
			<div className="rounded-lg border">
				{/* Header skeleton */}
				{showHeader && (
					<div className="border-b p-4">
						<div className="flex items-center justify-between">
							{Array.from({ length: columns }).map((_, i) => (
								<Skeleton key={i} className="h-4 w-24" />
							))}
						</div>
					</div>
				)}

				{/* Rows skeleton */}
				<div className="divide-y">
					{Array.from({ length: rows }).map((_, i) => (
						<div key={i} className="flex items-center justify-between p-4">
							{Array.from({ length: columns }).map((_, j) => (
								<Skeleton key={j} className="h-4 w-20" />
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}