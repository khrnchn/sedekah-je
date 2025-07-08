// page.tsx – server component with streaming

import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import AsyncRejectedData from "./async-rejected-data";
import RejectedTableLoading from "./table-loading";

export default function RejectedInstitutionsPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminDashboardLayout
					breadcrumbs={[
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Rejected" },
					]}
					title="Rejected Institutions"
					description="Review and manage institutions that have been rejected"
				>
					<Suspense fallback={<RejectedTableLoading />}>
						<AsyncRejectedData />
					</Suspense>
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
