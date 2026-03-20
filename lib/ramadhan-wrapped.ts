import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { institutions, ramadhanCampaigns, users } from "@/db/schema";
import { formatDateEn, formatDateEnShort } from "@/lib/ramadhan";

export const RAMADHAN_WRAPPED_CONFIG = {
	year: 2026,
	timezone: "Asia/Kuala_Lumpur",
	startDate: "2026-02-19",
	endDate: "2026-03-20",
	startAt: new Date("2026-02-18T16:00:00.000Z"),
	endExclusive: new Date("2026-03-20T16:00:00.000Z"),
	targetCampaignDays: 30,
} as const;

export type RamadhanWrappedStats = {
	range: {
		timezone: string;
		startDate: string;
		endDate: string;
		startAtIso: string;
		endExclusiveIso: string;
		label: string;
	};
	kpis: {
		newUsers: number;
		totalSubmissions: number;
		approvedSubmissions: number;
		pendingSubmissions: number;
		rejectedSubmissions: number;
		approvedInWindow: number;
		uniqueContributors: number;
	};
	rankings: {
		topContributors: Array<{ name: string; submissions: number }>;
		topStates: Array<{ state: string; submissions: number }>;
		topCategories: Array<{ category: string; submissions: number }>;
	};
	dailyTrend: Array<{
		date: string;
		label: string;
		submissions: number;
		approvals: number;
		newUsers: number;
	}>;
	campaignProgress: {
		year: number;
		filledDays: number;
		targetDays: number;
		completionRate: number;
		missingDays: number[];
	};
	generatedAt: string;
};

type TimestampRow = {
	ts: Date | null;
};

function toNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") return Number.parseInt(value, 10) || 0;
	return 0;
}

function createDateRange(startDate: string, endDate: string): string[] {
	const start = new Date(`${startDate}T00:00:00.000Z`);
	const end = new Date(`${endDate}T00:00:00.000Z`);
	const dates: string[] = [];

	for (let cursor = new Date(start); cursor <= end; ) {
		dates.push(cursor.toISOString().slice(0, 10));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}

	return dates;
}

function toTimezoneDateKey(date: Date, timezone: string): string {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	return formatter.format(date);
}

function aggregateByDate(
	rows: TimestampRow[],
	timezone: string,
): Map<string, number> {
	const dateMap = new Map<string, number>();
	for (const row of rows) {
		if (!row.ts) continue;
		const key = toTimezoneDateKey(row.ts, timezone);
		dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
	}
	return dateMap;
}

