import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import { ActivityFeed } from "./components/activity-feed";
import { DashboardCharts } from "./components/dashboard-charts";
import { DashboardMap } from "./components/dashboard-map";
import { DashboardStats } from "./components/dashboard-stats";
import { InstitutionTable } from "./components/institution-table";
import {
	ChartSkeleton,
	MapSkeleton,
	StatsSkeleton,
	TableSkeleton,
} from "./components/loading-skeletons";
import { RealTimeMetrics } from "./components/real-time-metrics";
import { StreamingStatsComponent } from "./components/streaming-stats";
import { TopContributors } from "./components/top-contributors";
import { getDashboardData } from "./queries";

// Optimized dashboard component that fetches all data once
async function DashboardContent() {
	const dashboardData = await getDashboardData();

	return (
		<div className="@container/main flex flex-1 flex-col gap-2">
			<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
				{/* Dashboard Statistics */}
				<div className="px-4 lg:px-6">
					<DashboardStats data={dashboardData.stats} />
				</div>

				{/* Streaming Statistics - Now uses cached data */}
				<div className="px-4 lg:px-6">
					<StreamingStatsComponent
						stats={dashboardData.stats}
						stateData={dashboardData.stateData}
					/>
				</div>

				{/* Charts Section */}
				<div className="px-4 lg:px-6">
					<DashboardCharts
						categoryData={dashboardData.categoryData}
						stateData={dashboardData.stateData}
						monthlyData={dashboardData.monthlyGrowth}
					/>
				</div>

				{/* Map and Contributors Grid */}
				<div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<DashboardMap
							institutions={dashboardData.institutionsWithCoords}
							stateData={dashboardData.stateData}
						/>
					</div>
					<div className="space-y-4">
						<TopContributors data={dashboardData.topContributors} />
						<ActivityFeed data={dashboardData.latestActivities} />
					</div>
				</div>

				{/* Real-time Metrics */}
				<div className="px-4 lg:px-6">
					<RealTimeMetrics data={dashboardData.stats} />
				</div>

				{/* Recent Institutions Table */}
				<div className="px-4 lg:px-6">
					<InstitutionTable data={dashboardData.latestActivities} />
				</div>
			</div>
		</div>
	);
}

export default function DashboardPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col">
					<Suspense
						fallback={
							<div className="@container/main flex flex-1 flex-col gap-2">
								<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
									<div className="px-4 lg:px-6">
										<StatsSkeleton />
									</div>
									<div className="px-4 lg:px-6">
										<StatsSkeleton />
									</div>
									<div className="px-4 lg:px-6">
										<ChartSkeleton />
									</div>
									<div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-3">
										<div className="lg:col-span-2">
											<MapSkeleton />
										</div>
										<div className="space-y-4">
											<div className="h-56 bg-muted rounded-lg animate-pulse" />
											<div className="h-56 bg-muted rounded-lg animate-pulse" />
										</div>
									</div>
									<div className="px-4 lg:px-6">
										<StatsSkeleton />
									</div>
									<div className="px-4 lg:px-6">
										<TableSkeleton />
									</div>
								</div>
							</div>
						}
					>
						<DashboardContent />
					</Suspense>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
