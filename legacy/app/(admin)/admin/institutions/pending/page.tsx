// page.tsx – server component with streaming

import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getPendingInstitutionsCount } from "../_lib/queries";
import AsyncPendingData from "./async-pending-data";
import PendingTableLoading from "./table-loading";

export async function generateMetadata(): Promise<Metadata> {
	const count = await getPendingInstitutionsCount();
	return { title: `(${count}) Pending Review` };
}

export default function PendingInstitutionsPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Pending Institutions"
					description="Review and manage institutions awaiting approval"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Pending" },
					]}
				>
					<Suspense fallback={<PendingTableLoading />}>
						<AsyncPendingData />
					</Suspense>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
