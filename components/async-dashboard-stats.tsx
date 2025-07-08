import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

// Simulate an async component that fetches data
async function DashboardStats() {
	// This would be replaced with actual data fetching
	// await new Promise(resolve => setTimeout(resolve, 2000));

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{[
				{ title: "Total Institutions", value: "1,234", change: "+12%" },
				{ title: "Pending Review", value: "23", change: "+2%" },
				{ title: "Active Users", value: "456", change: "+5%" },
				{ title: "QR Scans", value: "8,901", change: "+18%" },
			].map((stat, i) => (
				<div key={i} className="rounded-lg border p-4 space-y-2">
					<div className="text-sm font-medium text-muted-foreground">
						{stat.title}
					</div>
					<div className="text-2xl font-bold">{stat.value}</div>
					<div className="text-xs text-green-600">
						{stat.change} from last month
					</div>
				</div>
			))}
		</div>
	);
}

// Loading fallback component
function StatsLoading() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="rounded-lg border p-4 space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-8 w-16" />
					<Skeleton className="h-3 w-32" />
				</div>
			))}
		</div>
	);
}

// Main component with Suspense boundary
export function AsyncDashboardStats() {
	return (
		<Suspense fallback={<StatsLoading />}>
			<DashboardStats />
		</Suspense>
	);
}
