import { formatDateEnShort } from "@/lib/ramadhan";
import { RAMADHAN_WRAPPED_CONFIG } from "@/lib/ramadhan-wrapped";
import { getUmamiPool } from "@/lib/umami-db";

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
	};
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
			},
			dailyPageviews,
		};
	} catch (error) {
		console.error("[umami-wrapped] Failed to fetch Umami stats:", error);
		return null;
	}
}
