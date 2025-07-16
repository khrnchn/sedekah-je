import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import { TableSkeleton } from "../dashboard/components/loading-skeletons";
import { AsyncPendingClaimRequests } from "./async-pending-data";

export default function ClaimRequestsPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						<div className="px-4 lg:px-6">
							<div className="flex flex-col gap-4">
								<div>
									<h1 className="text-2xl font-bold tracking-tight">
										Tuntutan Institusi
									</h1>
									<p className="text-muted-foreground">
										Semak dan luluskan tuntutan pemilikan institusi dari
										pengguna
									</p>
								</div>

								<Suspense fallback={<TableSkeleton />}>
									<AsyncPendingClaimRequests />
								</Suspense>
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
