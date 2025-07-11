// page.tsx – server component for reviewing a single pending institution

import { AdminLayout } from "@/components/admin-layout";
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

	const results = await getPendingInstitutionById(idNum);
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
					description="Review pending institution"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Pending", href: "/admin/institutions/pending" },
						{ label: `#${institution.id}` },
					]}
				>
					<ClientSection institution={institution} />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
