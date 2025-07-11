// page.tsx – server component with streaming

import { AdminLayout } from "@/components/admin-layout";
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
				<AdminLayout
					title="Rejected Institutions"
					description="Review and manage institutions that have been rejected"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Rejected" },
					]}
				>
					<Suspense fallback={<RejectedTableLoading />}>
						<AsyncRejectedData />
					</Suspense>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
