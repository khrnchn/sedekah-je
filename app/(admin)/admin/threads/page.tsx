import { getCampaignByYear } from "@/app/ramadhan/_lib/queries";
import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThreadsPostForm } from "./_components/threads-post-form";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";
const CAMPAIGN_THREAD_PARENT_POST_ID = "18106182523855087";

type ThreadsRecentPost = {
	id: string;
	text?: string;
	timestamp?: string;
};

type CampaignDayLookup = {
	dayNumber: number;
	institutionName: string;
	institutionSlug: string;
	institutionCategory: string;
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

async function getLatestCampaignReplyId(
	userId?: string,
	accessToken?: string,
): Promise<string | undefined> {
	if (!userId || !accessToken) {
		return undefined;
	}

	const params = new URLSearchParams({
		fields: "id,text,timestamp",
		limit: "5",
		access_token: accessToken,
	});

	// If unavailable for the app/token, this fails gracefully and we fallback.
	const res = await fetch(
		`${THREADS_API_BASE}/${CAMPAIGN_THREAD_PARENT_POST_ID}/replies?${params}`,
		{
			cache: "no-store",
		},
	);

	if (!res.ok) {
		return undefined;
	}

	const payload = (await res.json().catch(() => null)) as {
		data?: ThreadsRecentPost[];
	} | null;

	return payload?.data?.[0]?.id;
}

export default async function AdminThreadsPage() {
	const userId = process.env.THREADS_USER_ID;
	const accessToken = process.env.THREADS_ACCESS_TOKEN;
	const isConfigured = Boolean(userId && accessToken);
	const campaignYear = new Date().getFullYear();
	const recentPosts = await getRecentPosts(userId, accessToken);
	const campaign = await getCampaignByYear(campaignYear);
	const campaignDays: CampaignDayLookup[] = campaign.map((day) => ({
		dayNumber: day.dayNumber,
		institutionName: day.institutionName,
		institutionSlug: day.institutionSlug,
		institutionCategory: day.institutionCategory,
	}));
	const campaignLatestReplyId = await getLatestCampaignReplyId(
		userId,
		accessToken,
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
					<ThreadsPostForm
						campaignDays={campaignDays}
						isConfigured={isConfigured}
						campaignLatestReplyId={campaignLatestReplyId}
						latestRecentPostId={recentPosts[0]?.id}
						recentPosts={recentPosts}
					/>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
