import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClaimsTableLoading() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{[...Array(6)].map((_, i) => (
				<Card key={i} className="animate-pulse">
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between">
							<div className="flex-1 space-y-2">
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
							</div>
							<Skeleton className="h-5 w-16" />
						</div>
					</CardHeader>
					<CardContent className="pt-0 space-y-3">
						<div className="space-y-2">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-40" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-3 w-16" />
							<Skeleton className="h-4 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-3 w-12" />
							<Skeleton className="h-3 w-24" />
						</div>
						<div className="flex gap-2 pt-2">
							<Skeleton className="h-8 flex-1" />
							<Skeleton className="h-8 flex-1" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
