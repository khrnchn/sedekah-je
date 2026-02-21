import { Skeleton } from "@/components/ui/skeleton";

export default function QuestLoading() {
	return (
		<div className="flex h-dvh w-full bg-zinc-950">
			<div className="hidden md:flex w-80 flex-col border-r border-zinc-800">
				<div className="p-4 space-y-3">
					<Skeleton className="h-8 w-48 bg-zinc-800" />
					<Skeleton className="h-4 w-32 bg-zinc-800" />
					<Skeleton className="h-2 w-full bg-zinc-800" />
				</div>
				<div className="p-4 space-y-2">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="h-14 w-full bg-zinc-800" />
					))}
				</div>
			</div>
			<div className="flex-1">
				<Skeleton className="h-full w-full bg-zinc-900" />
			</div>
		</div>
	);
}
