import { formatDateEnShort } from "@/lib/ramadhan";
import { RAMADHAN_WRAPPED_CONFIG } from "@/lib/ramadhan-wrapped";
import { getUmamiPool } from "@/lib/umami-db";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type UmamiWrappedStats = {
	kpis: {
		totalPageviews: number;
		uniqueSessions: number;
		uniqueVisits: number;
		peakDayViews: number;
		peakDayDate: string;
		peakDayLabel: string;
		peakHour: number;
		peakHourViews: number;
		mobilePercent: number;
	};
	rankings: {
		topPages: Array<{ path: string; views: number }>;
		topReferrers: Array<{ domain: string; views: number }>;
		topMosquePages: Array<{ slug: string; path: string; views: number }>;
	};
	dayOfWeekPageviews: Array<{
		day: string;
		dayIndex: number;
		views: number;
	}>;
	weeklyDayOfWeekPageviews: Array<{
		week: number;
		label: string;
		startDate: string;
		endDate: string;
		totalViews: number;
		days: Array<{
			day: string;
			dayIndex: number;
			views: number;
		}>;
	}>;
	hourlyPageviews: Array<{
		hour: number;
		label: string;
		views: number;
	}>;
	dailyPageviews: Array<{
		date: string;
		label: string;
		views: number;
		visitors: number;
	}>;
};

const TZ = RAMADHAN_WRAPPED_CONFIG.timezone;
const START = RAMADHAN_WRAPPED_CONFIG.startAt.toISOString();
const END = RAMADHAN_WRAPPED_CONFIG.endExclusive.toISOString();

function diffDays(fromDate: string, toDate: string): number {
	const from = new Date(`${fromDate}T00:00:00Z`).getTime();
	const to = new Date(`${toDate}T00:00:00Z`).getTime();
	return Math.floor((to - from) / 86_400_000);
}

function addDays(date: string, days: number): string {
	const next = new Date(`${date}T00:00:00Z`);
	next.setUTCDate(next.getUTCDate() + days);
	return next.toISOString().slice(0, 10);
}

