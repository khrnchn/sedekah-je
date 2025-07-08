import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

// Mock data fetching functions (replace with actual API calls)
async function getTotalInstitutions() {
	// Simulate API call
	await new Promise(resolve => setTimeout(resolve, 500));
	return { value: "1,234", change: "+12%", label: "Total Institutions" };
}

async function getPendingReviews() {
	await new Promise(resolve => setTimeout(resolve, 800));
	return { value: "23", change: "+2", label: "Pending Review" };
}

async function getActiveUsers() {
	await new Promise(resolve => setTimeout(resolve, 600));
	return { value: "456", change: "+5%", label: "Active Users" };
}

async function getQRScans() {
	await new Promise(resolve => setTimeout(resolve, 700));
	return { value: "8,901", change: "+18%", label: "QR Scans" };
}

// Individual stat card component
type StatData = {
	value: string;
	change: string;
	label: string;
};

async function StatCard({ dataPromise }: { dataPromise: Promise<StatData> }) {
	const stat = await dataPromise;

	return (
		<div className="rounded-lg border p-4 space-y-2">
			<div className="text-sm font-medium text-muted-foreground">
				{stat.label}
			</div>
			<div className="text-2xl font-bold">{stat.value}</div>
			<div className="text-xs text-green-600">
				{stat.change} from last month
			</div>
		</div>
	);
}

// Improved dashboard stats with parallel data fetching
async function DashboardStats() {
	// Next.js 14 pattern: Start all fetches in parallel
	const [institutions, pending, users, scans] = await Promise.all([
		getTotalInstitutions(),
		getPendingReviews(),
		getActiveUsers(),
		getQRScans(),
	]);

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<div className="rounded-lg border p-4 space-y-2">
				<div className="text-sm font-medium text-muted-foreground">
					{institutions.label}
				</div>
				<div className="text-2xl font-bold">{institutions.value}</div>
				<div className="text-xs text-green-600">
					{institutions.change} from last month
				</div>
			</div>

			<div className="rounded-lg border p-4 space-y-2">
				<div className="text-sm font-medium text-muted-foreground">
					{pending.label}
				</div>
				<div className="text-2xl font-bold">{pending.value}</div>
				<div className="text-xs text-green-600">
					{pending.change} from last month
				</div>
			</div>

			<div className="rounded-lg border p-4 space-y-2">
				<div className="text-sm font-medium text-muted-foreground">
					{users.label}
				</div>
				<div className="text-2xl font-bold">{users.value}</div>
				<div className="text-xs text-green-600">
					{users.change} from last month
				</div>
			</div>

			<div className="rounded-lg border p-4 space-y-2">
				<div className="text-sm font-medium text-muted-foreground">
					{scans.label}
				</div>
				<div className="text-2xl font-bold">{scans.value}</div>
				<div className="text-xs text-green-600">
					{scans.change} from last month
				</div>
			</div>
		</div>
	);
}

// Alternative: Progressive loading with individual Suspense boundaries
export function AsyncDashboardStatsProgressive() {
	// Start all promises immediately (don't await)
	const institutionsPromise = getTotalInstitutions();
	const pendingPromise = getPendingReviews();
	const usersPromise = getActiveUsers();
	const scansPromise = getQRScans();

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Suspense fallback={<StatSkeleton />}>
				<StatCard dataPromise={institutionsPromise} />
			</Suspense>
			<Suspense fallback={<StatSkeleton />}>
				<StatCard dataPromise={pendingPromise} />
			</Suspense>
			<Suspense fallback={<StatSkeleton />}>
				<StatCard dataPromise={usersPromise} />
			</Suspense>
			<Suspense fallback={<StatSkeleton />}>
				<StatCard dataPromise={scansPromise} />
			</Suspense>
		</div>
	);
}

// Single stat skeleton
function StatSkeleton() {
	return (
		<div className="rounded-lg border p-4 space-y-2">
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-8 w-16" />
			<Skeleton className="h-3 w-32" />
		</div>
	);
}

// Loading fallback component for all stats
function StatsLoading() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<StatSkeleton key={i} />
			))}
		</div>
	);
}

// Main component with Suspense boundary (original approach with parallel fetching)
export function AsyncDashboardStats() {
	return (
		<Suspense fallback={<StatsLoading />}>
			<DashboardStats />
		</Suspense>
	);
}
