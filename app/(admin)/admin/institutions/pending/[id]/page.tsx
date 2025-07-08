// page.tsx – server component for reviewing a single pending institution

import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { notFound } from "next/navigation";
import { getPendingInstitutionById } from "../../_lib/queries";
import ClientSection from "./client-section";

interface Props {
	params: { id: string };
}

export default async function PendingInstitutionReviewPage({ params }: Props) {
	const idNum = Number(params.id);
	if (Number.isNaN(idNum)) {
		notFound();
	}

	const [institution] = await getPendingInstitutionById(idNum);

	if (!institution) {
		notFound();
	}

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminDashboardLayout
					breadcrumbs={[
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Pending", href: "/admin/institutions/pending" },
						{ label: `#${institution.id}` },
					]}
					title={institution.name}
					description="Review pending institution"
				>
					<ClientSection institution={institution} />
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
