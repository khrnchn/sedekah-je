import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

// Shared stat card component
interface StatCardProps {
	icon?: LucideIcon;
	value: number | string;
	label: string;
	className?: string;
}

export function StatCard({
	icon: Icon,
	value,
	label,
	className,
}: StatCardProps) {
	return (
		<Card className={className}>
			<CardContent className="p-3 md:p-4 text-center">
				{Icon && (
					<Icon className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
				)}
				<div className="text-xl md:text-2xl font-bold">{value}</div>
				<p className="text-xs md:text-sm text-muted-foreground">{label}</p>
			</CardContent>
		</Card>
	);
}

// Shared stat card skeleton
export function StatCardSkeleton() {
	return (
		<Card>
			<CardContent className="p-3 md:p-4 text-center">
				<Skeleton className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2" />
				<Skeleton className="h-8 w-16 mx-auto" />
				<Skeleton className="h-4 w-20 mx-auto mt-2" />
			</CardContent>
		</Card>
	);
}

// Grid of stat cards with loading state
interface StatsGridProps {
	children?: React.ReactNode;
	cols?: 2 | 3 | 4;
	loading?: boolean;
}

export function StatsGrid({
	children,
	cols = 3,
	loading = false,
}: StatsGridProps) {
	const gridClass = {
		2: "grid-cols-2",
		3: "grid-cols-2 md:grid-cols-3",
		4: "grid-cols-2 md:grid-cols-4",
	}[cols];

	if (loading) {
		return (
			<div className={`grid ${gridClass} gap-4`}>
				{Array.from({ length: cols }, (_, i) => (
					<StatCardSkeleton key={i} />
				))}
			</div>
		);
	}

	return <div className={`grid ${gridClass} gap-4`}>{children}</div>;
}

// Empty state component
interface EmptyStateProps {
	title: string;
	description: string;
	icon?: LucideIcon;
}

export function EmptyState({
	title,
	description,
	icon: Icon,
}: EmptyStateProps) {
	return (
		<div className="text-center py-12">
			{Icon && (
				<Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
			)}
			<h3 className="text-lg font-semibold">{title}</h3>
			<p className="text-muted-foreground mt-2 max-w-md mx-auto">
				{description}
			</p>
		</div>
	);
}

// Loading skeleton for list items
export function ListItemSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }, (_, i) => (
				<div
					key={i}
					className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg"
				>
					<Skeleton className="w-8 h-8 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-3 w-1/2" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-6 w-16" />
						<Skeleton className="h-6 w-20" />
					</div>
				</div>
			))}
		</div>
	);
}
