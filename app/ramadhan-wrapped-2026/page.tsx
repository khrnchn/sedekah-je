import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import {
	getRamadhanWrappedStats,
	RAMADHAN_WRAPPED_CONFIG,
} from "@/lib/ramadhan-wrapped";
import { cn } from "@/lib/utils";
import { ApprovalBar } from "./_components/approval-bar";
import { CityBarList } from "./_components/city-bar-list";
import {
	type CommunityInsight,
	CommunityInsights,
} from "./_components/community-insights";
import { ContributorSpotlight } from "./_components/contributor-spotlight";
import { DailySubmissionsChart } from "./_components/daily-submissions-chart";
import { DayCalendar } from "./_components/day-calendar";
import { DayOfWeekChart } from "./_components/day-of-week-chart";
import { AsyncGitHubSection } from "./_components/github-section";
import { HourlyChart } from "./_components/hourly-chart";
import { ImpactNumber } from "./_components/impact-number";
import {
	GitHubSectionSkeleton,
	UmamiSectionsSkeleton,
} from "./_components/loading-skeletons";
import { ShareButton } from "./_components/share-button";
import { formatNumber, formatPercent } from "./_components/shared";
import { CategoryPills, StateBarList } from "./_components/state-bar-list";
import {
	ChapterSubtitle,
	ChapterTitle,
	StoryChapter,
	StoryProse,
} from "./_components/story-chapter";
import { AsyncUmamiSections } from "./_components/umami-sections";

export const metadata: Metadata = {
	title: "Ramadhan Wrapped 2026 | Sedekah Je",
	description:
		"A snapshot of the Sedekah Je community during the Ramadhan 2026 campaign.",
	openGraph: {
		title: "Ramadhan Wrapped 2026 | Sedekah Je",
		description:
			"Key community stats, institution submissions, and 30 Days 30 QR progress.",
		images: ["https://sedekah.je/sedekahje-og-ramadhan.png"],
	},
};

type SearchParams = {
	poster?: string;
};

type Props = {
	searchParams: Promise<SearchParams>;
};

const getWrappedStatsCached = unstable_cache(
	async () => getRamadhanWrappedStats(),
	["ramadhan-wrapped-2026-v4"],
	{
		revalidate: 300,
		tags: ["ramadhan-wrapped-2026"],
	},
);

