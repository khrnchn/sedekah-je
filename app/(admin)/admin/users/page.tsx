import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Suspense } from "react";
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
