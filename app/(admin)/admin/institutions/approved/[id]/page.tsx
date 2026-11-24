// page.tsx – server component for viewing a single approved institution

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db";
import { approvalEmails } from "@/db/schema";
import { getApprovedInstitutionById } from "../../_lib/queries";
import { ApprovalEmailStatus } from "../approval-email-status";
import ClientSection from "./client-section";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function ApprovedInstitutionDetailPage(props: Props) {
	const params = await props.params;
	const idNum = Number(params.id);
	if (Number.isNaN(idNum)) {
		notFound();
	}

	const results = await getApprovedInstitutionById(idNum);
	const institution = results[0];

	if (!institution) {
		notFound();
	}
	const [email] = await db
		.select()
		.from(approvalEmails)
		.where(eq(approvalEmails.institutionId, idNum))
		.limit(1);
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
					<section
						className="mb-6 space-y-3 rounded-lg border p-4"
						aria-labelledby="approval-email-heading"
					>
						<h2 id="approval-email-heading" className="font-semibold">
							Approval email
						</h2>
						<ApprovalEmailStatus
							institutionId={idNum}
							email={email ?? null}
							detailed
						/>
					</section>
					<ClientSection institution={institution} />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
