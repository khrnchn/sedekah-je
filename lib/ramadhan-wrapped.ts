import {
	and,
	count,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	lt,
	notInArray,
	or,
	sql,
} from "drizzle-orm";
import { db } from "@/db";
import { institutions, ramadhanCampaigns, users } from "@/db/schema";
import { formatDateEn, formatDateEnShort } from "@/lib/ramadhan";

const EXCLUDED_CONTRIBUTOR_NAMES = ["Akrimi Nasir"] as const;

export const RAMADHAN_WRAPPED_CONFIG = {
	year: 2026,
	timezone: "Asia/Kuala_Lumpur",
	startDate: "2026-02-19",
	endDate: "2026-03-20",
	startAt: new Date("2026-02-18T16:00:00.000Z"),
	endExclusive: new Date("2026-03-20T16:00:00.000Z"),
	targetCampaignDays: 30,
} as const;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

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
		firstTimeContributors: number;
		approvalRate: number;
		avgSubmissionsPerDay: number;
	};
	contributorShape: {
		oneSubmissionContributors: number;
		fivePlusContributors: number;
		tenPlusContributors: number;
		medianSubmissions: number;
		avgSubmissions: number;
		topContributorSubmissions: number;
	};
	dataCompleteness: {
		withQr: number;
		withCoords: number;
		withSource: number;
		withRemarks: number;
		qrPercent: number;
		coordsPercent: number;
		sourcePercent: number;
		remarksPercent: number;
	};
	reviewSpeed: {
		reviewed: number;
		avgHours: number;
		medianHours: number;
		p90Hours: number;
	};
	directoryScale: {
		allInstitutions: number;
		ramadhanSharePercent: number;
		statesCovered: number;
		citiesCovered: number;
		categoriesCovered: number;
		withSocial: number;
		socialPercent: number;
	};
	growthMomentum: {
		firstHalf: number;
		secondHalf: number;
		changePercent: number;
	};
	rankings: {
		topContributors: Array<{ name: string; submissions: number }>;
		topStates: Array<{ state: string; submissions: number }>;
		topCategories: Array<{ category: string; submissions: number }>;
		topCities: Array<{ city: string; state: string; submissions: number }>;
		topCategoryStates: Array<{
			category: string;
			state: string;
			submissions: number;
		}>;
	};
	dayOfWeekActivity: Array<{
		day: string;
		dayIndex: number;
		submissions: number;
	}>;
	hourlyActivity: Array<{
		hour: number;
		label: string;
		submissions: number;
	}>;
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
		featuredDays: Array<{
			dayNumber: number;
			institutionName: string;
			institutionSlug: string;
			institutionCategory: string;
			institutionState: string | null;
			caption: string | null;
		}>;
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

function toTimezoneDayOfWeek(date: Date, timezone: string): number {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		weekday: "short",
	});
	const day = formatter.format(date);
	return DAY_LABELS.indexOf(day as (typeof DAY_LABELS)[number]);
}

function toTimezoneHour(date: Date, timezone: string): number {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		hour: "2-digit",
		hourCycle: "h23",
	});
	const value = Number(formatter.format(date));
	return Number.isFinite(value) ? value % 24 : 0;
}

function median(values: number[], decimals?: number): number {
	if (values.length === 0) return 0;
	const middle = Math.floor(values.length / 2);
	const value =
		values.length % 2 === 1
			? values[middle]
			: (values[middle - 1] + values[middle]) / 2;

	return decimals === undefined ? value : Number(value.toFixed(decimals));
}

function aggregateByDayOfWeek(
	rows: TimestampRow[],
	timezone: string,
): Array<{ day: string; dayIndex: number; submissions: number }> {
	const map = new Map<number, number>();
	for (const row of rows) {
		if (!row.ts) continue;
		const idx = toTimezoneDayOfWeek(row.ts, timezone);
		if (idx < 0) continue;
		map.set(idx, (map.get(idx) ?? 0) + 1);
	}
	const result: Array<{ day: string; dayIndex: number; submissions: number }> =
		[];
	for (let i = 0; i < 7; i++) {
		result.push({
			day: DAY_LABELS[i],
			dayIndex: i,
			submissions: map.get(i) ?? 0,
		});
	}
	return result;
}

