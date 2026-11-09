import { Skeleton } from "@/components/ui/skeleton";

export default function QuestLoading() {
	return (
		<div className="flex h-dvh w-full flex-col bg-background">
			<div className="border-b border-border px-4 pb-3 pt-4">
				<div className="flex items-center justify-between gap-2">
					<div className="space-y-1.5">
						<Skeleton className="h-5 w-32 bg-accent" />
						<Skeleton className="h-3 w-16 bg-accent" />
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-8 w-12 bg-accent" />
						<Skeleton className="h-11 w-11 bg-accent" />
						<Skeleton className="h-11 w-11 bg-accent" />
					</div>
				</div>
				<Skeleton className="mt-2 h-[3px] w-full bg-accent" />
				<Skeleton className="mt-3 h-12 w-full rounded-lg bg-accent" />
			</div>
			<Skeleton className="flex-1 rounded-none bg-muted" />
		</div>
	);
}
