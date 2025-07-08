import { Skeleton } from "@/components/ui/skeleton";

export default function ApprovedTableLoading() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-[200px]" />
				<Skeleton className="h-8 w-[100px]" />
			</div>
			<div className="border rounded-md">
				<div className="border-b p-4">
					<div className="flex items-center justify-between">
						<Skeleton className="h-6 w-[150px]" />
						<div className="flex space-x-2">
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-8" />
						</div>
					</div>
				</div>
				{Array.from({ length: 5 }).map((_, index) => (
					<div key={index} className="flex items-center space-x-4 p-4">
						<Skeleton className="h-4 w-[50px]" />
						<Skeleton className="h-4 w-[200px]" />
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-4 w-[100px]" />
					</div>
				))}
			</div>
		</div>
	);
}
