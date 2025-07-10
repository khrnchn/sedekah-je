// page.tsx – server component for viewing a single approved institution

import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { notFound } from "next/navigation";
import { getApprovedInstitutionById } from "../../_lib/queries";
import ClientSection from "./client-section";

interface Props {
	params: { id: string };
}

export default async function ApprovedInstitutionDetailPage({ params }: Props) {
	const idNum = Number(params.id);
	if (Number.isNaN(idNum)) {
		notFound();
	}

	const results = await getApprovedInstitutionById(idNum);
	const institution = results[0];

	if (!institution) {
		notFound();
	}
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title={institution.name}
					description="View and edit approved institution"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Approved", href: "/admin/institutions/approved" },
						{ label: `#${institution.id}` },
					]}
				>
					<ClientSection institution={institution} />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
