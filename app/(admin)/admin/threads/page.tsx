import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThreadsPostForm } from "./_components/threads-post-form";

export default function AdminThreadsPage() {
	const isConfigured = Boolean(
		process.env.THREADS_USER_ID && process.env.THREADS_ACCESS_TOKEN,
	);

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Threads Posting"
					description="Create a new post or add to an existing thread chain."
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Threads" },
					]}
				>
					<ThreadsPostForm isConfigured={isConfigured} />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
