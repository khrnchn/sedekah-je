// page.tsx – server component

import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getRejectedInstitutions } from "../_lib/queries";
import RejectedInstitutionsTable from "./rejected-table";

export default async function RejectedInstitutionsPage() {
	const institutions = await getRejectedInstitutions();

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
					<RejectedInstitutionsTable initialData={institutions} />
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
