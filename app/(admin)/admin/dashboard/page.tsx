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

export default function DashboardPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
							{/* Dashboard Statistics */}
							<div className="px-4 lg:px-6">
								<Suspense fallback={<StatsSkeleton />}>
									<DashboardStats />
								</Suspense>
							</div>

							{/* Streaming Statistics - Demonstrates Next.js streaming */}
							<div className="px-4 lg:px-6">
								<Suspense fallback={<StatsSkeleton />}>
									<StreamingStatsComponent />
								</Suspense>
							</div>

							{/* Charts Section */}
							<div className="px-4 lg:px-6">
								<Suspense fallback={<ChartSkeleton />}>
									<DashboardCharts />
								</Suspense>
							</div>

							{/* Map and Contributors Grid */}
							<div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-3">
								<div className="lg:col-span-2">
									<Suspense fallback={<MapSkeleton />}>
										<DashboardMap />
									</Suspense>
								</div>
								<div className="space-y-4">
									<Suspense
										fallback={
											<div className="h-56 bg-muted rounded-lg animate-pulse" />
										}
									>
										<TopContributors />
									</Suspense>
									<Suspense
										fallback={
											<div className="h-56 bg-muted rounded-lg animate-pulse" />
										}
									>
										<ActivityFeed />
									</Suspense>
								</div>
							</div>

							{/* Real-time Metrics */}
							<div className="px-4 lg:px-6">
								<Suspense fallback={<StatsSkeleton />}>
									<RealTimeMetrics />
								</Suspense>
							</div>

							{/* Recent Institutions Table */}
							<div className="px-4 lg:px-6">
								<Suspense fallback={<TableSkeleton />}>
									<InstitutionTable />
								</Suspense>
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
