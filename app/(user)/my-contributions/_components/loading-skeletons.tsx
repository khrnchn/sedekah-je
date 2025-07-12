import { Skeleton } from "@/components/ui/skeleton";
import { StatsGrid } from "@/components/user-page-components";

export function StatsCardsSkeleton() {
	return <StatsGrid cols={4} loading={true} />;
}

export function ContributionListSkeleton() {
	return (
		<div className="space-y-4">
			{[...Array(5)].map((_, i) => (
				<div
					key={i}
					className="flex items-center justify-between p-4 border rounded-lg"
				>
					<div className="space-y-2">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-3 w-32" />
					</div>
					<Skeleton className="h-8 w-24" />
				</div>
			))}
		</div>
	);
}

export function MyContributionsLoadingFallback() {
	return (
		<div className="space-y-8">
			<StatsCardsSkeleton />
			<ContributionListSkeleton />
		</div>
	);
}
