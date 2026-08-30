import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import RejectedTableLoading from "./table-loading";

export default function RejectedInstitutionsLoading() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Rejected" },
					]}
					title="Rejected Institutions"
					description="Review and manage institutions that have been rejected"
				>
					<RejectedTableLoading />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
