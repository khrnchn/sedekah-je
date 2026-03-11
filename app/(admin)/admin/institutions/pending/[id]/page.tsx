// page.tsx – server component for reviewing a single pending institution

import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
	getNextPendingInstitutionId,
	getPendingInstitutionById,
	getPendingInstitutionPosition,
	getPrevPendingInstitutionId,
} from "../../_lib/queries";
import ClientSection from "./client-section";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function PendingInstitutionReviewPage(props: Props) {
	const params = await props.params;
	const idNum = Number(params.id);
	if (Number.isNaN(idNum)) {
		notFound();
	}

	const [results, prevId, nextId, positionData] = await Promise.all([
		getPendingInstitutionById(idNum),
		getPrevPendingInstitutionId(idNum),
		getNextPendingInstitutionId(idNum),
		getPendingInstitutionPosition(idNum),
	]);
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
					<ClientSection
						institution={institution}
						prevId={prevId}
						nextId={nextId}
						position={positionData.position}
						total={positionData.total}
					/>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
