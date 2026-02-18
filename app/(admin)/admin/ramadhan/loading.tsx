import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function RamadhanLoading() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Kempen Ramadan — 30 Hari 30 QR"
					description="Urus kempen QR sehari untuk bulan Ramadan"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Ramadan" },
					]}
				>
					<div className="space-y-6">
						{/* Toolbar skeleton */}
						<div className="flex gap-4">
							<Skeleton className="h-10 w-32" />
							<Skeleton className="h-10 w-48" />
							<Skeleton className="h-10 w-24" />
						</div>

						{/* Table skeleton */}
						<div className="rounded-lg border">
							{/* Table header */}
							<div className="border-b p-4">
								<div className="flex items-center justify-between">
									<Skeleton className="h-4 w-8" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-16" />
								</div>
							</div>

							{/* Table rows */}
							<div className="divide-y">
								{Array.from({ length: 30 }).map((_, i) => (
									<div
										key={i}
										className="flex items-center justify-between p-4"
									>
										<Skeleton className="h-4 w-8" />
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-16" />
									</div>
								))}
							</div>
						</div>
					</div>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
