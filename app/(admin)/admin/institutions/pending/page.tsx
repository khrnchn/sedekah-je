import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { ReusableDataTable } from "@/components/reusable-data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getPendingInstitutions } from "../_lib/queries";
import { columns } from "./columns";

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
					<ReusableDataTable
						columns={columns}
						data={institutions}
						searchKey="name"
						searchPlaceholder="Search institutions..."
						emptyStateMessage="All caught up! No pending institutions."
					/>
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
