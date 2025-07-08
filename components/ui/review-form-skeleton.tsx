import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReviewFormSkeleton() {
	return (
		<div className="space-y-6">
			{/* Institution Info Section */}
			<Card className="p-4 mb-6 rounded-lg shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						📋 Institution Info
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>

					<div className="space-y-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-10 w-full" />
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-10 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-10 w-full" />
						</div>
					</div>

					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-20 w-full" />
					</div>

					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-20 w-full" />
					</div>
				</CardContent>
			</Card>

			{/* Social Media Links Section */}
			<Card className="p-4 mb-6 rounded-lg shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						🔗 Social Media Links
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<div className="flex gap-2">
								<Skeleton className="h-10 flex-1" />
								<Skeleton className="h-10 w-10" />
							</div>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Contributor Info Section */}
			<Card className="p-4 mb-6 rounded-lg shadow-sm bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						👤 Contributor Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<div className="p-3 bg-background rounded-md border space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-48" />
							</div>
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-28" />
							<div className="p-3 bg-background rounded-md border space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-16" />
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-40" />
						<div className="flex gap-2">
							<Skeleton className="h-10 flex-1" />
							<Skeleton className="h-10 w-10" />
						</div>
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-20 w-full" />
					</div>
				</CardContent>
			</Card>

			{/* Review History Section */}
			<Card className="p-4 mb-6 rounded-lg shadow-sm border-dashed border-2 border-muted-foreground/30">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						📋 Review History
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<Skeleton className="h-16 w-16 mb-4" />
						<Skeleton className="h-6 w-32 mb-2" />
						<Skeleton className="h-4 w-80" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}