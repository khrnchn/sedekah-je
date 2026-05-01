import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FridayCampaignManager } from "./_components/friday-campaign-manager";
import { getFridayCampaignForAdmin } from "./_lib/queries";

export default async function AdminFridayPage() {
	const data = await getFridayCampaignForAdmin();

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Kempen Jumaat"
					description="Urus QR Jumaat random dan favourite override"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Jumaat" },
					]}
				>
					<FridayCampaignManager {...data} />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
