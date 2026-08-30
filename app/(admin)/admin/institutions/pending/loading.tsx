import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import PendingTableLoading from "./table-loading";

export default function PendingInstitutionsLoading() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Pending" },
					]}
					title="Pending Institutions"
					description="Review and manage institutions awaiting approval"
				>
					<PendingTableLoading />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
