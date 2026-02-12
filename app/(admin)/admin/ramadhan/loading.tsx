import { Skeleton } from "@/components/ui/skeleton";

export default function RamadhanLoading() {
	return (
		<div className="space-y-6">
			<div className="flex gap-4">
				<Skeleton className="h-10 w-32" />
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-10 w-24" />
			</div>
			<div className="rounded-md border">
				<Skeleton className="h-12 w-full" />
				{Array.from({ length: 30 }).map((_, i) => (
					<Skeleton key={i} className="h-16 w-full border-t" />
				))}
			</div>
		</div>
	);
}
