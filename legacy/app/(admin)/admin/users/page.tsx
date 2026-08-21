import { Suspense } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AsyncUsersData from "./async-users-data";

export default async function Page(props: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const searchParams = await props.searchParams;
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="User Management"
					description="Here you can manage all the users."
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Users" },
					]}
				>
					<Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
						<AsyncUsersData searchParams={searchParams} />
					</Suspense>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
