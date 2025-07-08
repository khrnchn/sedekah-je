import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
	fields: number;
	showTitle?: boolean;
	showActions?: boolean;
}

export function FormSkeleton({ 
	fields, 
	showTitle = true, 
	showActions = true 
}: FormSkeletonProps) {
	return (
		<div className="space-y-6">
			{/* Title skeleton */}
			{showTitle && (
				<div className="space-y-2">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-80" />
				</div>
			)}

			{/* Form fields skeleton */}
			<div className="space-y-4">
				{Array.from({ length: fields }).map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>
				))}
			</div>

			{/* Actions skeleton */}
			{showActions && (
				<div className="flex items-center gap-2">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-24" />
				</div>
			)}
		</div>
	);
}