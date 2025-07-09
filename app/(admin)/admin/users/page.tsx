import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { ReusableDataTable } from "@/components/reusable-data-table";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { headers } from "next/headers";
import { Suspense } from "react";
import { getUsers } from "./_lib/queries";
import { type User, columns } from "./columns";

export default async function Page({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const usersData = await getUsers(searchParams);

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminDashboardLayout
					title="User Management"
					description="Here you can manage all the users."
					breadcrumbs={[{ label: "Users" }]}
				>
					<Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
						<ReusableDataTable
							columns={columns}
							data={usersData.users as User[]}
							searchKey="email"
							searchPlaceholder="Search by email..."
						/>
					</Suspense>
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
