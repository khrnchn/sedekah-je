import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { institutions } from "@/db/institutions";

export const SUBMISSIONS_PER_DAY = 10;
export const COOLDOWN_HOURS = 12;

export type SubmissionRateLimitResult =
	| { limited: false }
	| { limited: true; cooldownEndsAt: Date };

// Rolling 24h window, not calendar day. Cooldown ends at whichever is later:
// COOLDOWN_HOURS after the most recent submission, or 24h after the oldest
// one counted in the window (so the window always has room by then).
export async function checkSubmissionRateLimit(
	contributorId: string,
	isAdmin: boolean,
): Promise<SubmissionRateLimitResult> {
	if (isAdmin) return { limited: false };

	const oneDayAgo = new Date();
	oneDayAgo.setDate(oneDayAgo.getDate() - 1);

	const [{ value }] = await db
		.select({ value: count() })
		.from(institutions)
		.where(
			and(
				eq(institutions.contributorId, contributorId),
				gte(institutions.createdAt, oneDayAgo),
			),
		);

	if (value < SUBMISSIONS_PER_DAY) {
		return { limited: false };
	}

	const recentSubmissions = await db
		.select({ createdAt: institutions.createdAt })
		.from(institutions)
		.where(
			and(
				eq(institutions.contributorId, contributorId),
				gte(institutions.createdAt, oneDayAgo),
			),
		)
		.orderBy(desc(institutions.createdAt))
		.limit(SUBMISSIONS_PER_DAY);

	const mostRecentAt = recentSubmissions[0]?.createdAt;
	const oldestAt = recentSubmissions[recentSubmissions.length - 1]?.createdAt;

	const cooldownEndsAt =
		mostRecentAt && oldestAt
			? new Date(
					Math.max(
						mostRecentAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000,
						oldestAt.getTime() + 24 * 60 * 60 * 1000,
					),
				)
			: new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000);

	return { limited: true, cooldownEndsAt };
}
