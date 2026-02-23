import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThreadsPostForm } from "./_components/threads-post-form";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

type ThreadsRecentPost = {
	id: string;
	text?: string;
	timestamp?: string;
};

async function getRecentPosts(
	userId?: string,
	accessToken?: string,
): Promise<ThreadsRecentPost[]> {
	if (!userId || !accessToken) {
		return [];
	}

	const params = new URLSearchParams({
		fields: "id,text,timestamp",
		limit: "5",
		access_token: accessToken,
	});

	const res = await fetch(`${THREADS_API_BASE}/${userId}/threads?${params}`, {
		cache: "no-store",
	});

	if (!res.ok) {
		return [];
	}

	const payload = (await res.json().catch(() => null)) as {
		data?: ThreadsRecentPost[];
	} | null;

	return payload?.data ?? [];
}

export default async function AdminThreadsPage() {
	const userId = process.env.THREADS_USER_ID;
	const accessToken = process.env.THREADS_ACCESS_TOKEN;
	const isConfigured = Boolean(userId && accessToken);
	const recentPosts = await getRecentPosts(userId, accessToken);

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
					<ThreadsPostForm
						isConfigured={isConfigured}
						recentPosts={recentPosts}
					/>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
