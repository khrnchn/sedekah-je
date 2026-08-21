import { Skeleton } from "@/components/ui/skeleton";

export default function RejectedTableLoading() {
	return (
		<div className="space-y-4">
			{/* Search and filter skeleton */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-64" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-36" />
					<Skeleton className="h-8 w-36" />
				</div>
			</div>

			{/* Table skeleton */}
			<div className="rounded-lg border">
				{/* Table header */}
				<div className="border-b p-4">
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-16" />
					</div>
				</div>

				{/* Table rows */}
				<div className="divide-y">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="flex items-center justify-between p-4">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-8" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
