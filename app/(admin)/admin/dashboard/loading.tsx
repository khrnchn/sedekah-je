import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				{/* Header skeleton */}
				<div className="flex h-16 shrink-0 items-center gap-2 px-4">
					<Skeleton className="h-8 w-8" />
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-16" />
						<span>/</span>
						<Skeleton className="h-4 w-20" />
					</div>
				</div>

				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
							{/* Stats cards skeleton */}
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 px-4 lg:px-6">
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="rounded-lg border p-4 space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-8 w-16" />
										<Skeleton className="h-3 w-32" />
									</div>
								))}
							</div>

							{/* Chart skeleton */}
							<div className="px-4 lg:px-6">
								<div className="rounded-lg border p-6">
									<Skeleton className="h-6 w-32 mb-4" />
									<Skeleton className="h-64 w-full" />
								</div>
							</div>

							{/* Data table skeleton */}
							<div className="px-4 lg:px-6">
								<div className="rounded-lg border">
									<div className="p-4 border-b">
										<div className="flex items-center justify-between">
											<Skeleton className="h-8 w-48" />
											<Skeleton className="h-8 w-24" />
										</div>
									</div>
									<div className="p-4">
										{Array.from({ length: 5 }).map((_, i) => (
											<div
												key={i}
												className="flex items-center justify-between py-2"
											>
												<Skeleton className="h-4 w-48" />
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-4 w-16" />
											</div>
										))}
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
