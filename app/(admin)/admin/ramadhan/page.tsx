import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CampaignManager } from "./_components/campaign-manager";
import {
	getApprovedInstitutionsForPicker,
	getCampaignForAdmin,
} from "./_lib/queries";

type Props = {
	searchParams: Promise<{ year?: string }>;
};

export default async function AdminRamadhanPage({ searchParams }: Props) {
	const params = await searchParams;
	const year = Math.min(
		Math.max(
			Number.parseInt(params?.year ?? "", 10) || new Date().getFullYear(),
			2020,
		),
		2050,
	);

	const [campaign, institutions] = await Promise.all([
		getCampaignForAdmin(year),
		getApprovedInstitutionsForPicker(),
	]);

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Kempen Ramadan — 30 Hari 30 QR"
					description="Urus kempen QR sehari untuk bulan Ramadan"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Ramadan" },
					]}
				>
					<CampaignManager
						initialYear={year}
						initialCampaign={campaign}
						initialInstitutions={institutions}
					/>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
