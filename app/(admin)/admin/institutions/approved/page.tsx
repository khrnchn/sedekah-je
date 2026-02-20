// page.tsx – server component with streaming

import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAllUsers, getApprovedInstitutions } from "../_lib/queries";
import ApprovedInstitutionsTable from "./approved-table";

export default async function ApprovedInstitutionsPage() {
	const [institutions, users] = await Promise.all([
		getApprovedInstitutions(),
		getAllUsers(),
	]);

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
					<ApprovedInstitutionsTable initialData={institutions} users={users} />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
