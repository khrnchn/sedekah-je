import { AppSidebar } from "@/components/app-sidebar";
import {
	AsyncDashboardStats,
	AsyncDashboardStatsProgressive,
} from "@/components/async-dashboard-stats";
import { AsyncSectionCards } from "@/components/async-section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Home } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

// Simulated async components for demo
async function AsyncChart() {
	await new Promise((resolve) => setTimeout(resolve, 2000));
	return <ChartAreaInteractive />;
}

async function AsyncDataTable() {
	await new Promise((resolve) => setTimeout(resolve, 3000));
	const mockData = [
		{
			id: 1,
			status: "pending",
			reviewer: "Admin",
			limit: "None",
			header: "Mosque A",
			type: "mosque",
			target: "100%",
		},
		{
			id: 2,
			status: "approved",
			reviewer: "Admin",
			limit: "None",
			header: "Surau B",
			type: "surau",
			target: "100%",
		},
		{
			id: 3,
			status: "rejected",
			reviewer: "Admin",
			limit: "None",
			header: "Islamic Center C",
			type: "others",
			target: "100%",
		},
	];
	return <DataTable data={mockData} />;
}

function ChartLoading() {
	return (
		<div className="rounded-lg border p-6">
			<Skeleton className="h-6 w-32 mb-4" />
			<Skeleton className="h-64 w-full" />
		</div>
	);
}

export default function StreamingDemoPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
					<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mx-2 data-[orientation=vertical]:h-4"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link
											href="/admin/dashboard"
											className="flex items-center gap-1"
										>
											<Home className="h-4 w-4" />
											<span className="sr-only">Admin Dashboard</span>
										</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link href="/admin/dashboard">Dashboard</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link href="/admin">Admin</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>Streaming Demo</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
							<div className="px-4 lg:px-6">
								<h1 className="text-2xl font-semibold tracking-tight">
									Next.js Loading Patterns Demo
								</h1>
								<p className="text-muted-foreground mt-1">
									Demonstration of loading.tsx, Suspense boundaries, and
									streaming patterns
								</p>
							</div>
							<div className="px-4 lg:px-6">
								<div className="space-y-8">
									{/* Section 0: Next.js 14 Improvements */}
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h2 className="text-xl font-semibold">
												Next.js 14 Enhanced Patterns
											</h2>
											<div className="text-sm text-muted-foreground">
												Parallel fetching & progressive loading
											</div>
										</div>

										<div className="grid gap-6 lg:grid-cols-2">
											<div className="space-y-3">
												<h3 className="font-medium">
													Original: Parallel Data Fetching
												</h3>
												<AsyncDashboardStats />
											</div>

											<div className="space-y-3">
												<h3 className="font-medium">
													Progressive: Individual Suspense
												</h3>
												<AsyncDashboardStatsProgressive />
											</div>
										</div>
									</div>

									{/* Section 1: Progressive card loading */}
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h2 className="text-xl font-semibold">
												Progressive Loading Cards
											</h2>
											<div className="text-sm text-muted-foreground">
												Each card loads independently
											</div>
										</div>
										<AsyncSectionCards />
									</div>

									{/* Section 2: Chart with loading boundary */}
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h2 className="text-xl font-semibold">
												Chart with Suspense
											</h2>
											<div className="text-sm text-muted-foreground">
												2 second delay simulation
											</div>
										</div>
										<Suspense fallback={<ChartLoading />}>
											<AsyncChart />
										</Suspense>
									</div>

									{/* Section 3: Data table with loading boundary */}
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h2 className="text-xl font-semibold">
												Data Table with Suspense
											</h2>
											<div className="text-sm text-muted-foreground">
												3 second delay simulation
											</div>
										</div>
										<Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
											<AsyncDataTable />
										</Suspense>
									</div>

									{/* Section 4: Loading Indicators */}
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h2 className="text-xl font-semibold">
												Loading Indicators
											</h2>
											<div className="text-sm text-muted-foreground">
												Various loading feedback patterns
											</div>
										</div>

										<div className="grid gap-4 md:grid-cols-3">
											<div className="rounded-lg border p-4 space-y-2">
												<h3 className="font-medium">Spinner</h3>
												<div className="flex items-center gap-2">
													<LoadingIndicator variant="spinner" size="sm" />
													<LoadingIndicator variant="spinner" size="md" />
													<LoadingIndicator variant="spinner" size="lg" />
												</div>
											</div>

											<div className="rounded-lg border p-4 space-y-2">
												<h3 className="font-medium">Dots</h3>
												<div className="flex items-center gap-4">
													<LoadingIndicator variant="dots" size="sm" />
													<LoadingIndicator variant="dots" size="md" />
													<LoadingIndicator variant="dots" size="lg" />
												</div>
											</div>

											<div className="rounded-lg border p-4 space-y-2">
												<h3 className="font-medium">Pulse</h3>
												<div className="flex items-center gap-2">
													<LoadingIndicator variant="pulse" size="sm" />
													<LoadingIndicator variant="pulse" size="md" />
													<LoadingIndicator variant="pulse" size="lg" />
												</div>
											</div>
										</div>
									</div>

									{/* Section 5: Explanation of patterns */}
									<div className="space-y-4">
										<h2 className="text-xl font-semibold">
											Next.js 14 Loading Patterns Implemented
										</h2>
										<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
											<div className="rounded-lg border p-4">
												<h3 className="font-semibold mb-2">
													1. Route-level Loading
												</h3>
												<p className="text-sm text-muted-foreground">
													loading.tsx files provide instant feedback during
													navigation
												</p>
											</div>
											<div className="rounded-lg border p-4">
												<h3 className="font-semibold mb-2">
													2. Error Boundaries
												</h3>
												<p className="text-sm text-muted-foreground">
													error.tsx files catch errors and provide recovery
													options
												</p>
											</div>
											<div className="rounded-lg border p-4">
												<h3 className="font-semibold mb-2">
													3. Parallel Data Fetching
												</h3>
												<p className="text-sm text-muted-foreground">
													Promise.all() pattern to fetch data concurrently
												</p>
											</div>
											<div className="rounded-lg border p-4">
												<h3 className="font-semibold mb-2">
													4. Component Suspense
												</h3>
												<p className="text-sm text-muted-foreground">
													Individual components wrapped in Suspense boundaries
												</p>
											</div>
											<div className="rounded-lg border p-4">
												<h3 className="font-semibold mb-2">
													5. Progressive Loading
												</h3>
												<p className="text-sm text-muted-foreground">
													Multiple Suspense boundaries for staged content
													rendering
												</p>
											</div>
											<div className="rounded-lg border p-4">
												<h3 className="font-semibold mb-2">
													6. Skeleton Components
												</h3>
												<p className="text-sm text-muted-foreground">
													Custom skeletons that match content structure
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
