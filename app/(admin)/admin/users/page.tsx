import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Suspense } from "react";
import { getUsers } from "./_lib/queries";
import { UsersTable } from "./users-table";

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
				<AdminLayout
					title="User Management"
					description="Here you can manage all the users."
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Users" },
					]}
				>
					<Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
						<UsersTable data={usersData} />
					</Suspense>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
