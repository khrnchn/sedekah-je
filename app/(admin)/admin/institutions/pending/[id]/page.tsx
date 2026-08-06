// page.tsx – server component for reviewing a single pending institution

import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
	getNextPendingInstitutionId,
	getPendingInstitutionPosition,
	getPrevPendingInstitutionId,
} from "../../_lib/navigation";
import {
	getPendingListHref,
	shouldIncludeAutomated,
} from "../../_lib/pending-review-scope";
import { getPendingInstitutionById } from "../../_lib/queries";
import ClientSection from "./client-section";

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ includeAutomated?: string | string[] }>;
}

export default async function PendingInstitutionReviewPage(props: Props) {
	const [params, searchParams] = await Promise.all([
		props.params,
		props.searchParams,
	]);
	const includeAutomated = shouldIncludeAutomated(
		searchParams.includeAutomated,
	);
	const idNum = Number(params.id);
	if (Number.isNaN(idNum)) {
		notFound();
	}

	const [results, prevId, nextId, positionData] = await Promise.all([
		getPendingInstitutionById(idNum),
		getPrevPendingInstitutionId(idNum, includeAutomated),
		getNextPendingInstitutionId(idNum, includeAutomated),
		getPendingInstitutionPosition(idNum, includeAutomated),
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
						{
							label: "Pending",
							href: getPendingListHref(includeAutomated),
						},
						{ label: `#${institution.id}` },
					]}
				>
					<ClientSection
						institution={institution}
						prevId={prevId}
						nextId={nextId}
						position={positionData.position}
						total={positionData.total}
						includeAutomated={includeAutomated}
					/>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
