import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<Card key={i}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-4" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-8 w-16 mb-2" />
						<Skeleton className="h-3 w-32 mb-2" />
						<Skeleton className="h-5 w-16" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function ChartSkeleton() {
	return (
		<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
			{Array.from({ length: 3 }).map((_, i) => (
				<Card key={i}>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-64 w-full" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function MapSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="grid grid-cols-3 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="text-center">
								<Skeleton className="h-8 w-12 mx-auto mb-2" />
								<Skeleton className="h-3 w-20 mx-auto" />
							</div>
						))}
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center justify-between p-2 bg-muted/50 rounded"
							>
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-4 w-24" />
								</div>
								<Skeleton className="h-4 w-8" />
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function TableSkeleton() {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-8 w-20" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="grid grid-cols-7 gap-4 pb-2 border-b">
						{Array.from({ length: 7 }).map((_, i) => (
							<Skeleton key={i} className="h-4 w-full" />
						))}
					</div>
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="grid grid-cols-7 gap-4 py-2">
							{Array.from({ length: 7 }).map((_, j) => (
								<Skeleton key={j} className="h-4 w-full" />
							))}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
