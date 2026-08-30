import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the real review layout (sticky action bar, 2/3 form, 1/3 QR panel) so
// stepping through the queue with j/k does not reflow the page on every hop.
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
					{/* Mirrors the action row in review-actions.tsx. */}
					<div className="mb-6 flex flex-wrap items-center gap-2 border-b py-4">
						<div className="mr-2 flex items-center gap-1">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-10 w-10 rounded-md" />
							<Skeleton className="h-10 w-10 rounded-md" />
						</div>
						<Skeleton className="h-10 w-24 rounded-md" />
						<Skeleton className="h-10 w-24 rounded-md" />
						<Skeleton className="h-10 w-20 rounded-md" />
						<Skeleton className="h-10 w-40 rounded-md" />
						<Skeleton className="h-10 w-10 rounded-md" />
					</div>

					<div className="grid gap-6 lg:grid-cols-3">
						<div className="space-y-4 lg:col-span-2">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-5 pb-4">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-9 w-28 rounded-md" />
								</CardHeader>
								<CardContent className="space-y-5 p-5 pt-0">
									<div className="space-y-2">
										<Skeleton className="h-4 w-12" />
										<Skeleton className="h-10 w-full rounded-md" />
									</div>
									<div className="grid gap-4 md:grid-cols-3">
										{Array.from({ length: 3 }).map((_, i) => (
											<div key={i} className="space-y-2">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-10 w-full rounded-md" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="p-5 pb-4">
									<Skeleton className="h-5 w-24" />
								</CardHeader>
								<CardContent className="space-y-5 p-5 pt-0">
									<Skeleton className="h-64 w-full rounded-md" />
									<div className="flex gap-2">
										<Skeleton className="h-9 w-32 rounded-md" />
										<Skeleton className="h-9 w-32 rounded-md" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-20 w-full rounded-md" />
									</div>
									<div className="grid gap-4 sm:grid-cols-2">
										{Array.from({ length: 2 }).map((_, i) => (
											<div key={i} className="space-y-2">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-10 w-full rounded-md" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="p-5 pb-4">
									<Skeleton className="h-5 w-20" />
								</CardHeader>
								<CardContent className="p-5 pt-0">
									<div className="flex flex-wrap gap-2">
										{Array.from({ length: 4 }).map((_, i) => (
											<Skeleton key={i} className="h-10 w-28 rounded-md" />
										))}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="p-5 pb-4">
									<Skeleton className="h-5 w-16" />
								</CardHeader>
								<CardContent className="p-5 pt-0">
									<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
										{Array.from({ length: 3 }).map((_, i) => (
											<div key={i} className="space-y-2">
												<Skeleton className="h-4 w-20" />
												<Skeleton className="h-10 w-full rounded-md" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="p-5 pb-4">
									<Skeleton className="h-5 w-28" />
								</CardHeader>
								<CardContent className="space-y-4 p-5 pt-0">
									<div className="grid gap-4 sm:grid-cols-2">
										{Array.from({ length: 2 }).map((_, i) => (
											<div key={i} className="space-y-2">
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-16 w-full rounded-md" />
											</div>
										))}
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-12 w-full rounded-md" />
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="lg:col-span-1">
							<Card className="sticky top-4">
								<CardHeader className="p-5 pb-4">
									<Skeleton className="h-5 w-28" />
								</CardHeader>
								<CardContent className="flex flex-col items-center gap-4 p-5 pt-0">
									<Skeleton className="h-[280px] w-[280px] rounded-md" />
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-16 w-full rounded-md" />
									<div className="w-full border-t pt-4">
										<Skeleton className="mb-2 h-4 w-40" />
										<Skeleton className="mx-auto h-[200px] w-[200px] rounded-md" />
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
