import { getCampaignByYear } from "@/app/ramadhan/_lib/queries";
import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThreadsPostForm } from "./_components/threads-post-form";
import { getThreadsCredentials } from "./_lib/threads-credentials";

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

const MAX_REPLY_TRAVERSAL_POSTS = 200;

function getTimestampMillis(value?: string): number {
	if (!value) return Number.NEGATIVE_INFINITY;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

async function getRepliesForPost(
	postId: string,
	accessToken: string,
): Promise<ThreadsRecentPost[]> {
	const params = new URLSearchParams({
		fields: "id,text,timestamp",
		limit: "50",
		access_token: accessToken,
	});

	try {
		const res = await fetch(`${THREADS_API_BASE}/${postId}/replies?${params}`, {
			cache: "no-store",
		});
		if (!res.ok) return [];

		const payload = (await res.json().catch(() => null)) as {
			data?: ThreadsRecentPost[];
		} | null;

		return payload?.data ?? [];
	} catch {
		return [];
	}
}

async function getCampaignThreadReplies(
	userId?: string,
	accessToken?: string,
	limit = 5,
): Promise<CampaignThreadRepliesResult> {
	if (!userId || !accessToken) {
		return { replies: [], campaignLatestReplyId: undefined };
	}

	try {
		const queue: string[] = [CAMPAIGN_THREAD_PARENT_POST_ID];
		const seen = new Set<string>([CAMPAIGN_THREAD_PARENT_POST_ID]);
		const descendants: ThreadsRecentPost[] = [];

		while (queue.length > 0 && seen.size < MAX_REPLY_TRAVERSAL_POSTS) {
			const currentPostId = queue.shift();
			if (!currentPostId) break;

			const directReplies = await getRepliesForPost(currentPostId, accessToken);
			for (const reply of directReplies) {
				if (seen.has(reply.id)) continue;
				seen.add(reply.id);
				descendants.push(reply);
				queue.push(reply.id);
			}
		}

		const sortedReplies = descendants.sort(
			(a, b) =>
				getTimestampMillis(b.timestamp) - getTimestampMillis(a.timestamp),
		);
		const campaignLatestReplyId = sortedReplies[0]?.id;

		return {
			replies: sortedReplies.slice(0, limit),
			campaignLatestReplyId,
		};
	} catch {
		return { replies: [], campaignLatestReplyId: undefined };
	}
}

export default async function AdminThreadsPage() {
	const { userId, accessToken } = await getThreadsCredentials();
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