function aggregateByHour(
	rows: TimestampRow[],
	timezone: string,
): Array<{ hour: number; label: string; submissions: number }> {
	const map = new Map<number, number>();
	for (const row of rows) {
		if (!row.ts) continue;
		const h = toTimezoneHour(row.ts, timezone);
		map.set(h, (map.get(h) ?? 0) + 1);
	}
	const result: Array<{ hour: number; label: string; submissions: number }> =
		[];
	for (let h = 0; h < 24; h++) {
		result.push({
			hour: h,
			label: `${String(h).padStart(2, "0")}:00`,
			submissions: map.get(h) ?? 0,
		});
	}
	return result;
}

export async function getRamadhanWrappedStats(): Promise<RamadhanWrappedStats> {
	const cfg = RAMADHAN_WRAPPED_CONFIG;

	const excludedUsers = await db
		.select({ id: users.id })
		.from(users)
		.where(inArray(users.name, [...EXCLUDED_CONTRIBUTOR_NAMES]));
	const excludedIds = excludedUsers.map((u) => u.id);

	const excludeContributor =
		excludedIds.length > 0
			? or(
					isNull(institutions.contributorId),
					notInArray(institutions.contributorId, excludedIds),
				)
			: undefined;
	const excludeUser =
		excludedIds.length > 0 ? notInArray(users.id, excludedIds) : undefined;

	const [
		allInstitutionsResult,
		usersResult,
		submissionsResult,
		approvedInWindowResult,
		uniqueContributorsResult,
		topContributorsResult,
		topStatesResult,
		topCategoriesResult,
		topCitiesResult,
		topCategoryStatesResult,
		contributorSubmissionCountsResult,
		reviewLatencyRowsResult,
		submissionDateRows,
		approvalDateRows,
		userDateRows,
		campaignDaysResult,
	] = await Promise.all([
		db.select({ count: count() }).from(institutions),
		db
			.select({ count: count() })
			.from(users)
			.where(
				and(
					gte(users.createdAt, cfg.startAt),
					lt(users.createdAt, cfg.endExclusive),
					excludeUser,
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
				withCoords:
					sql<number>`COUNT(CASE WHEN ${institutions.coords} IS NOT NULL THEN 1 END)`.mapWith(
						Number,
					),
				withQr:
					sql<number>`COUNT(CASE WHEN ${institutions.qrImage} IS NOT NULL OR ${institutions.qrContent} IS NOT NULL THEN 1 END)`.mapWith(
						Number,
					),
				withSource:
					sql<number>`COUNT(CASE WHEN ${institutions.sourceUrl} IS NOT NULL AND ${institutions.sourceUrl} <> '' THEN 1 END)`.mapWith(
						Number,
					),
				withRemarks:
					sql<number>`COUNT(CASE WHEN ${institutions.contributorRemarks} IS NOT NULL AND ${institutions.contributorRemarks} <> '' THEN 1 END)`.mapWith(
						Number,
					),
				withSocial:
					sql<number>`COUNT(CASE WHEN ${institutions.socialMedia} IS NOT NULL THEN 1 END)`.mapWith(
						Number,
					),
				statesCovered:
					sql<number>`COUNT(DISTINCT ${institutions.state})`.mapWith(Number),
				citiesCovered:
					sql<number>`COUNT(DISTINCT ${institutions.city})`.mapWith(Number),
				categoriesCovered:
					sql<number>`COUNT(DISTINCT ${institutions.category})`.mapWith(Number),
			})
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
					excludeContributor,
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
					excludeContributor,
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
					excludeContributor,
				),
			),
		db
			.select({
				name: sql<string>`COALESCE(NULLIF(${users.name}, ''), NULLIF(${users.username}, ''), 'Anonymous')`,
				submissions: count(),
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
					excludeContributor,
				),
			)
			.groupBy(
				sql`COALESCE(NULLIF(${users.name}, ''), NULLIF(${users.username}, ''), 'Anonymous')`,
			)
			.orderBy(
				sql`count(*) DESC`,
				sql`COALESCE(NULLIF(${users.name}, ''), NULLIF(${users.username}, ''), 'Anonymous') ASC`,
			)
			.limit(5),
		db
			.select({ state: institutions.state, submissions: count() })
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
					excludeContributor,
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
					excludeContributor,
				),
			)
			.groupBy(institutions.category)
			.orderBy(sql`count(*) DESC`, institutions.category)
			.limit(5),
		db
			.select({
				city: institutions.city,
				state: institutions.state,
				submissions: count(),
			})
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
					excludeContributor,
				),
			)
			.groupBy(institutions.city, institutions.state)
			.orderBy(sql`count(*) DESC`, institutions.city)
			.limit(10),
		db
			.select({
				category: institutions.category,
				state: institutions.state,
				submissions: count(),
			})
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
					excludeContributor,
				),
			)
			.groupBy(institutions.category, institutions.state)
			.orderBy(sql`count(*) DESC`, institutions.state, institutions.category)
			.limit(10),
		db
			.select({
				contributorId: institutions.contributorId,
				submissions: count(),
			})
			.from(institutions)
			.where(
				and(
					isNotNull(institutions.contributorId),
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
					excludedIds.length > 0
						? notInArray(institutions.contributorId, excludedIds)
						: undefined,
				),
			)
			.groupBy(institutions.contributorId),
		db
			.select({
				hours:
					sql<number>`EXTRACT(EPOCH FROM (${institutions.reviewedAt} - ${institutions.createdAt})) / 3600`.mapWith(
						Number,
					),
			})
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
					isNotNull(institutions.reviewedAt),
					excludeContributor,
				),
			),
		db
			.select({
				ts: institutions.createdAt,
			})
			.from(institutions)
			.where(
				and(
					gte(institutions.createdAt, cfg.startAt),
					lt(institutions.createdAt, cfg.endExclusive),
					excludeContributor,
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
					excludeContributor,
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
					excludeUser,
				),
			)
			.orderBy(users.createdAt),
		db
			.select({
				dayNumber: ramadhanCampaigns.dayNumber,
				institutionName: institutions.name,
				institutionSlug: institutions.slug,
				institutionCategory: institutions.category,
				institutionState: institutions.state,
				caption: ramadhanCampaigns.caption,
			})
			.from(ramadhanCampaigns)
			.innerJoin(
				institutions,
				eq(ramadhanCampaigns.institutionId, institutions.id),
			)
			.where(eq(ramadhanCampaigns.year, cfg.year))
			.orderBy(ramadhanCampaigns.dayNumber),
	]);

	const firstTimeContributorWhere =
		excludedIds.length > 0
			? and(
					isNotNull(institutions.contributorId),
					notInArray(institutions.contributorId, excludedIds),
				)
			: isNotNull(institutions.contributorId);

	const firstTimeContributorResult = await db
		.select({
			contributorId: institutions.contributorId,
		})
		.from(institutions)
		.where(firstTimeContributorWhere)
		.groupBy(institutions.contributorId)
		.having(
			and(
				gte(sql`MIN(${institutions.createdAt})`, cfg.startAt.toISOString()),
				lt(sql`MIN(${institutions.createdAt})`, cfg.endExclusive.toISOString()),
			),
		);

	const firstTimeContributors = firstTimeContributorResult.length;

	const dayOfWeekActivity = aggregateByDayOfWeek(
		submissionDateRows as TimestampRow[],
		cfg.timezone,
	);
	const hourlyActivity = aggregateByHour(
		submissionDateRows as TimestampRow[],
		cfg.timezone,
	);

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
		withCoords: 0,
		withQr: 0,
		withSource: 0,
		withRemarks: 0,
		withSocial: 0,
		statesCovered: 0,
		citiesCovered: 0,
		categoriesCovered: 0,
	};

	const filledDays = filledDaysSet.size;
	const totalSubs = toNumber(submissionStats.total);
	const approvedSubs = toNumber(submissionStats.approved);
	const allInstitutions = toNumber(allInstitutionsResult[0]?.count);
	const contributorSubmissionCounts = contributorSubmissionCountsResult
		.map((row) => toNumber(row.submissions))
		.sort((a, b) => a - b);
	const contributorCount = contributorSubmissionCounts.length;
	const oneSubmissionContributors = contributorSubmissionCounts.filter(
		(value) => value === 1,
	).length;
	const fivePlusContributors = contributorSubmissionCounts.filter(
		(value) => value >= 5,
	).length;
	const tenPlusContributors = contributorSubmissionCounts.filter(
		(value) => value >= 10,
	).length;
	const medianSubmissions = median(contributorSubmissionCounts, 1);
	const avgSubmissions =
		contributorCount > 0
			? Number(
					(
						contributorSubmissionCounts.reduce((sum, value) => sum + value, 0) /
						contributorCount
					).toFixed(1),
				)
			: 0;
	const reviewHours = reviewLatencyRowsResult
		.map((row) => Number(row.hours))
		.filter((hours) => Number.isFinite(hours) && hours >= 0)
		.sort((a, b) => a - b);
	const reviewedCount = reviewHours.length;
	const avgReviewHours =
		reviewedCount > 0
			? Number(
					(
						reviewHours.reduce((sum, hours) => sum + hours, 0) / reviewedCount
					).toFixed(1),
				)
			: 0;
	const medianReviewHours = median(reviewHours, 1);
	const p90ReviewHours =
		reviewedCount > 0
			? Number(
					reviewHours[
						Math.min(
							reviewHours.length - 1,
							Math.ceil(reviewHours.length * 0.9) - 1,
						)
					].toFixed(1),
				)
			: 0;
	const withQr = toNumber(submissionStats.withQr);
	const withCoords = toNumber(submissionStats.withCoords);
	const withSource = toNumber(submissionStats.withSource);
	const withRemarks = toNumber(submissionStats.withRemarks);
	const withSocial = toNumber(submissionStats.withSocial);
	const toPercent = (value: number) =>
		totalSubs > 0 ? Number(((value / totalSubs) * 100).toFixed(1)) : 0;
	const midIndex = Math.floor(dates.length / 2);
	const firstHalfSubs = dailyTrend
		.slice(0, midIndex)
		.reduce((sum, d) => sum + d.submissions, 0);
	const secondHalfSubs = dailyTrend
		.slice(midIndex)
		.reduce((sum, d) => sum + d.submissions, 0);
	const changePercent =
		firstHalfSubs > 0
			? Number(
					(((secondHalfSubs - firstHalfSubs) / firstHalfSubs) * 100).toFixed(1),
				)
			: secondHalfSubs > 0
				? 100
				: 0;

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
			totalSubmissions: totalSubs,
			approvedSubmissions: approvedSubs,
			pendingSubmissions: toNumber(submissionStats.pending),
			rejectedSubmissions: toNumber(submissionStats.rejected),
			approvedInWindow: toNumber(approvedInWindowResult[0]?.count),
			uniqueContributors: toNumber(uniqueContributorsResult[0]?.count),
			firstTimeContributors: firstTimeContributors,
			approvalRate:
				totalSubs > 0
					? Number(((approvedSubs / totalSubs) * 100).toFixed(1))
					: 0,
			avgSubmissionsPerDay:
				dates.length > 0 ? Number((totalSubs / dates.length).toFixed(1)) : 0,
		},
		contributorShape: {
			oneSubmissionContributors,
			fivePlusContributors,
			tenPlusContributors,
			medianSubmissions,
			avgSubmissions,
			topContributorSubmissions:
				contributorSubmissionCounts[contributorSubmissionCounts.length - 1] ??
				0,
		},
		dataCompleteness: {
			withQr,
			withCoords,
			withSource,
			withRemarks,
			qrPercent: toPercent(withQr),
			coordsPercent: toPercent(withCoords),
			sourcePercent: toPercent(withSource),
			remarksPercent: toPercent(withRemarks),
		},
		reviewSpeed: {
			reviewed: reviewedCount,
			avgHours: avgReviewHours,
			medianHours: medianReviewHours,
			p90Hours: p90ReviewHours,
		},
		directoryScale: {
			allInstitutions,
			ramadhanSharePercent:
				allInstitutions > 0
					? Number(((totalSubs / allInstitutions) * 100).toFixed(1))
					: 0,
			statesCovered: toNumber(submissionStats.statesCovered),
			citiesCovered: toNumber(submissionStats.citiesCovered),
			categoriesCovered: toNumber(submissionStats.categoriesCovered),
			withSocial,
			socialPercent: toPercent(withSocial),
		},
		growthMomentum: {
			firstHalf: firstHalfSubs,
			secondHalf: secondHalfSubs,
			changePercent,
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
			topCities: topCitiesResult.map((row) => ({
				city: row.city,
				state: row.state,
				submissions: toNumber(row.submissions),
			})),
			topCategoryStates: topCategoryStatesResult.map((row) => ({
				category: row.category,
				state: row.state,
				submissions: toNumber(row.submissions),
			})),
		},
		dayOfWeekActivity,
		hourlyActivity,
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
			featuredDays: campaignDaysResult.map((row) => ({
				dayNumber: toNumber(row.dayNumber),
				institutionName: row.institutionName ?? "Unknown",
				institutionSlug: row.institutionSlug ?? "",
				institutionCategory: row.institutionCategory ?? "lain-lain",
				institutionState: row.institutionState,
				caption: row.caption,
			})),
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
