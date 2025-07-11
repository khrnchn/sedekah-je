// page.tsx – server component with streaming

import { AdminLayout } from "@/components/admin-layout";
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
				<AdminLayout
					title="Pending Institutions"
					description="Review and manage institutions awaiting approval"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Pending" },
					]}
				>
					<Suspense fallback={<PendingTableLoading />}>
						<AsyncPendingData />
					</Suspense>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
