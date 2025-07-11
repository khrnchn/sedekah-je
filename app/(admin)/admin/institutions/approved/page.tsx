// page.tsx – server component with streaming

import { AdminLayout } from "@/components/admin-layout";
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
				<AdminLayout
					title="Approved Institutions"
					description="View and manage approved institutions"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Approved" },
					]}
				>
					<Suspense fallback={<ApprovedTableLoading />}>
						<AsyncApprovedData />
					</Suspense>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
