import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClaimsLoading() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					breadcrumbs={[{ label: "Claims" }]}
					title="Institution Claims Management"
					description="Manage institution claims from users"
				>
					{/* Tabs skeleton */}
					<div className="space-y-6">
						<div className="flex space-x-1 p-1 bg-muted rounded-lg">
							<Skeleton className="h-8 w-24" />
							<Skeleton className="h-8 w-24" />
							<Skeleton className="h-8 w-24" />
						</div>

						{/* Claims grid skeleton */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{[...Array(6)].map((_, i) => (
								<div key={i} className="rounded-lg border p-6 animate-pulse">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<Skeleton className="h-5 w-3/4" />
											<Skeleton className="h-5 w-16" />
										</div>
										<div className="space-y-2">
											<Skeleton className="h-3 w-1/2" />
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-3 w-40" />
										</div>
										<div className="space-y-2">
											<Skeleton className="h-3 w-16" />
											<Skeleton className="h-4 w-full" />
										</div>
										<div className="space-y-2">
											<Skeleton className="h-3 w-12" />
											<Skeleton className="h-3 w-24" />
										</div>
										<div className="flex gap-2 pt-2">
											<Skeleton className="h-8 flex-1" />
											<Skeleton className="h-8 flex-1" />
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
