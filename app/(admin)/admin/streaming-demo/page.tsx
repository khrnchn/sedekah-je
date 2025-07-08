import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { AsyncSectionCards } from "@/components/async-section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
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
				<AdminDashboardLayout
					breadcrumbs={[
						{ label: "Admin", href: "/admin" },
						{ label: "Streaming Demo" },
					]}
					title="Next.js Loading Patterns Demo"
					description="Demonstration of loading.tsx, Suspense boundaries, and streaming patterns"
				>
					<div className="space-y-8">
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
								<h2 className="text-xl font-semibold">Chart with Suspense</h2>
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

						{/* Section 4: Explanation of patterns */}
						<div className="space-y-4">
							<h2 className="text-xl font-semibold">
								Loading Patterns Implemented
							</h2>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="rounded-lg border p-4">
									<h3 className="font-semibold mb-2">1. Route-level Loading</h3>
									<p className="text-sm text-muted-foreground">
										loading.tsx files provide instant feedback during navigation
									</p>
								</div>
								<div className="rounded-lg border p-4">
									<h3 className="font-semibold mb-2">2. Component Suspense</h3>
									<p className="text-sm text-muted-foreground">
										Individual components wrapped in Suspense boundaries
									</p>
								</div>
								<div className="rounded-lg border p-4">
									<h3 className="font-semibold mb-2">3. Progressive Loading</h3>
									<p className="text-sm text-muted-foreground">
										Multiple Suspense boundaries for staged content rendering
									</p>
								</div>
								<div className="rounded-lg border p-4">
									<h3 className="font-semibold mb-2">4. Skeleton Components</h3>
									<p className="text-sm text-muted-foreground">
										Custom skeletons that match content structure
									</p>
								</div>
							</div>
						</div>
					</div>
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
