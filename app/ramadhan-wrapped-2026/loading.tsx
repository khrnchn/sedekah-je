import { Header } from "@/components/shared/header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChapterSkeleton } from "./_components/loading-skeletons";

export default function RamadhanWrappedLoading() {
	return (
		<>
			<Header compactMobileBrand />
			<main className="min-h-screen bg-background dark:bg-background">
				<div
					className={cn(
						"mx-auto w-full max-w-3xl px-4 pt-12",
						"pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
						"sm:px-6 sm:pt-16 md:pt-20",
						"md:pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]",
					)}
				>
					<div className="relative mb-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:mb-6 sm:p-8 md:p-10 dark:border-border/80 dark:shadow-none">
						<Skeleton className="mb-2 h-4 w-20" />
						<Skeleton className="h-8 w-64 sm:h-10 md:h-12" />
						<Skeleton className="mt-4 h-4 w-full max-w-md" />
					</div>

					<ChapterSkeleton />
					<ChapterSkeleton />
					<ChapterSkeleton />
					<ChapterSkeleton />
					<ChapterSkeleton />
				</div>
			</main>
		</>
	);
}
