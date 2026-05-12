import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ChapterSkeleton({ className }: { className?: string }) {
	return (
		<section className={cn("mt-14 sm:mt-18 md:mt-22", className)}>
			<Skeleton className="mb-2 h-3 w-20" />
			<Skeleton className="mb-3 h-7 w-64 sm:h-8 sm:w-72 md:h-10 md:w-80" />
			<Skeleton className="mb-6 h-4 w-full max-w-lg" />
			<div className="space-y-4">
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<div>
						<Skeleton className="mb-2 h-3 w-24" />
						<Skeleton className="h-12 w-32 sm:h-14 md:h-16" />
						<Skeleton className="mt-1 h-3 w-40" />
					</div>
					<div className="space-y-4">
						<div>
							<Skeleton className="mb-2 h-3 w-24" />
							<Skeleton className="h-8 w-24" />
							<Skeleton className="mt-1 h-3 w-32" />
						</div>
						<div>
							<Skeleton className="mb-2 h-3 w-24" />
							<Skeleton className="h-8 w-24" />
							<Skeleton className="mt-1 h-3 w-32" />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export function ChartSkeleton() {
	return (
		<div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
			<div className="p-4 pt-5 sm:p-5 sm:pt-6">
				<Skeleton className="mb-2 h-5 w-36" />
				<Skeleton className="mb-4 h-3 w-48" />
				<Skeleton className="h-[210px] w-full min-[400px]:h-[240px] sm:h-[260px] md:h-[280px]" />
			</div>
		</div>
	);
}

export function UmamiSectionsSkeleton() {
	return <ChapterSkeleton />;
}

export function GitHubSectionSkeleton() {
	return <ChapterSkeleton />;
}