function getDayIndex(date: string): number {
	const jsDay = new Date(`${date}T00:00:00Z`).getUTCDay();
	return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Fetch Ramadhan Wrapped analytics from the Umami Postgres database.
 * Returns `null` when the Umami DB is not configured or on error.
 */
export async function getUmamiWrappedStats(): Promise<UmamiWrappedStats | null> {
	const pool = getUmamiPool();
	if (!pool) return null;

	try {
		const [
			totalsResult,
			topPagesResult,
			topReferrersResult,
			dailyResult,
			hourlyResult,
			deviceResult,
			topMosquePagesResult,
		] = await Promise.all([
			// 1. Total pageviews + unique sessions + unique visits
			pool.query<{
				total_pageviews: string;
				unique_sessions: string;
				unique_visits: string;
			}>(
				`SELECT
					COUNT(*) AS total_pageviews,
					COUNT(DISTINCT session_id) AS unique_sessions,
					COUNT(DISTINCT visit_id) AS unique_visits
				FROM website_event
				WHERE created_at >= $1 AND created_at < $2
					AND event_type = 1`,
				[START, END],
			),

			// 2. Top 10 pages by views
			pool.query<{ path: string; views: string }>(
				`SELECT url_path AS path, COUNT(*) AS views
				FROM website_event
				WHERE created_at >= $1 AND created_at < $2
					AND event_type = 1
				GROUP BY url_path
				ORDER BY views DESC
				LIMIT 10`,
				[START, END],
			),

			// 3. Top 10 referrers (excluding self-referral)
			pool.query<{ domain: string; views: string }>(
				`SELECT referrer_domain AS domain, COUNT(*) AS views
				FROM website_event
				WHERE created_at >= $1 AND created_at < $2
					AND event_type = 1
					AND referrer_domain IS NOT NULL
					AND referrer_domain != ''
					AND referrer_domain NOT LIKE '%sedekah.je%'
				GROUP BY referrer_domain
				ORDER BY views DESC
				LIMIT 10`,
				[START, END],
			),

			// 4. Daily pageviews + visitors
			pool.query<{
				day: string;
				views: string;
				visitors: string;
			}>(
				`SELECT
					(created_at AT TIME ZONE 'UTC' AT TIME ZONE '${TZ}')::date::text AS day,
					COUNT(*) AS views,
					COUNT(DISTINCT session_id) AS visitors
				FROM website_event
				WHERE created_at >= $1 AND created_at < $2
					AND event_type = 1
				GROUP BY day
				ORDER BY day`,
				[START, END],
			),

			// 5. Hourly distribution (for peak hour)
			pool.query<{ hour: string; views: string }>(
				`SELECT
					EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE '${TZ}')::int AS hour,
					COUNT(*) AS views
				FROM website_event
				WHERE created_at >= $1 AND created_at < $2
					AND event_type = 1
				GROUP BY hour
				ORDER BY views DESC`,
				[START, END],
			),

			// 6. Device split (for mobile %)
			pool.query<{ device: string; count: string }>(
				`SELECT
					CASE
						WHEN s.os IN ('Android', 'iOS') THEN 'mobile'
						ELSE 'desktop'
					END AS device,
					COUNT(*) AS count
				FROM website_event we
				JOIN session s ON s.session_id = we.session_id
				WHERE we.created_at >= $1 AND we.created_at < $2
					AND we.event_type = 1
				GROUP BY 1`,
				[START, END],
			),

			// 7. Top 5 mosque (masjid) pages by pageviews
			pool.query<{ path: string; views: string }>(
				`SELECT url_path AS path, COUNT(*) AS views
				FROM website_event
				WHERE created_at >= $1 AND created_at < $2
					AND event_type = 1
					AND url_path LIKE '/masjid/%'
				GROUP BY url_path
				ORDER BY views DESC
				LIMIT 5`,
				[START, END],
			),
		]);

		const totals = totalsResult.rows[0];
		const totalPageviews = Number(totals?.total_pageviews ?? 0);
		const uniqueSessions = Number(totals?.unique_sessions ?? 0);
		const uniqueVisits = Number(totals?.unique_visits ?? 0);

		// Peak day
		const dailyPageviews = dailyResult.rows.map((row) => ({
			date: row.day,
			label: formatDateEnShort(row.day),
			views: Number(row.views),
			visitors: Number(row.visitors),
		}));

		const peakDay = [...dailyPageviews].sort((a, b) => b.views - a.views)[0];

		const dayOfWeekPageviews = (() => {
			const map = new Map<number, number>();
			for (const d of dailyPageviews) {
				const dayIdx = getDayIndex(d.date);
				map.set(dayIdx, (map.get(dayIdx) ?? 0) + d.views);
			}
			const result: Array<{
				day: string;
				dayIndex: number;
				views: number;
			}> = [];
			for (let i = 0; i < 7; i++) {
				result.push({
					day: DAY_LABELS[i],
					dayIndex: i,
					views: map.get(i) ?? 0,
				});
			}
			return result;
		})();

		const weeklyDayOfWeekPageviews = (() => {
			const weekCount =
				Math.floor(
					diffDays(
						RAMADHAN_WRAPPED_CONFIG.startDate,
						RAMADHAN_WRAPPED_CONFIG.endDate,
					) / 7,
				) + 1;
			const maps = new Map<number, Map<number, number>>();
			for (const d of dailyPageviews) {
				const dayOffset = diffDays(RAMADHAN_WRAPPED_CONFIG.startDate, d.date);
				if (dayOffset < 0) continue;
				const week = Math.floor(dayOffset / 7) + 1;
				const dayIdx = getDayIndex(d.date);
				const weekMap = maps.get(week) ?? new Map<number, number>();
				weekMap.set(dayIdx, (weekMap.get(dayIdx) ?? 0) + d.views);
				maps.set(week, weekMap);
			}

			return Array.from({ length: weekCount }, (_, index) => {
				const week = index + 1;
				const startDate = addDays(RAMADHAN_WRAPPED_CONFIG.startDate, index * 7);
				const endDate =
					week === weekCount
						? RAMADHAN_WRAPPED_CONFIG.endDate
						: addDays(startDate, 6);
				const weekMap = maps.get(week) ?? new Map<number, number>();
				const days = DAY_LABELS.map((day, dayIndex) => ({
					day,
					dayIndex,
					views: weekMap.get(dayIndex) ?? 0,
				}));
				return {
					week,
					label: `Week ${week}`,
					startDate,
					endDate,
					totalViews: days.reduce((sum, day) => sum + day.views, 0),
					days,
				};
			});
		})();

		const hourlyPageviews = (() => {
			const map = new Map<number, number>();
			for (const row of hourlyResult.rows) {
				const hour = Number(row.hour);
				map.set(hour, Number(row.views));
			}
			const result: Array<{
				hour: number;
				label: string;
				views: number;
			}> = [];
			for (let h = 0; h < 24; h++) {
				result.push({
					hour: h,
					label: `${String(h).padStart(2, "0")}:00`,
					views: map.get(h) ?? 0,
				});
			}
			return result;
		})();

		// Peak hour
		const peakHourRow = hourlyResult.rows[0];
		const peakHour = Number(peakHourRow?.hour ?? 0);
		const peakHourViews = Number(peakHourRow?.views ?? 0);

		// Mobile %
		const deviceMap = new Map(
			deviceResult.rows.map((r) => [r.device, Number(r.count)]),
		);
		const mobileCount = deviceMap.get("mobile") ?? 0;
		const desktopCount = deviceMap.get("desktop") ?? 0;
		const totalDevices = mobileCount + desktopCount;
		const mobilePercent =
			totalDevices > 0
				? Number(((mobileCount / totalDevices) * 100).toFixed(1))
				: 0;

		return {
			kpis: {
				totalPageviews,
				uniqueSessions,
				uniqueVisits,
				peakDayViews: peakDay?.views ?? 0,
				peakDayDate: peakDay?.date ?? "",
				peakDayLabel: peakDay?.label ?? "",
				peakHour,
				peakHourViews,
				mobilePercent,
			},
			rankings: {
				topPages: topPagesResult.rows.map((r) => ({
					path: r.path,
					views: Number(r.views),
				})),
				topReferrers: topReferrersResult.rows.map((r) => ({
					domain: r.domain,
					views: Number(r.views),
				})),
				topMosquePages: topMosquePagesResult.rows.map((r) => {
					const path = r.path;
					const slug = path.replace(/^\/masjid\//, "");
					return { slug, path, views: Number(r.views) };
				}),
			},
			dayOfWeekPageviews,
			weeklyDayOfWeekPageviews,
			hourlyPageviews,
			dailyPageviews,
		};
	} catch (error) {
		console.error("[umami-wrapped] Failed to fetch Umami stats:", error);
		return null;
	}
}
