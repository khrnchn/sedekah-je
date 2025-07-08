// page.tsx – server component

import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getPendingInstitutions } from "../_lib/queries";
import PendingInstitutionsTable from "./pending-table";

export default async function PendingInstitutionsPage() {
	const institutions = await getPendingInstitutions();

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
					<PendingInstitutionsTable initialData={institutions} />
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