export async function getRamadhanWrappedStats(): Promise<RamadhanWrappedStats> {
	const cfg = RAMADHAN_WRAPPED_CONFIG;

	const [
		usersResult,
		submissionsResult,
		approvedInWindowResult,
		uniqueContributorsResult,
		topContributorsResult,
		topStatesResult,
		topCategoriesResult,
		submissionDateRows,
		approvalDateRows,
		userDateRows,
		campaignDaysResult,
	] = await Promise.all([
		db
			.select({ count: count() })
			.from(users)
			.where(
				and(
					gte(users.createdAt, cfg.startAt),
					lt(users.createdAt, cfg.endExclusive),
				),
			),
		db
			.select({
				total: count(),
				approved:
					sql<number>`COUNT(CASE WHEN ${institutions.status} = 'approved' THEN 1 END)`.mapWith(
						Number,
					),
				pending:
					sql<number>`COUNT(CASE WHEN ${institutions.status} = 'pending' THEN 1 END)`.mapWith(
						Number,
					),
				rejected:
					sql<number>`COUNT(CASE WHEN ${institutions.status} = 'rejected' THEN 1 END)`.mapWith(
						Number,
					),
			})
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
				),
			),
		db
			.select({ count: count() })
			.from(institutions)
			.where(
				and(
					eq(institutions.status, "approved"),
					gte(institutions.reviewedAt, cfg.startAt),
					lt(institutions.reviewedAt, cfg.endExclusive),
				),
			),
		db
			.select({
				count:
					sql<number>`COUNT(DISTINCT ${institutions.contributorId})`.mapWith(
						Number,
					),
			})
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
				),
			),
		db
			.select({
				name: sql<string>`COALESCE(NULLIF(${users.name}, ''), NULLIF(${users.username}, ''), ${users.email}, 'Tanpa nama')`,
				submissions: count(),
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
				),
			)
			.groupBy(
				sql`COALESCE(NULLIF(${users.name}, ''), NULLIF(${users.username}, ''), ${users.email}, 'Tanpa nama')`,
			)
			.orderBy(
				sql`count(*) DESC`,
				sql`COALESCE(NULLIF(${users.name}, ''), NULLIF(${users.username}, ''), ${users.email}, 'Tanpa nama') ASC`,
			)
			.limit(5),
		db
			.select({ state: institutions.state, submissions: count() })
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
				),
			)
			.groupBy(institutions.state)
			.orderBy(sql`count(*) DESC`, institutions.state)
			.limit(5),
		db
			.select({ category: institutions.category, submissions: count() })
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
				),
			)
			.groupBy(institutions.category)
			.orderBy(sql`count(*) DESC`, institutions.category)
			.limit(5),
		db
			.select({
				ts: institutions.createdAt,
			})
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
				),
			)
			.orderBy(institutions.createdAt),
		db
			.select({
				ts: institutions.reviewedAt,
			})
			.from(institutions)
			.where(
				and(
					eq(institutions.status, "approved"),
					gte(institutions.reviewedAt, cfg.startAt),
					lt(institutions.reviewedAt, cfg.endExclusive),
				),
			)
			.orderBy(institutions.reviewedAt),
		db
			.select({
				ts: users.createdAt,
			})
			.from(users)
			.where(
				and(
					gte(users.createdAt, cfg.startAt),
					lt(users.createdAt, cfg.endExclusive),
				),
			)
			.orderBy(users.createdAt),
		db
			.select({ dayNumber: ramadhanCampaigns.dayNumber })
			.from(ramadhanCampaigns)
			.where(eq(ramadhanCampaigns.year, cfg.year)),
	]);

	const dates = createDateRange(cfg.startDate, cfg.endDate);
	const submissionsByDate = aggregateByDate(
		submissionDateRows as TimestampRow[],
		cfg.timezone,
	);
	const approvalsByDate = aggregateByDate(
		approvalDateRows as TimestampRow[],
		cfg.timezone,
	);
	const usersByDate = aggregateByDate(
		userDateRows as TimestampRow[],
		cfg.timezone,
	);

	const dailyTrend = dates.map((date) => ({
		date,
		label: formatDateEnShort(date),
		submissions: submissionsByDate.get(date) ?? 0,
		approvals: approvalsByDate.get(date) ?? 0,
		newUsers: usersByDate.get(date) ?? 0,
	}));

	const filledDaysSet = new Set(
		campaignDaysResult
			.map((row) => toNumber(row.dayNumber))
			.filter((day) => day >= 1 && day <= cfg.targetCampaignDays),
	);

	const missingDays: number[] = [];
	for (let day = 1; day <= cfg.targetCampaignDays; day += 1) {
		if (!filledDaysSet.has(day)) {
			missingDays.push(day);
		}
	}

	const submissionStats = submissionsResult[0] ?? {
		total: 0,
		approved: 0,
		pending: 0,
		rejected: 0,
	};

	const filledDays = filledDaysSet.size;

	return {
		range: {
			timezone: cfg.timezone,
			startDate: cfg.startDate,
			endDate: cfg.endDate,
			startAtIso: cfg.startAt.toISOString(),
			endExclusiveIso: cfg.endExclusive.toISOString(),
			label: `${formatDateEn(cfg.startDate)} – ${formatDateEn(cfg.endDate)}`,
		},
		kpis: {
			newUsers: toNumber(usersResult[0]?.count),
			totalSubmissions: toNumber(submissionStats.total),
			approvedSubmissions: toNumber(submissionStats.approved),
			pendingSubmissions: toNumber(submissionStats.pending),
			rejectedSubmissions: toNumber(submissionStats.rejected),
			approvedInWindow: toNumber(approvedInWindowResult[0]?.count),
			uniqueContributors: toNumber(uniqueContributorsResult[0]?.count),
		},
		rankings: {
			topContributors: topContributorsResult.map((row) => ({
				name: row.name,
				submissions: toNumber(row.submissions),
			})),
			topStates: topStatesResult.map((row) => ({
				state: row.state,
				submissions: toNumber(row.submissions),
			})),
			topCategories: topCategoriesResult.map((row) => ({
				category: row.category,
				submissions: toNumber(row.submissions),
			})),
		},
		dailyTrend,
		campaignProgress: {
			year: cfg.year,
			filledDays,
			targetDays: cfg.targetCampaignDays,
			completionRate:
				cfg.targetCampaignDays > 0
					? Number(((filledDays / cfg.targetCampaignDays) * 100).toFixed(1))
					: 0,
			missingDays,
		},
		generatedAt: new Date().toISOString(),
	};
}

function formatList(items: string[]): string {
	if (items.length === 0) return "-";
	return items.join(", ");
}

export function buildRamadhanWrappedMarkdown(
	stats: RamadhanWrappedStats,
): string {
	const { kpis, rankings, campaignProgress, range } = stats;
	const topContributorLines = rankings.topContributors
		.map((row, index) => `${index + 1}. ${row.name} (${row.submissions})`)
		.join("\n");
	const topStateLines = rankings.topStates
		.map((row) => `- ${row.state}: ${row.submissions}`)
		.join("\n");
	const topCategoryLines = rankings.topCategories
		.map((row) => `- ${row.category}: ${row.submissions}`)
		.join("\n");
	const mostActiveDay = [...stats.dailyTrend].sort(
		(a, b) => b.submissions - a.submissions || a.date.localeCompare(b.date),
	)[0];

	return `# Ramadhan Wrapped 2026 — Sedekah Je

**Period:** ${range.label} (${range.timezone})

## Headline numbers
- New users: **${kpis.newUsers}**
- Institutions submitted: **${kpis.totalSubmissions}**
- Status split: **${kpis.approvedSubmissions} approved**, **${kpis.pendingSubmissions} pending**, **${kpis.rejectedSubmissions} rejected**
- Approved in window: **${kpis.approvedInWindow}**
- Unique contributors: **${kpis.uniqueContributors}**

## Community
### Top 5 contributors
${topContributorLines || "-"}

### Top states
${topStateLines || "-"}

### Top categories
${topCategoryLines || "-"}

## 30 Days 30 QR campaign
- Campaign year: **${campaignProgress.year}**
- Days with content: **${campaignProgress.filledDays}/${campaignProgress.targetDays}**
- Completion: **${campaignProgress.completionRate}%**
- Missing days: **${formatList(campaignProgress.missingDays.map(String))}**

## Daily highlight
- Busiest day (submissions): **${mostActiveDay ? `${formatDateEn(mostActiveDay.date)} (${mostActiveDay.submissions})` : "-"}**

_Generated: ${new Date(stats.generatedAt).toLocaleString("en-GB", {
		timeZone: range.timezone,
	})}_
`;
}
