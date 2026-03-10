import { Suspense } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AsyncClaimRequestsData from "./async-claim-requests-data";
import ClaimRequestsTableLoading from "./table-loading";

export default async function ClaimRequestsPage(props: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const searchParams = await props.searchParams;

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Tuntutan Institusi"
					description="Semak dan luluskan tuntutan pemilikan institusi dari pengguna"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Tuntutan Institusi" },
					]}
				>
					<Suspense fallback={<ClaimRequestsTableLoading />}>
						<AsyncClaimRequestsData searchParams={searchParams} />
					</Suspense>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
