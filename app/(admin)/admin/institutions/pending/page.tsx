// page.tsx – server component with streaming

import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import AsyncPendingData from "./async-pending-data";
import PendingTableLoading from "./table-loading";

export default function PendingInstitutionsPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminDashboardLayout
					breadcrumbs={[
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Pending" },
					]}
					title="Pending Institutions"
					description="Review and manage institutions awaiting approval"
				>
					<Suspense fallback={<PendingTableLoading />}>
						<AsyncPendingData />
					</Suspense>
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