export default async function RamadhanWrappedPage({ searchParams }: Props) {
	const params = await searchParams;
	const posterMode = params.poster === "1" || params.poster === "true";
	const stats = await getWrappedStatsCached();
	const kpis = {
		...stats.kpis,
		firstTimeContributors: stats.kpis.firstTimeContributors ?? 0,
		approvalRate: stats.kpis.approvalRate ?? 0,
		avgSubmissionsPerDay: stats.kpis.avgSubmissionsPerDay ?? 0,
	};
	const rankings = stats.rankings;
	const campaignProgress = stats.campaignProgress;
	const growthMomentum = stats.growthMomentum ?? {
		firstHalf: 0,
		secondHalf: 0,
		changePercent: 0,
	};
	const totalSubs = kpis.totalSubmissions;

	const strongestDay = [...stats.dailyTrend].sort(
		(a, b) => b.submissions - a.submissions || a.date.localeCompare(b.date),
	)[0];
	const strongestDayShare =
		strongestDay && totalSubs > 0
			? Number(((strongestDay.submissions / totalSubs) * 100).toFixed(1))
			: 0;

	const chartPoints = stats.dailyTrend.map((row) => ({
		label: row.label,
		submissions: row.submissions,
	}));

	const topState = rankings.topStates[0];
	const topStateShare =
		topState && totalSubs > 0
			? Math.round((topState.submissions / totalSubs) * 100)
			: 0;
	const topCategoryState = rankings.topCategoryStates?.[0];
	const topCategoryStateShare =
		topCategoryState && totalSubs > 0
			? Math.round((topCategoryState.submissions / totalSubs) * 100)
			: 0;
	const topContributor = rankings.topContributors[0];
	const topContributorShare =
		topContributor && totalSubs > 0
			? Math.round((topContributor.submissions / totalSubs) * 100)
			: 0;
	const growthDirection =
		growthMomentum.changePercent > 0
			? "up"
			: growthMomentum.changePercent < 0
				? "down"
				: "flat";

	const { dayOfWeekActivity, hourlyActivity } = stats;
	const topCity = rankings.topCities[0];
	const topCityShare =
		topCity && totalSubs > 0
			? Math.round((topCity.submissions / totalSubs) * 100)
			: 0;
	const busiestWeekday = [...dayOfWeekActivity].sort(
		(a, b) => b.submissions - a.submissions,
	)[0];
	const busiestHour = [...hourlyActivity].sort(
		(a, b) => b.submissions - a.submissions,
	)[0];
	const firstTimeContributorShare =
		kpis.firstTimeContributors > 0 && kpis.uniqueContributors > 0
			? Math.round((kpis.firstTimeContributors / kpis.uniqueContributors) * 100)
			: 0;
	const communityInsights = buildCommunityInsights({
		firstTimeContributors: kpis.firstTimeContributors,
		firstTimeContributorShare,
		growthDirection,
		growthChangePercent: growthMomentum.changePercent,
		topState: topState
			? {
					name: topState.state,
					share: topStateShare,
					submissions: topState.submissions,
				}
			: null,
		topCity: topCity
			? {
					name: topCity.city,
					state: topCity.state,
					share: topCityShare,
					submissions: topCity.submissions,
				}
			: null,
		busiestWeekday,
		busiestHour,
		approvalRate: kpis.approvalRate,
		contributorShape: stats.contributorShape,
		dataCompleteness: stats.dataCompleteness,
		reviewSpeed: stats.reviewSpeed,
		directoryScale: stats.directoryScale,
		strongestDay: strongestDay
			? {
					label: strongestDay.label,
					submissions: strongestDay.submissions,
					share: strongestDayShare,
					avgMultiple:
						kpis.avgSubmissionsPerDay > 0
							? Number(
									(
										strongestDay.submissions / kpis.avgSubmissionsPerDay
									).toFixed(1),
								)
							: 0,
				}
			: null,
		topCategoryState: topCategoryState
			? {
					category: topCategoryState.category,
					state: topCategoryState.state,
					share: topCategoryStateShare,
					submissions: topCategoryState.submissions,
				}
			: null,
	});

	return (
		<>
			{!posterMode && <Header compactMobileBrand />}
			<main className={cn("min-h-screen bg-background", "dark:bg-background")}>
				<div
					className={cn(
						"mx-auto w-full max-w-3xl px-4 pt-12",
						"pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
						"sm:px-6 sm:pt-16 md:pt-20",
						"md:pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]",
					)}
				>
					{/* ── Prologue ── */}
					<StoryChapter>
						<div className="relative mb-4 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.07] via-card to-accent/[0.06] p-6 shadow-sm sm:mb-6 sm:p-8 md:p-10 dark:from-primary/[0.12] dark:via-card dark:to-accent/[0.08]">
							<div
								className="pointer-events-none absolute -right-4 -top-4 opacity-[0.04] sm:right-2 sm:top-2"
								aria-hidden
							>
								<svg
									viewBox="0 0 160 160"
									fill="none"
									className="size-32 sm:size-40 md:size-48"
								>
									<circle cx="80" cy="80" r="70" className="fill-primary" />
									<circle cx="100" cy="65" r="58" className="fill-card" />
									<circle cx="42" cy="28" r="5" className="fill-primary" />
								</svg>
							</div>
							<div className="relative">
								<span
									className={cn(
										"inline-flex items-center rounded-full border border-primary/30",
										"bg-primary/10 px-3 py-1 text-[0.65rem] font-bold uppercase",
										"tracking-[0.18em] text-primary",
									)}
								>
									Sedekah Je
								</span>
								<h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:mt-5 sm:text-4xl md:text-5xl">
									Ramadhan Wrapped {RAMADHAN_WRAPPED_CONFIG.year}
								</h1>
								<StoryProse className="mt-4">
									30 days of community, generosity, and open-source
									collaboration. Here is what the Sedekah Je community
									accomplished between {stats.range.label}.
								</StoryProse>
							</div>
						</div>
					</StoryChapter>

					{/* ── The Count ── */}
					<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
						<ChapterSubtitle>The count</ChapterSubtitle>
						<ChapterTitle>
							{kpis.totalSubmissions > 0
								? "This Ramadhan, the community showed up"
								: "A quiet start"}
						</ChapterTitle>
						<StoryProse className="mt-3">
							{kpis.totalSubmissions > 0 ? (
								<>
									{kpis.totalSubmissions.toLocaleString("en-GB")} institutions
									were submitted in 30 days. That is{" "}
									<Strong>{kpis.avgSubmissionsPerDay}</Strong> per day on
									average.
								</>
							) : (
								"No institutions were submitted during this Ramadhan period."
							)}
						</StoryProse>

						<div className="mt-10 sm:mt-12">
							<ImpactNumber
								value={kpis.totalSubmissions}
								label="Institutions submitted"
								suffix="total"
								size="large"
							/>
						</div>

						<div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
							<div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5 dark:border-border/80 dark:shadow-none">
								<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
									New users
								</p>
								<p className="mt-2 font-heading text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
									{formatNumber(kpis.newUsers)}
								</p>
							</div>
							<div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5 dark:border-border/80 dark:shadow-none">
								<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
									Contributors
								</p>
								<p className="mt-2 font-heading text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
									{formatNumber(kpis.uniqueContributors)}
								</p>
							</div>
							<div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5 dark:border-border/80 dark:shadow-none">
								<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
									Avg per day
								</p>
								<p className="mt-2 font-heading text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
									{kpis.avgSubmissionsPerDay}
								</p>
							</div>
							<div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5 dark:border-border/80 dark:shadow-none">
								<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
									Approval rate
								</p>
								<p className="mt-2 font-heading text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
									{formatPercent(kpis.approvalRate)}
								</p>
							</div>
						</div>

						{kpis.totalSubmissions > 0 && (
							<div className="mt-10">
								<h3 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
									Approval breakdown
								</h3>
								<StoryProse className="mt-2">
									<Strong>{formatPercent(kpis.approvalRate)}</Strong> of
									submissions were approved. Here is the full split.
								</StoryProse>
								<div className="mt-5">
									<ApprovalBar
										approved={kpis.approvedSubmissions}
										pending={kpis.pendingSubmissions}
										rejected={kpis.rejectedSubmissions}
										total={kpis.totalSubmissions}
									/>
								</div>
							</div>
						)}
					</StoryChapter>

					{/* ── The People ── */}
					<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
						<ChapterSubtitle>The people</ChapterSubtitle>
						<ChapterTitle>Behind every submission</ChapterTitle>
						<StoryProse className="mt-3">
							{kpis.firstTimeContributors > 0 ? (
								<>
									<Strong>{kpis.firstTimeContributors}</Strong> contributors
									made their first-ever submission during this Ramadhan.
									{kpis.uniqueContributors > 0 &&
										` ${kpis.uniqueContributors} unique contributors kept the directory growing.`}
									{topContributor && topContributorShare > 0 && (
										<>
											{" "}
											<Strong>{topContributor.name}</Strong> led the charge with{" "}
											<Strong>{topContributor.submissions}</Strong> submissions
											, <Strong>{topContributorShare}%</Strong> of the total.
										</>
									)}
								</>
							) : (
								"Every submission comes from someone in the community."
							)}
						</StoryProse>

						{rankings.topContributors.length > 0 && (
							<div className="mt-8">
								<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
									Top contributors
								</h3>
								<div className="mt-4">
									<ContributorSpotlight
										contributors={rankings.topContributors}
									/>
								</div>
							</div>
						)}
					</StoryChapter>

					{/* ── 30 Days, 30 QRs ── */}
					<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
						<ChapterSubtitle>The campaign</ChapterSubtitle>
						<ChapterTitle>30 Days, 30 QRs</ChapterTitle>
						<StoryProse className="mt-3">
							{(campaignProgress.featuredDays?.length ?? 0) > 0 ? (
								<>
									Every day of Ramadhan highlighted a different institution.
									{campaignProgress.completionRate >= 100
										? " From masjids to suraus across the country, here is every institution that was featured."
										: ` ${campaignProgress.filledDays} out of ${campaignProgress.targetDays} days were featured.`}
								</>
							) : (
								"Every day of Ramadhan highlighted a different institution."
							)}
						</StoryProse>

						<div className="mt-8">
							<DayCalendar featuredDays={campaignProgress.featuredDays ?? []} />
						</div>
					</StoryChapter>

					{/* ── The Pulse ── */}
					<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
						<ChapterSubtitle>Activity</ChapterSubtitle>
						<ChapterTitle>The pulse of Ramadhan</ChapterTitle>
						<StoryProse className="mt-3">
							Submissions ebbed and flowed with the days.
							{strongestDay && (
								<>
									{" "}
									The busiest day was <Strong>{strongestDay.label}</Strong> with{" "}
									<Strong>{formatNumber(strongestDay.submissions)}</Strong>{" "}
									submissions.
								</>
							)}
							{growthDirection !== "flat" && (
								<>
									{" "}
									Submissions in the second half were{" "}
									<Strong>
										{growthDirection === "up" ? "up" : "down"}{" "}
										{formatNumber(Math.abs(growthMomentum.changePercent))}%
									</Strong>{" "}
									compared to the first half.
								</>
							)}
						</StoryProse>

						<div className="mt-8">
							<div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
								<div className="p-4 pt-5 sm:p-5 sm:pt-6">
									<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
										Daily submissions
									</h3>
									<p className="text-xs text-muted-foreground">
										Each bar is one day of Ramadhan
									</p>
									<div className="mt-4">
										<DailySubmissionsChart
											data={chartPoints}
											seriesColor="primary"
										/>
									</div>
								</div>
							</div>
						</div>

						<div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
							<div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5 dark:border-border/80 dark:shadow-none">
								<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
									Avg per day
								</p>
								<p className="mt-2 font-heading text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
									{kpis.avgSubmissionsPerDay}
								</p>
							</div>
							<div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5 dark:border-border/80 dark:shadow-none">
								<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
									Busiest day
								</p>
								<p className="mt-2 font-heading text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
									{formatNumber(strongestDay?.submissions ?? 0)}
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{strongestDay?.label ?? "-"}
								</p>
							</div>
						</div>
					</StoryChapter>

					{/* ── Rhythm ── */}
					<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
						<ChapterSubtitle>Rhythm</ChapterSubtitle>
						<ChapterTitle>When the community showed up</ChapterTitle>
						<StoryProse className="mt-3">
							Patterns emerged across the days and hours.
							{busiestWeekday && (
								<>
									{" "}
									<Strong>{busiestWeekday.day}</Strong> was the most active day
									of the week with{" "}
									<Strong>{formatNumber(busiestWeekday.submissions)}</Strong>{" "}
									submissions.
								</>
							)}
							{busiestHour && busiestHour.submissions > 0 && (
								<>
									{" "}
									Peak submission time? <Strong>{busiestHour.label}</Strong>.
								</>
							)}
						</StoryProse>

						<div className="mt-8">
							<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
								By day of week
							</h3>
							<p className="text-xs text-muted-foreground">
								Total submissions per weekday during Ramadhan
							</p>
							<div className="mt-4">
								<div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
									<div className="p-4 pt-5 sm:p-5 sm:pt-6">
										<DayOfWeekChart
											data={dayOfWeekActivity}
											dataKey="submissions"
											label="Submissions"
										/>
									</div>
								</div>
							</div>
						</div>

						<div className="mt-8">
							<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
								By time of day
							</h3>
							<p className="text-xs text-muted-foreground">
								Submission volume by hour (MYT)
							</p>
							<div className="mt-4">
								<div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
									<div className="p-4 pt-5 sm:p-5 sm:pt-6">
										<HourlyChart
											data={hourlyActivity}
											dataKey="submissions"
											label="Submissions"
										/>
									</div>
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
									{formatNumber(busiestWeekday?.submissions ?? 0)} submissions
								</p>
							</div>
							<div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5 dark:border-border/80 dark:shadow-none">
								<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
									Peak hour
								</p>
								<p className="mt-2 font-heading text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
									{busiestHour?.label ?? "-"}
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{formatNumber(busiestHour?.submissions ?? 0)} submissions
								</p>
							</div>
						</div>
					</StoryChapter>

					{/* ── Where It Happened ── */}
					<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
						<ChapterSubtitle>Distribution</ChapterSubtitle>
						<ChapterTitle>Where it happened</ChapterTitle>
						<StoryProse className="mt-3">
							From the heart of Kuala Lumpur to the coasts of Sabah, submissions
							came from across Malaysia.
							{topState && topStateShare > 0 && (
								<>
									{" "}
									<Strong>{topState.state}</Strong> alone accounted for{" "}
									<Strong>{topStateShare}%</Strong> of all submissions.
								</>
							)}
						</StoryProse>

						<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
							<div>
								<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
									Top states
								</h3>
								<div className="mt-4">
									<StateBarList
										states={rankings.topStates}
										totalSubmissions={totalSubs}
									/>
								</div>
							</div>
							<div>
								<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
									Top categories
								</h3>
								<div className="mt-4">
									<CategoryPills
										categories={rankings.topCategories}
										totalSubmissions={totalSubs}
									/>
								</div>
							</div>
						</div>

						{rankings.topCities.length > 0 && (
							<div className="mt-8">
								<h3 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
									Top cities
								</h3>
								<StoryProse className="mt-2">
									{topCity && (
										<>
											<Strong>{topCity.city}</Strong> led with{" "}
											<Strong>{formatNumber(topCity.submissions)}</Strong>{" "}
											submissions
											{topCity.state !== topCity.city && (
												<> from {topCity.state}</>
											)}
											.
										</>
									)}
								</StoryProse>
								<div className="mt-4">
									<CityBarList
										cities={rankings.topCities}
										totalSubmissions={totalSubs}
									/>
								</div>
							</div>
						)}
					</StoryChapter>

					{communityInsights.length > 0 && (
						<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
							<ChapterSubtitle>Insights</ChapterSubtitle>
							<ChapterTitle>What the community patterns showed</ChapterTitle>
							<StoryProse className="mt-3">
								These are the strongest signals behind the month, filtered to
								avoid filler when the data is thin.
							</StoryProse>
							<CommunityInsights
								insights={communityInsights}
								className="mt-8"
							/>
						</StoryChapter>
					)}
					<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
						<Suspense fallback={<UmamiSectionsSkeleton />}>
							<AsyncUmamiSections />
						</Suspense>
					</StoryChapter>

					{/* ── Open Source ── */}
					<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
						<Suspense fallback={<GitHubSectionSkeleton />}>
							<AsyncGitHubSection />
						</Suspense>
					</StoryChapter>

					{/* ── Closing ── */}
					<StoryChapter className="mt-14 sm:mt-18 md:mt-22">
						<div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.07] via-muted/25 to-accent/[0.06] px-6 py-10 text-center sm:px-8 sm:py-14 dark:from-primary/[0.12] dark:via-muted/15 dark:to-accent/[0.08]">
							<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
								That is a wrap.
							</h2>
							<StoryProse className="mx-auto mt-3 max-w-md text-center">
								Thank you to every contributor, reviewer, and visitor who made
								this Ramadhan meaningful.
							</StoryProse>
							{!posterMode && (
								<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
									<Button asChild variant="outline" size="sm">
										<Link href="/ramadhan-wrapped-2026?poster=1">
											View poster
										</Link>
									</Button>
									<ShareButton />
								</div>
							)}
							<p className="mt-6 text-xs text-muted-foreground/70">
								Updated{" "}
								<span className="tabular-nums">
									{new Date(stats.generatedAt).toLocaleString("en-GB", {
										timeZone: stats.range.timezone,
									})}
								</span>
							</p>
						</div>
					</StoryChapter>
				</div>
			</main>
		</>
	);
}

