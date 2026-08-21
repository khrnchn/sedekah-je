import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
	return (
		<div className="flex min-h-screen">
			{/* Sidebar skeleton */}
			<div className="w-64 border-r bg-background p-4">
				<Skeleton className="h-8 w-32 mb-6" />
				<div className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>

			{/* Main content skeleton */}
			<div className="flex-1 p-6">
				<div className="space-y-6">
					{/* Breadcrumb skeleton */}
					<div className="flex items-center space-x-2">
						<Skeleton className="h-4 w-16" />
						<span>/</span>
						<Skeleton className="h-4 w-20" />
					</div>

					{/* Title skeleton */}
					<div className="space-y-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-80" />
					</div>

					{/* Content skeleton */}
					<div className="space-y-4">
						<Skeleton className="h-64 w-full" />
						<Skeleton className="h-32 w-full" />
					</div>
				</div>
			</div>
		</div>
	);
}
