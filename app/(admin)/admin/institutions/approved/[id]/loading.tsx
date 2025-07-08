import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApprovedInstitutionDetailLoading() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminDashboardLayout
					breadcrumbs={[
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Approved", href: "/admin/institutions/approved" },
						{ label: "Loading..." },
					]}
					title="Loading..."
					description="View and edit approved institution"
				>
					<div className="space-y-6">
						{/* Sticky Action Bar */}
						<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-20" />
								</div>
								<div className="flex items-center gap-2">
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-16" />
								</div>
							</div>
						</div>

						<div className="grid lg:grid-cols-3 gap-6">
							<div className="lg:col-span-2 space-y-6">
								{/* Institution Info Card */}
								<div className="rounded-lg border p-4 shadow-sm">
									<div className="space-y-4">
										<div className="flex items-center gap-2">
											<Skeleton className="h-6 w-6" />
											<Skeleton className="h-6 w-32" />
										</div>
										<div className="space-y-4">
											<div className="space-y-2">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-10 w-full" />
											</div>
											<div className="space-y-2">
												<Skeleton className="h-4 w-20" />
												<Skeleton className="h-10 w-full" />
											</div>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Skeleton className="h-4 w-12" />
													<Skeleton className="h-10 w-full" />
												</div>
												<div className="space-y-2">
													<Skeleton className="h-4 w-12" />
													<Skeleton className="h-10 w-full" />
												</div>
											</div>
											<div className="space-y-2">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-20 w-full" />
											</div>
											<div className="space-y-2">
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-20 w-full" />
											</div>
										</div>
									</div>
								</div>

								{/* Social Media Links Card */}
								<div className="rounded-lg border p-4 shadow-sm">
									<div className="space-y-4">
										<div className="flex items-center gap-2">
											<Skeleton className="h-6 w-6" />
											<Skeleton className="h-6 w-36" />
										</div>
										<div className="space-y-4">
											{Array.from({ length: 3 }).map((_, i) => (
												<div key={i} className="space-y-2">
													<Skeleton className="h-4 w-24" />
													<div className="flex gap-2">
														<Skeleton className="h-10 flex-1" />
														<Skeleton className="h-10 w-10" />
													</div>
												</div>
											))}
										</div>
									</div>
								</div>

								{/* Contributor Info Card */}
								<div className="rounded-lg border p-4 shadow-sm bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
									<div className="space-y-4">
										<div className="flex items-center gap-2">
											<Skeleton className="h-6 w-6" />
											<Skeleton className="h-6 w-44" />
										</div>
										<div className="space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Skeleton className="h-4 w-24" />
													<Skeleton className="h-16 w-full" />
												</div>
												<div className="space-y-2">
													<Skeleton className="h-4 w-32" />
													<Skeleton className="h-16 w-full" />
												</div>
											</div>
											<div className="space-y-2">
												<Skeleton className="h-4 w-36" />
												<Skeleton className="h-12 w-full" />
											</div>
											<div className="space-y-2">
												<Skeleton className="h-4 w-32" />
												<Skeleton className="h-20 w-full" />
											</div>
										</div>
									</div>
								</div>

								{/* Review Info Card */}
								<div className="rounded-lg border p-4 shadow-sm bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
									<div className="space-y-4">
										<div className="flex items-center gap-2">
											<Skeleton className="h-6 w-6" />
											<Skeleton className="h-6 w-36" />
										</div>
										<div className="space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Skeleton className="h-4 w-12" />
													<Skeleton className="h-12 w-full" />
												</div>
												<div className="space-y-2">
													<Skeleton className="h-4 w-24" />
													<Skeleton className="h-12 w-full" />
												</div>
											</div>
											<div className="space-y-2">
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-12 w-full" />
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="lg:col-span-1">
								{/* QR Code Card */}
								<div className="rounded-lg border p-4 shadow-sm sticky top-4">
									<div className="space-y-4">
										<div className="flex items-center gap-2">
											<Skeleton className="h-6 w-6" />
											<Skeleton className="h-6 w-36" />
										</div>
										<div className="flex flex-col items-center gap-4">
											<Skeleton className="h-[280px] w-[280px]" />
											<Skeleton className="h-4 w-48" />
											<Skeleton className="h-20 w-full" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
