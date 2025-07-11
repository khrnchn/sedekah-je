import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Clock, X } from "lucide-react";
import { Suspense } from "react";
import AsyncApprovedClaims from "./async-approved-claims";
import AsyncPendingClaims from "./async-pending-claims";
import AsyncRejectedClaims from "./async-rejected-claims";
import ClaimsTableLoading from "./table-loading";

interface ClaimsPageProps {
	searchParams: { tab?: string };
}

export default function ClaimsPage({ searchParams }: ClaimsPageProps) {
	const activeTab = searchParams.tab || "pending";

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Institution Claims Management"
					description="Manage institution claims from users"
					breadcrumbs={[{ label: "Claims" }]}
				>
					<Tabs value={activeTab} className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="pending" asChild>
								<a href="/admin/claims?tab=pending">
									<Clock className="h-4 w-4 mr-2" />
									Pending
								</a>
							</TabsTrigger>
							<TabsTrigger value="approved" asChild>
								<a href="/admin/claims?tab=approved">
									<Check className="h-4 w-4 mr-2" />
									Approved
								</a>
							</TabsTrigger>
							<TabsTrigger value="rejected" asChild>
								<a href="/admin/claims?tab=rejected">
									<X className="h-4 w-4 mr-2" />
									Rejected
								</a>
							</TabsTrigger>
						</TabsList>

						<TabsContent value="pending" className="mt-6">
							{activeTab === "pending" && (
								<Suspense fallback={<ClaimsTableLoading />}>
									<AsyncPendingClaims />
								</Suspense>
							)}
						</TabsContent>

						<TabsContent value="approved" className="mt-6">
							{activeTab === "approved" && (
								<Suspense fallback={<ClaimsTableLoading />}>
									<AsyncApprovedClaims />
								</Suspense>
							)}
						</TabsContent>

						<TabsContent value="rejected" className="mt-6">
							{activeTab === "rejected" && (
								<Suspense fallback={<ClaimsTableLoading />}>
									<AsyncRejectedClaims />
								</Suspense>
							)}
						</TabsContent>
					</Tabs>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
