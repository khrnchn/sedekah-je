import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import {
	AsyncActivityFeed,
	AsyncDashboardCharts,
	AsyncDashboardMap,
	AsyncDashboardStats,
	AsyncInstitutionTable,
	AsyncRealTimeMetrics,
	AsyncTopContributors,
} from "./components/async-components";
import {
	ChartSkeleton,
	MapSkeleton,
	StatsSkeleton,
	TableSkeleton,
} from "./components/loading-skeletons";

export default function DashboardPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						{/* Dashboard Statistics */}
						<div className="px-4 lg:px-6">
							<Suspense fallback={<StatsSkeleton />}>
								<AsyncDashboardStats />
							</Suspense>
						</div>

						{/* Charts Section */}
						<div className="px-4 lg:px-6">
							<Suspense fallback={<ChartSkeleton />}>
								<AsyncDashboardCharts />
							</Suspense>
						</div>

						{/* Map and Contributors Grid */}
						<div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<Suspense fallback={<MapSkeleton />}>
									<AsyncDashboardMap />
								</Suspense>
							</div>
							<div className="space-y-4">
								<Suspense
									fallback={
										<div className="h-56 bg-muted rounded-lg animate-pulse" />
									}
								>
									<AsyncTopContributors />
								</Suspense>
								<Suspense
									fallback={
										<div className="h-56 bg-muted rounded-lg animate-pulse" />
									}
								>
									<AsyncActivityFeed />
								</Suspense>
							</div>
						</div>

						{/* Real-time Metrics */}
						<div className="px-4 lg:px-6">
							<Suspense fallback={<StatsSkeleton />}>
								<AsyncRealTimeMetrics />
							</Suspense>
						</div>

						{/* Recent Institutions Table */}
						<div className="px-4 lg:px-6">
							<Suspense fallback={<TableSkeleton />}>
								<AsyncInstitutionTable />
							</Suspense>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
