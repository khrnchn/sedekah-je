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

type CampaignThreadRepliesResult = {
	replies: ThreadsRecentPost[];
	campaignLatestReplyId: string | undefined;
};

async function getCampaignThreadReplies(
	userId?: string,
	accessToken?: string,
	limit = 5,
): Promise<CampaignThreadRepliesResult> {
	if (!userId || !accessToken) {
		return { replies: [], campaignLatestReplyId: undefined };
	}

	const params = new URLSearchParams({
		fields: "id,text,timestamp",
		limit: String(limit),
		access_token: accessToken,
	});

	const res = await fetch(
		`${THREADS_API_BASE}/${CAMPAIGN_THREAD_PARENT_POST_ID}/replies?${params}`,
		{ cache: "no-store" },
	);

	if (!res.ok) {
		return { replies: [], campaignLatestReplyId: undefined };
	}

	const payload = (await res.json().catch(() => null)) as {
		data?: ThreadsRecentPost[];
	} | null;

	const replies = payload?.data ?? [];
	const campaignLatestReplyId = replies[0]?.id;

	return { replies, campaignLatestReplyId };
}

export default async function AdminThreadsPage() {
	const userId = process.env.THREADS_USER_ID;
	const accessToken = process.env.THREADS_ACCESS_TOKEN;
	const isConfigured = Boolean(userId && accessToken);
	const campaignYear = new Date().getFullYear();
	const { replies: campaignReplies, campaignLatestReplyId } =
		await getCampaignThreadReplies(userId, accessToken, 5);
	const campaign = await getCampaignByYear(campaignYear);
	const campaignDays: CampaignDayLookup[] = campaign.map((day) => ({
		dayNumber: day.dayNumber,
		institutionName: day.institutionName,
		institutionSlug: day.institutionSlug,
		institutionCategory: day.institutionCategory,
	}));

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
					<div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
						please be careful, this will be posted using khairin's account
					</div>
					<ThreadsPostForm
						campaignDays={campaignDays}
						isConfigured={isConfigured}
						campaignLatestReplyId={campaignLatestReplyId}
						recentPosts={campaignReplies}
					/>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
