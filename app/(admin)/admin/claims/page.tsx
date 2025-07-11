import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ClaimsClientPage from "./client-page";

export default function ClaimsPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Institution Claims Management"
					description="Manage institution claims from users"
					breadcrumbs={[{ label: "Claims" }]}
				>
					<ClaimsClientPage />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
