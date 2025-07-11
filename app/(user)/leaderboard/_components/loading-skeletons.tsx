import { Skeleton } from "@/components/ui/skeleton";
import { StatsGrid } from "@/components/user-page-components";

export function TopContributorsSkeleton() {
	return (
		<div className="flex items-end justify-center gap-2 md:gap-4">
			{/* Second Place Skeleton */}
			<div className="flex flex-col items-center w-1/3">
				<Skeleton className="w-12 h-12 md:w-20 md:h-20 rounded-full" />
				<div className="text-center mt-2 space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-3 w-16" />
				</div>
				<Skeleton className="w-full h-16 md:h-24 mt-2" />
			</div>

			{/* First Place Skeleton */}
			<div className="flex flex-col items-center w-1/3">
				<Skeleton className="w-16 h-16 md:w-24 md:h-24 rounded-full" />
				<div className="text-center mt-2 space-y-2">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-3 w-20" />
				</div>
				<Skeleton className="w-full h-20 md:h-32 mt-2" />
			</div>

			{/* Third Place Skeleton */}
			<div className="flex flex-col items-center w-1/3">
				<Skeleton className="w-12 h-12 md:w-20 md:h-20 rounded-full" />
				<div className="text-center mt-2 space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-3 w-16" />
				</div>
				<Skeleton className="w-full h-12 md:h-20 mt-2" />
			</div>
		</div>
	);
}

export function LeaderboardLoadingFallback() {
	return (
		<div className="space-y-8">
			<StatsGrid cols={4} loading={true} />
			<TopContributorsSkeleton />
		</div>
	);
}
