import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function PendingInstitutionReviewLoading() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Pending", href: "/admin/institutions/pending" },
						{ label: "Loading..." },
					]}
					title="Loading..."
					description="Review pending institution"
				>
					<div className="space-y-8">
						{/* Institution details card skeleton */}
						<div className="rounded-lg border p-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Skeleton className="h-6 w-48" />
									<Skeleton className="h-5 w-20" />
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-4 w-32" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-12" />
										<Skeleton className="h-4 w-24" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-4 w-36" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-28" />
									</div>
								</div>
							</div>
						</div>

						{/* QR Code section skeleton */}
						<div className="rounded-lg border p-6">
							<div className="space-y-4">
								<Skeleton className="h-6 w-32" />
								<div className="flex items-center justify-center">
									<Skeleton className="h-64 w-64" />
								</div>
								<div className="flex justify-center gap-2">
									<Skeleton className="h-8 w-24" />
									<Skeleton className="h-8 w-24" />
									<Skeleton className="h-8 w-24" />
								</div>
							</div>
						</div>

						{/* Review form skeleton */}
						<div className="rounded-lg border p-6">
							<div className="space-y-4">
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-24 w-full" />
								<div className="flex gap-2">
									<Skeleton className="h-10 w-24" />
									<Skeleton className="h-10 w-24" />
								</div>
							</div>
						</div>
					</div>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