function Strong({ children }: { children: React.ReactNode }) {
	return <strong className="font-semibold text-foreground">{children}</strong>;
}

function buildCommunityInsights({
	firstTimeContributors,
	firstTimeContributorShare,
	growthDirection,
	growthChangePercent,
	topState,
	topCity,
	busiestWeekday,
	busiestHour,
	approvalRate,
	contributorShape,
	dataCompleteness,
	reviewSpeed,
	directoryScale,
	strongestDay,
	topCategoryState,
}: {
	firstTimeContributors: number;
	firstTimeContributorShare: number;
	growthDirection: "up" | "down" | "flat";
	growthChangePercent: number;
	topState: { name: string; share: number; submissions: number } | null;
	topCity: {
		name: string;
		state: string;
		share: number;
		submissions: number;
	} | null;
	busiestWeekday?: { day: string; submissions: number };
	busiestHour?: { label: string; submissions: number };
	approvalRate: number;
	contributorShape?: {
		oneSubmissionContributors: number;
		fivePlusContributors: number;
		tenPlusContributors: number;
		medianSubmissions: number;
		avgSubmissions: number;
		topContributorSubmissions: number;
	};
	dataCompleteness?: {
		withQr: number;
		withCoords: number;
		withSource: number;
		withRemarks: number;
		qrPercent: number;
		coordsPercent: number;
		sourcePercent: number;
		remarksPercent: number;
	};
	reviewSpeed?: {
		reviewed: number;
		avgHours: number;
		medianHours: number;
		p90Hours: number;
	};
	directoryScale?: {
		allInstitutions: number;
		ramadhanSharePercent: number;
		statesCovered: number;
		citiesCovered: number;
		categoriesCovered: number;
		withSocial: number;
		socialPercent: number;
	};
	strongestDay: {
		label: string;
		submissions: number;
		share: number;
		avgMultiple: number;
	} | null;
	topCategoryState: {
		category: string;
		state: string;
		share: number;
		submissions: number;
	} | null;
}): CommunityInsight[] {
	const insights: CommunityInsight[] = [];

	if (firstTimeContributors > 0 && firstTimeContributorShare > 0) {
		insights.push({
			title: "New contributors carried the month",
			metric: `${firstTimeContributorShare}%`,
			description: `${formatNumber(firstTimeContributors)} contributors made their first submission during Ramadhan, a strong signal that the campaign brought new people into the directory work.`,
			tone: "success",
		});
	}

	if (
		contributorShape &&
		contributorShape.oneSubmissionContributors > 0 &&
		firstTimeContributors > 0
	) {
		insights.push({
			title: "Most people helped once, and that was the point",
			metric: formatNumber(contributorShape.oneSubmissionContributors),
			description: `${formatNumber(contributorShape.oneSubmissionContributors)} contributors submitted exactly once. The directory grew because many people added one useful QR, not because the work depended only on a small core team.`,
			tone: "success",
		});
	}

	if (directoryScale && directoryScale.ramadhanSharePercent > 0) {
		insights.push({
			title: "Ramadhan reshaped a big part of the directory",
			metric: `${formatPercent(directoryScale.ramadhanSharePercent)}`,
			description: `Ramadhan submissions made up ${formatPercent(directoryScale.ramadhanSharePercent)} of the current ${formatNumber(directoryScale.allInstitutions)} institution directory, so the campaign changed a visible share of the public dataset.`,
			tone: "primary",
		});
	}

	if (
		directoryScale &&
		directoryScale.statesCovered > 0 &&
		directoryScale.citiesCovered > 0
	) {
		insights.push({
			title: "The coverage spread wider than a single viral pocket",
			metric: `${formatNumber(directoryScale.citiesCovered)} cities`,
			description: `Submissions came from ${formatNumber(directoryScale.statesCovered)} states and federal territories across ${formatNumber(directoryScale.citiesCovered)} cities, covering all ${formatNumber(directoryScale.categoriesCovered)} institution categories used by the directory.`,
			tone: "success",
		});
	}

	if (growthDirection !== "flat" && Math.abs(growthChangePercent) >= 1) {
		const absChange = formatNumber(Math.abs(growthChangePercent));
		insights.push({
			title:
				growthDirection === "up"
					? "Momentum built later in the month"
					: "The early push did most of the work",
			metric: `${absChange}%`,
			description:
				growthDirection === "up"
					? `The second half had ${absChange}% more submissions than the first half, suggesting the campaign became more visible as Ramadhan progressed.`
					: `The second half had ${absChange}% fewer submissions than the first half, which makes the early campaign push the clearest driver.`,
			tone: growthDirection === "up" ? "primary" : "warm",
		});
	}

	if (strongestDay && strongestDay.share > 0) {
		insights.push({
			title: "One final push changed the shape of the month",
			metric: formatNumber(strongestDay.submissions),
			description: `${strongestDay.label} brought in ${formatNumber(strongestDay.submissions)} submissions, ${formatPercent(strongestDay.share)} of the month and ${strongestDay.avgMultiple}x the daily average.`,
			tone: "warm",
		});
	}

	if (dataCompleteness && dataCompleteness.qrPercent > 0) {
		insights.push({
			title: "The submissions were donation-ready",
			metric: `${formatPercent(dataCompleteness.qrPercent)}`,
			description: `${formatNumber(dataCompleteness.withQr)} submissions included QR data, and ${formatNumber(dataCompleteness.withCoords)} had map coordinates. That turns community activity into entries people can actually find and use.`,
			tone: "primary",
		});
	}

	if (dataCompleteness && dataCompleteness.sourcePercent > 0) {
		insights.push({
			title: "A meaningful share came with proof trails",
			metric: `${formatPercent(dataCompleteness.sourcePercent)}`,
			description: `${formatNumber(dataCompleteness.withSource)} submissions included source links and ${formatNumber(dataCompleteness.withRemarks)} included contributor remarks, adding context for reviewers without exposing private contributor data.`,
			tone: "muted",
		});
	}

	if (directoryScale && directoryScale.socialPercent > 0) {
		insights.push({
			title: "Many entries were more than a QR",
			metric: `${formatPercent(directoryScale.socialPercent)}`,
			description: `${formatNumber(directoryScale.withSocial)} Ramadhan submissions included social or web links, making the directory feel connected to real public institution footprints.`,
			tone: "muted",
		});
	}

	if (reviewSpeed && reviewSpeed.reviewed > 0 && reviewSpeed.medianHours > 0) {
		insights.push({
			title: "Review moved quickly enough to keep up",
			metric: formatDurationHours(reviewSpeed.medianHours),
			description: `${formatNumber(reviewSpeed.reviewed)} submissions were reviewed during the campaign. The median review took ${formatDurationHours(reviewSpeed.medianHours)}, with 90% reviewed within ${formatDurationHours(reviewSpeed.p90Hours)}.`,
			tone: "warm",
		});
	}

	if (topState && topState.share > 0) {
		const placeText =
			topCity && topCity.share > 0
				? `${topCity.name}, ${topCity.state} led the city list while ${topState.name} led the state view.`
				: `${topState.name} was the clearest geographic signal.`;
		insights.push({
			title: "The map had a center of gravity",
			metric: `${topState.share}%`,
			description: `${placeText} ${topState.name} accounted for ${topState.share}% of all submissions.`,
			tone: "primary",
		});
	}

	if (topCategoryState && topCategoryState.share > 0) {
		insights.push({
			title: "One local pattern stood out",
			metric: `${topCategoryState.share}%`,
			description: `${formatCategory(topCategoryState.category)} in ${topCategoryState.state} contributed ${formatNumber(topCategoryState.submissions)} submissions, the clearest category-and-place cluster of the month.`,
			tone: "muted",
		});
	}

	if (
		busiestWeekday &&
		busiestHour &&
		busiestWeekday.submissions > 0 &&
		busiestHour.submissions > 0
	) {
		insights.push({
			title: "Contribution followed a visible rhythm",
			metric: busiestHour.label,
			description: `${busiestWeekday.day} was the busiest weekday, and ${busiestHour.label} was the peak hour. That gives the community a practical window for future calls to contribute.`,
			tone: "warm",
		});
	}

	if (approvalRate > 0 && insights.length < 3) {
		insights.push({
			title: "Most submissions moved through review",
			metric: `${approvalRate.toFixed(1)}%`,
			description: `The approval rate gives useful context to the community count, because it separates raw activity from entries that became usable in the directory.`,
			tone: "muted",
		});
	}

	return insights.slice(0, 12);
}

function formatDurationHours(hours: number): string {
	if (hours < 1) return "<1h";
	if (hours < 24) return `${Number(hours.toFixed(1))}h`;
	const days = hours / 24;
	return `${Number(days.toFixed(1))}d`;
}

function formatCategory(category: string): string {
	const labels: Record<string, string> = {
		masjid: "Masjids",
		surau: "Suraus",
		tahfiz: "Tahfiz institutions",
		kebajikan: "Welfare organisations",
		"lain-lain": "Other institutions",
	};
	return labels[category] ?? category;
}
