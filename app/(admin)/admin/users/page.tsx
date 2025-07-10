import { AppSidebar } from "@/components/app-sidebar";
import { ReusableDataTable } from "@/components/reusable-data-table";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Home } from "lucide-react";
import Link from "next/link";
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
				<header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
					<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mx-2 data-[orientation=vertical]:h-4"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link
											href="/admin/dashboard"
											className="flex items-center gap-1"
										>
											<Home className="h-4 w-4" />
											<span className="sr-only">Admin Dashboard</span>
										</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link href="/admin/dashboard">Dashboard</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>Users</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
							<div className="px-4 lg:px-6">
								<h1 className="text-2xl font-semibold tracking-tight">
									User Management
								</h1>
								<p className="text-muted-foreground mt-1">
									Here you can manage all the users.
								</p>
							</div>
							<div className="px-4 lg:px-6">
								<Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
									<ReusableDataTable
										columns={columns}
										data={usersData.users as User[]}
										searchKey="email"
										searchPlaceholder="Search by email..."
									/>
								</Suspense>
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
