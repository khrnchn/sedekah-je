import { AdminDashboardLayout } from "@/components/admin-dashboard-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { getPendingInstitutions } from "../_lib/queries";

export default async function PendingInstitutionsPage() {
	const institutions = await getPendingInstitutions();

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminDashboardLayout
					breadcrumbs={[
						{ label: "Institutions", href: "/admin/institutions" },
						{ label: "Pending" },
					]}
					title={`Pending Institutions (${institutions.length})`}
					description="Review and manage institutions awaiting approval"
				>
					<div className="overflow-auto rounded-lg border">
						<Table>
							<TableHeader className="bg-muted">
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>State</TableHead>
									<TableHead>City</TableHead>
									<TableHead>Contributor</TableHead>
									<TableHead>Date</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{institutions.length > 0 ? (
									institutions.map((inst) => (
										<TableRow key={inst.id}>
											<TableCell>{inst.id}</TableCell>
											<TableCell className="font-medium">
												<Link
													href={`/institutions/${inst.id}`}
													className="hover:underline"
												>
													{inst.name}
												</Link>
											</TableCell>
											<TableCell>{inst.category}</TableCell>
											<TableCell>{inst.state}</TableCell>
											<TableCell>{inst.city}</TableCell>
											<TableCell>
												{inst.contributorName ?? inst.contributorId ?? "-"}
											</TableCell>
											<TableCell>
												{inst.createdAt
													? new Date(inst.createdAt).toLocaleDateString()
													: "-"}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={7} className="text-center">
											All caught up! No pending institutions.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</AdminDashboardLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
