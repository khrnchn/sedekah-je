import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function StreamingDemoLoading() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Streaming Demo" },
					]}
					title="Next.js Loading Patterns Demo"
					description="Demonstration of loading.tsx, Suspense boundaries, and streaming patterns"
				>
					<div className="space-y-8">
						{/* Progressive loading cards skeleton */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-4 w-32" />
							</div>
							<div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="rounded-lg border p-6">
										<Skeleton className="h-32 w-full" />
									</div>
								))}
							</div>
						</div>

						{/* Chart skeleton */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Skeleton className="h-6 w-40" />
								<Skeleton className="h-4 w-36" />
							</div>
							<div className="rounded-lg border p-6">
								<Skeleton className="h-6 w-32 mb-4" />
								<Skeleton className="h-64 w-full" />
							</div>
						</div>

						{/* Data table skeleton */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Skeleton className="h-6 w-44" />
								<Skeleton className="h-4 w-40" />
							</div>
							<div className="rounded-lg border">
								<div className="border-b p-4">
									<div className="flex items-center justify-between">
										{Array.from({ length: 4 }).map((_, i) => (
											<Skeleton key={i} className="h-4 w-24" />
										))}
									</div>
								</div>
								<div className="divide-y">
									{Array.from({ length: 5 }).map((_, i) => (
										<div
											key={i}
											className="flex items-center justify-between p-4"
										>
											{Array.from({ length: 4 }).map((_, j) => (
												<Skeleton key={j} className="h-4 w-20" />
											))}
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
