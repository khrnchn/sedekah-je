import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ApprovedTableLoading from "./table-loading";

export default function ApprovedInstitutionsLoading() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Approved" },
					]}
					title="Approved Institutions"
					description="View and manage approved institutions"
				>
					<ApprovedTableLoading />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
