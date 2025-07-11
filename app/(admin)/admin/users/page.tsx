import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { ReusableDataTable } from "@/components/reusable-data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TableSkeleton } from "@/components/ui/table-skeleton";
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
				<AdminLayout
					title="User Management"
					description="Here you can manage all the users."
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Users" },
					]}
				>
					<Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
						<ReusableDataTable
							columns={columns}
							data={usersData.users as User[]}
							searchKey="email"
							searchPlaceholder="Search by email..."
						/>
					</Suspense>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
