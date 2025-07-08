// page.tsx – server component with streaming

import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import AsyncApprovedData from "./async-approved-data";
import ApprovedTableLoading from "./table-loading";

export default function ApprovedInstitutionsPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminDashboardLayout
					breadcrumbs={[
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Approved" },
					]}
					title="Approved Institutions"
					description="View and manage approved institutions"
				>
					<Suspense fallback={<ApprovedTableLoading />}>
						<AsyncApprovedData />
					</Suspense>
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
