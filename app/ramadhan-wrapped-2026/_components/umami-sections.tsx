import { inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import type { UmamiWrappedStats } from "@/lib/ramadhan-wrapped-umami";
import { getUmamiWrappedStats } from "@/lib/ramadhan-wrapped-umami";
import { DailyPageviewsChart } from "./daily-pageviews-chart";
import { HourlyChart } from "./hourly-chart";
import { ImpactNumber } from "./impact-number";
import { formatNumber, formatPercent } from "./shared";
import { ChapterSubtitle, ChapterTitle, StoryProse } from "./story-chapter";
import { WeeklyTrafficChart } from "./weekly-traffic-chart";

const getUmamiStatsCached = unstable_cache(
	async () => getUmamiWrappedStats(),
	["ramadhan-wrapped-2026-umami-v2"],
	{
		revalidate: 300,
		tags: ["ramadhan-wrapped-2026-umami"],
	},
);

export async function UmamiSections({
	stats,
}: {
	stats: UmamiWrappedStats | null;
}) {
	if (!stats) return null;

	const peakDayLabel = stats.kpis.peakDayLabel || "-";

	const busiestWeekday = [...stats.dayOfWeekPageviews].sort(
		(a, b) => b.views - a.views,
	)[0];
	const busiestHour = [...stats.hourlyPageviews].sort(
		(a, b) => b.views - a.views,
	)[0];

	const topMosqueSlugs = stats.rankings.topMosquePages.map((p) => p.slug);
	const [institutionsByName] = await Promise.all([
		topMosqueSlugs.length > 0
			? db
					.select({ slug: institutions.slug, name: institutions.name })
					.from(institutions)
					.where(inArray(institutions.slug, topMosqueSlugs))
			: [],
	]);
	const slugToName = new Map(
		institutionsByName.map((inst) => [inst.slug, inst.name]),
	);

	return (
		<>
			<ChapterSubtitle>The reach</ChapterSubtitle>
			<ChapterTitle>People came to give</ChapterTitle>
			<StoryProse className="mt-3">
				Visitors from across Malaysia and beyond found their way to Sedekah Je
				during Ramadhan.
				{stats.kpis.peakDayLabel && (
					<>
						{" "}
						The biggest spike was on{" "}
						<strong className="font-semibold text-foreground">
							{peakDayLabel}
						</strong>
						.
					</>
				)}
			</StoryProse>

			<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
				<ImpactNumber
					value={stats.kpis.totalPageviews}
					label="Total pageviews"
					description="Every page load during the campaign"
					size="large"
				/>
				<ImpactNumber
					value={stats.kpis.uniqueVisits}
					label="Unique visitors"
					description="Distinct visits in the period"
				/>
			</div>

			<div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
				<div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5 dark:border-border/80 dark:shadow-none">
					<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Mobile traffic
					</p>
					<p className="mt-2 font-heading text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
						{formatPercent(stats.kpis.mobilePercent, 0)}
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Visitors on mobile devices
					</p>
				</div>
				<div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5 dark:border-border/80 dark:shadow-none">
					<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Peak hour
					</p>
					<p className="mt-2 font-heading text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
						{stats.kpis.peakHour}:00
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{formatNumber(stats.kpis.peakHourViews)} pageviews
					</p>
				</div>
			</div>

			<div className="mt-8">
				<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
					By day of week
				</h3>
				<p className="text-xs text-muted-foreground">
					Pageviews per weekday, split by Ramadhan week
				</p>
				<WeeklyTrafficChart
					weeks={stats.weeklyDayOfWeekPageviews}
					className="mt-4"
				/>
			</div>

			<div className="mt-8">
				<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
					By time of day
				</h3>
				<p className="text-xs text-muted-foreground">
					Pageview volume by hour (MYT)
				</p>
				<div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
					<div className="p-4 pt-5 sm:p-5 sm:pt-6">
						<HourlyChart
							data={stats.hourlyPageviews}
							dataKey="views"
							label="Pageviews"
							color="oklch(var(--chart-2))"
						/>
					</div>
				</div>
			</div>

			<div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
				<div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5 dark:border-border/80 dark:shadow-none">
					<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Busiest weekday
					</p>
					<p className="mt-2 font-heading text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
						{busiestWeekday?.day ?? "-"}
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{formatNumber(busiestWeekday?.views ?? 0)} pageviews
					</p>
				</div>
				<div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5 dark:border-border/80 dark:shadow-none">
					<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Peak hour
					</p>
					<p className="mt-2 font-heading text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
						{busiestHour?.label ?? `${stats.kpis.peakHour}:00`}
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{formatNumber(busiestHour?.views ?? stats.kpis.peakHourViews)}{" "}
						pageviews
					</p>
				</div>
			</div>

			<div className="mt-8">
				<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
					Daily pageviews
				</h3>
				<div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
					<div className="p-4 pt-5 sm:p-5 sm:pt-6">
						<DailyPageviewsChart
							data={stats.dailyPageviews.map((d) => ({
								label: d.label,
								views: d.views,
							}))}
						/>
					</div>
				</div>
			</div>

			{(stats.rankings.topPages.length > 0 ||
				stats.rankings.topReferrers.length > 0) && (
				<div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
					{stats.rankings.topPages.length > 0 && (
						<div>
							<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
								Most visited pages
							</h3>
							<ul className="mt-3 space-y-2">
								{stats.rankings.topPages.slice(0, 5).map((row, i) => (
									<li
										key={`${row.path}-${i}`}
										className="flex items-center gap-3 text-sm"
									>
										<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums text-muted-foreground dark:bg-muted/80">
											{i + 1}
										</span>
										<span className="min-w-0 flex-1 truncate text-foreground/90">
											{row.path}
										</span>
										<span className="shrink-0 font-semibold tabular-nums text-muted-foreground">
											{formatNumber(row.views)}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}
					{stats.rankings.topReferrers.length > 0 && (
						<div>
							<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
								Traffic sources
							</h3>
							<ul className="mt-3 space-y-2">
								{stats.rankings.topReferrers.slice(0, 5).map((row, i) => (
									<li
										key={`${row.domain}-${i}`}
										className="flex items-center gap-3 text-sm"
									>
										<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums text-muted-foreground dark:bg-muted/80">
											{i + 1}
										</span>
										<span className="min-w-0 flex-1 truncate text-foreground/90">
											{row.domain}
										</span>
										<span className="shrink-0 font-semibold tabular-nums text-muted-foreground">
											{formatNumber(row.views)}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{stats.rankings.topMosquePages.length > 0 && (
				<div className="mt-10">
					<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
						Most visited mosques
					</h3>
					<StoryProse className="mt-2">
						The top 5 masjids people looked up during Ramadhan.
					</StoryProse>
					<ul className="mt-3 space-y-2">
						{stats.rankings.topMosquePages.map((row, i) => {
							const name = slugToName.get(row.slug) ?? row.slug;
							return (
								<li key={row.slug} className="flex items-center gap-3 text-sm">
									<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums text-muted-foreground dark:bg-muted/80">
										{i + 1}
									</span>
									<Link
										href={`/masjid/${row.slug}`}
										className="min-w-0 flex-1 truncate text-foreground/90 underline-offset-2 hover:underline"
									>
										{name}
									</Link>
									<span className="shrink-0 font-semibold tabular-nums text-muted-foreground">
										{formatNumber(row.views)}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</>
	);
}

export async function AsyncUmamiSections() {
	const umamiStats = await getUmamiStatsCached();
	return <UmamiSections stats={umamiStats} />;
}
