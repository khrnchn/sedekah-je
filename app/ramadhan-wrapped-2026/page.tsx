import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Header } from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	getRamadhanWrappedStats,
	RAMADHAN_WRAPPED_CONFIG,
} from "@/lib/ramadhan-wrapped";
import { getGitHubWrappedStats } from "@/lib/ramadhan-wrapped-github";
import { getUmamiWrappedStats } from "@/lib/ramadhan-wrapped-umami";
import { cn } from "@/lib/utils";
import { DailyPageviewsChart } from "./_components/daily-pageviews-chart";
import { DailySubmissionsChart } from "./_components/daily-submissions-chart";

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
	["ramadhan-wrapped-2026-public"],
	{
		revalidate: 300,
		tags: ["ramadhan-wrapped-2026"],
	},
);

const getUmamiStatsCached = unstable_cache(
	async () => getUmamiWrappedStats(),
	["ramadhan-wrapped-2026-umami"],
	{
		revalidate: 300,
		tags: ["ramadhan-wrapped-2026-umami"],
	},
);

const getGitHubStatsCached = unstable_cache(
	async () => getGitHubWrappedStats(),
	["ramadhan-wrapped-2026-github"],
	{
		revalidate: 300,
		tags: ["ramadhan-wrapped-2026-github"],
	},
);

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-GB").format(value);
}

export default async function RamadhanWrappedPage({ searchParams }: Props) {
	const params = await searchParams;
	const posterMode = params.poster === "1" || params.poster === "true";
	const [stats, umamiStats, githubStats] = await Promise.all([
		getWrappedStatsCached(),
		getUmamiStatsCached(),
		getGitHubStatsCached(),
	]);
	const { kpis, rankings, campaignProgress, range } = stats;

	const strongestDay = [...stats.dailyTrend].sort(
		(a, b) => b.submissions - a.submissions || a.date.localeCompare(b.date),
	)[0];

	const chartPoints = stats.dailyTrend.map((row) => ({
		label: row.label,
		submissions: row.submissions,
	}));

	return (
		<>
			{!posterMode && <Header compactMobileBrand />}
			<main
				className={cn(
					"min-h-screen bg-background bg-gradient-to-b",
					"from-muted/35 via-background to-background",
					"dark:from-muted/15 dark:via-background dark:to-background",
				)}
			>
				<div
					className={cn(
						"mx-auto w-full max-w-6xl px-3 pt-6",
						"pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
						"sm:px-4 sm:pt-8",
						"md:px-6 md:pt-10 md:pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]",
					)}
				>
					<header
						className={cn(
							"relative mb-8 overflow-hidden rounded-xl border border-border/60",
							"bg-card p-5 shadow-sm sm:mb-10 sm:rounded-2xl sm:p-8 md:p-10",
							"dark:border-border/80 dark:shadow-none",
						)}
					>
						<div
							className={cn(
								"pointer-events-none absolute -right-12 -top-12 size-[12rem]",
								"rounded-full bg-primary/[0.08] blur-3xl dark:bg-primary/[0.12]",
								"sm:-right-20 sm:-top-20 sm:size-[16rem]",
								"md:-right-24 md:-top-24 md:size-[20rem]",
							)}
							aria-hidden
						/>
						<div
							className={cn(
								"pointer-events-none absolute -bottom-8 -left-8 size-[8rem]",
								"rounded-full bg-primary/[0.04] blur-3xl dark:bg-primary/[0.06]",
								"sm:size-[10rem]",
							)}
							aria-hidden
						/>
						<div
							className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.06] sm:right-8 md:right-12"
							aria-hidden
						>
							<svg
								viewBox="0 0 160 160"
								fill="none"
								className="size-24 sm:size-32 md:size-40"
							>
								<circle cx="80" cy="80" r="70" className="fill-primary" />
								<circle cx="100" cy="65" r="58" className="fill-card" />
								<circle cx="42" cy="28" r="5" className="fill-primary" />
							</svg>
						</div>
						<div className="relative">
							<div className="flex flex-wrap items-center gap-2">
								<span
									className={cn(
										"inline-flex items-center rounded-full border border-primary/30",
										"bg-primary/10 px-3 py-1 text-[0.65rem] font-bold uppercase",
										"tracking-[0.18em] text-primary",
									)}
								>
									Sedekah Je
								</span>
								<span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
									Live stats
								</span>
							</div>
							<h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:mt-5 sm:text-4xl md:text-5xl">
								Ramadhan Wrapped {RAMADHAN_WRAPPED_CONFIG.year}
							</h1>
							<p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
								Community snapshot for {range.label}. Figures are computed live
								from the Sedekah Je database.
							</p>
							<p className="mt-4 text-xs text-muted-foreground/80">
								Last updated:{" "}
								<span className="tabular-nums text-foreground/70">
									{new Date(stats.generatedAt).toLocaleString("en-GB", {
										timeZone: range.timezone,
									})}
								</span>
							</p>
							{!posterMode && (
								<Button asChild variant="outline" size="sm" className="mt-4">
									<a href="/ramadhan-wrapped-2026?poster=1">View poster</a>
								</Button>
							)}
						</div>
					</header>

					<SectionLabel>Overview</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
						<StatCard
							title="New users"
							value={formatNumber(kpis.newUsers)}
							description="Accounts registered in the period"
							size="hero"
						/>
						<StatCard
							title="Institutions submitted"
							value={formatNumber(kpis.totalSubmissions)}
							description="All submissions (any status)"
							size="hero"
						/>
						<StatCard
							title="Unique contributors"
							value={formatNumber(kpis.uniqueContributors)}
							description="Distinct contributors in the window"
							size="hero"
						/>
					</section>

					{umamiStats && (
						<>
							<SectionLabel className="mt-6 sm:mt-8">Site Traffic</SectionLabel>
							<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
								<StatCard
									title="Total pageviews"
									value={formatNumber(umamiStats.kpis.totalPageviews)}
									description="All page loads during the campaign"
									size="hero"
								/>
								<StatCard
									title="Unique visitors"
									value={formatNumber(umamiStats.kpis.uniqueVisits)}
									description="Distinct visits in the window"
									size="hero"
								/>
								<StatCard
									title="Peak day"
									value={formatNumber(umamiStats.kpis.peakDayViews)}
									description={`${umamiStats.kpis.peakDayLabel} — highest single-day traffic`}
									size="hero"
								/>
							</section>
						</>
					)}

					<SectionLabel className="mt-6 sm:mt-8">Status breakdown</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
						<StatCard
							variant="success"
							title="Approved"
							value={formatNumber(kpis.approvedSubmissions)}
							description="Submissions marked approved"
						/>
						<StatCard
							variant="warning"
							title="Pending"
							value={formatNumber(kpis.pendingSubmissions)}
							description="Submissions awaiting review"
						/>
						<StatCard
							variant="destructive"
							title="Rejected"
							value={formatNumber(kpis.rejectedSubmissions)}
							description="Submissions marked rejected"
						/>
					</section>

					<SectionLabel className="mt-6 sm:mt-8">Campaign</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
						<StatCard
							title="Approved in window"
							value={formatNumber(kpis.approvedInWindow)}
							description="Reviewed and approved during the campaign range"
						/>
						<StatCard
							title="Busiest day"
							value={formatNumber(strongestDay?.submissions ?? 0)}
							description={`${strongestDay?.label ?? "-"} — most submissions in a single day`}
						/>
					</section>

					<SectionLabel className="mt-6 sm:mt-8">Leaderboard</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:gap-4 lg:grid-cols-3">
						<RankingCard
							title="Top 5 contributors"
							items={rankings.topContributors.map((row) => ({
								label: row.name,
								value: formatNumber(row.submissions),
							}))}
						/>
						<RankingCard
							title="Top states"
							items={rankings.topStates.map((row) => ({
								label: row.state,
								value: formatNumber(row.submissions),
							}))}
						/>
						<RankingCard
							title="Top categories"
							items={rankings.topCategories.map((row) => ({
								label: row.category,
								value: formatNumber(row.submissions),
							}))}
						/>
					</section>

					{umamiStats && (
						<>
							<SectionLabel className="mt-6 sm:mt-8">
								Traffic Insights
							</SectionLabel>
							<section className="grid grid-cols-1 gap-2.5 sm:gap-4 lg:grid-cols-2">
								<RankingCard
									title="Top pages"
									items={umamiStats.rankings.topPages.map((row) => ({
										label: row.path,
										value: formatNumber(row.views),
									}))}
								/>
								<RankingCard
									title="Traffic sources"
									items={umamiStats.rankings.topReferrers.map((row) => ({
										label: row.domain,
										value: formatNumber(row.views),
									}))}
								/>
							</section>
						</>
					)}

					<SectionLabel className="mt-6 sm:mt-8">Activity</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:gap-4 lg:grid-cols-2">
						<Card className="rounded-xl border-border/60 shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
							<CardContent className="p-4 pt-5 sm:p-5 sm:pt-6">
								<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
									<h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
										Daily trend
									</h2>
									<p className="text-xs text-muted-foreground">
										Submissions per day
									</p>
								</div>
								<div className="mt-4">
									<DailySubmissionsChart
										data={chartPoints}
										seriesColor="primary"
									/>
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-xl border-border/60 shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
							<CardContent className="p-4 pt-5 sm:p-5 sm:pt-6">
								<h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
									Highlight
								</h2>
								<div className="mt-5 space-y-4">
									<div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 dark:bg-primary/[0.06]">
										<p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
											Busiest day
										</p>
										<p className="mt-1.5 flex items-baseline gap-2 text-sm leading-relaxed">
											<span className="font-semibold text-foreground">
												{strongestDay?.label ?? "-"}
											</span>
											<span className="text-muted-foreground/60">·</span>
											<span className="text-lg font-bold tabular-nums text-primary sm:text-xl">
												{formatNumber(strongestDay?.submissions ?? 0)}
											</span>
											<span className="text-muted-foreground">submissions</span>
										</p>
									</div>
									<p className="text-pretty text-[0.8125rem] leading-relaxed text-muted-foreground sm:text-sm">
										Campaign days without content:{" "}
										<span className="font-medium tabular-nums text-foreground">
											{campaignProgress.missingDays.length}
										</span>{" "}
										<span className="break-words text-muted-foreground/90">
											({campaignProgress.missingDays.join(", ") || "none"})
										</span>
									</p>
								</div>
								{!umamiStats && (
									<p className="mt-6 border-t border-border/50 pt-4 text-xs text-muted-foreground">
										Umami analytics are not available.
									</p>
								)}
							</CardContent>
						</Card>
					</section>

					{umamiStats && (
						<>
							<SectionLabel className="mt-6 sm:mt-8">
								Daily Pageviews
							</SectionLabel>
							<section>
								<Card className="rounded-xl border-border/60 shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
									<CardContent className="p-4 pt-5 sm:p-5 sm:pt-6">
										<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
											<h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
												Pageviews trend
											</h2>
											<p className="text-xs text-muted-foreground">
												Daily pageviews during the campaign
											</p>
										</div>
										<div className="mt-4">
											<DailyPageviewsChart
												data={umamiStats.dailyPageviews.map((d) => ({
													label: d.label,
													views: d.views,
												}))}
											/>
										</div>
									</CardContent>
								</Card>
							</section>

							<SectionLabel className="mt-6 sm:mt-8">Audience</SectionLabel>
							<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
								<StatCard
									title="Mobile traffic"
									value={`${umamiStats.kpis.mobilePercent}%`}
									description="Visitors on mobile devices"
								/>
								<StatCard
									title="Peak hour"
									value={`${umamiStats.kpis.peakHour}:00`}
									description={`Most active hour during Ramadhan (${formatNumber(umamiStats.kpis.peakHourViews)} views)`}
								/>
							</section>
						</>
					)}

					{githubStats && (
						<>
							<SectionLabel className="mt-6 sm:mt-8">Open Source</SectionLabel>
							<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
								<StatCard
									title="Commits"
									value={formatNumber(githubStats.commits)}
									description="Code commits during the campaign"
								/>
								<StatCard
									title="Pull requests merged"
									value={formatNumber(githubStats.mergedPRs)}
									description={`${formatNumber(githubStats.pullRequests)} PRs total`}
								/>
								<StatCard
									title="Issues opened"
									value={formatNumber(githubStats.issues)}
									description="Bug reports and feature requests"
								/>
							</section>
						</>
					)}

					{!posterMode && (
						<footer className="mt-6 rounded-xl border border-dashed border-border/60 bg-muted/25 px-3 py-3 text-sm text-muted-foreground sm:mt-8 sm:rounded-2xl sm:px-4 dark:border-border/80 dark:bg-muted/15">
							<span className="block sm:inline">
								Tip: use{" "}
								<code className="mt-1 inline-block max-w-full break-all rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[0.6875rem] text-foreground sm:mt-0 sm:inline sm:max-w-none sm:break-normal sm:text-xs">
									/ramadhan-wrapped-2026?poster=1
								</code>{" "}
							</span>
							<span className="block sm:inline">
								for a poster-friendly screenshot layout.
							</span>
						</footer>
					)}
				</div>
			</main>
		</>
	);
}

function SectionLabel({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("mb-3 flex items-center gap-3 sm:mb-4", className)}>
			<p className="shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 sm:text-[0.65rem]">
				{children}
			</p>
			<div className="h-px flex-1 bg-border/30 dark:bg-border/40" />
		</div>
	);
}

type StatVariant =
	| "default"
	| "success"
	| "warning"
	| "destructive"
	| "celebration";

const VARIANT_STYLES: Record<
	StatVariant,
	{ bar: string; value: string; card?: string }
> = {
	default: {
		bar: "h-1 from-primary/0 via-primary/45 to-primary/0 opacity-80 dark:via-primary/50",
		value: "text-foreground",
	},
	success: {
		bar: "h-1 from-emerald-500/0 via-emerald-500/60 to-emerald-500/0 dark:via-emerald-400/60",
		value: "text-emerald-700 dark:text-emerald-400",
	},
	warning: {
		bar: "h-1 from-amber-500/0 via-amber-500/60 to-amber-500/0 dark:via-amber-400/60",
		value: "text-amber-700 dark:text-amber-400",
	},
	destructive: {
		bar: "h-1 from-red-500/0 via-red-500/40 to-red-500/0 dark:via-red-400/40",
		value: "text-red-600/80 dark:text-red-400/80",
	},
	celebration: {
		bar: "h-1.5 from-primary/0 via-primary/70 to-primary/0 dark:via-primary/80",
		value: "text-primary",
		card: "border-primary/20 dark:border-primary/30",
	},
};

function StatCard({
	title,
	value,
	description,
	className,
	variant = "default",
	size = "default",
}: {
	title: string;
	value: string;
	description: string;
	className?: string;
	variant?: StatVariant;
	size?: "default" | "hero";
}) {
	const styles = VARIANT_STYLES[variant];

	return (
		<Card
			className={cn(
				"group relative overflow-hidden rounded-xl border-border/60 shadow-sm",
				"sm:rounded-2xl",
				"dark:border-border/80 dark:shadow-none",
				styles.card,
				className,
			)}
		>
			<div
				className={cn("absolute inset-x-0 top-0 bg-gradient-to-r", styles.bar)}
				aria-hidden
			/>
			<CardContent className="p-4 pt-5 sm:p-5 sm:pt-6">
				<p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
					{title}
				</p>
				<p
					className={cn(
						"mt-2 font-heading font-bold tabular-nums tracking-tight sm:mt-3",
						styles.value,
						size === "hero"
							? "text-2xl sm:text-3xl md:text-4xl"
							: "text-xl sm:text-2xl md:text-3xl",
					)}
				>
					{value}
				</p>
				<p className="mt-1.5 text-[0.8125rem] leading-snug text-muted-foreground sm:mt-2 sm:text-sm">
					{description}
				</p>
			</CardContent>
		</Card>
	);
}

type RankItem = {
	label: string;
	value: string;
};

const MEDAL_STYLES = [
	"bg-amber-500/[0.15] text-amber-600 ring-1 ring-inset ring-amber-500/25 dark:text-amber-400 dark:bg-amber-500/20",
	"bg-zinc-400/10 text-zinc-500 ring-1 ring-inset ring-zinc-400/20 dark:text-zinc-300 dark:bg-zinc-400/[0.15]",
	"bg-orange-500/10 text-orange-700 ring-1 ring-inset ring-orange-500/20 dark:text-orange-400 dark:bg-orange-500/[0.15]",
];

function RankingCard({ title, items }: { title: string; items: RankItem[] }) {
	return (
		<Card className="rounded-xl border-border/60 shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
			<CardContent className="p-4 pt-5 sm:p-5 sm:pt-6">
				<h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
					{title}
				</h2>
				<ul className="mt-3 sm:mt-4">
					{items.length > 0 ? (
						items.map((item, i) => (
							<li
								key={`${title}-${i}-${item.label}`}
								className={cn(
									"flex min-h-11 items-center gap-3 border-border/50 py-2.5",
									"dark:border-border/60 sm:min-h-0 sm:py-3",
									i > 0 && "border-t",
								)}
							>
								<span
									className={cn(
										"flex size-8 shrink-0 items-center justify-center rounded-full",
										"text-xs font-bold tabular-nums",
										i < 3 && MEDAL_STYLES[i],
										i >= 3 && "bg-muted text-muted-foreground dark:bg-muted/80",
									)}
								>
									{i + 1}
								</span>
								<span className="min-w-0 flex-1 truncate text-sm leading-snug text-foreground/90">
									{item.label}
								</span>
								<span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
									{item.value}
								</span>
							</li>
						))
					) : (
						<li className="py-3 text-sm text-muted-foreground">-</li>
					)}
				</ul>
			</CardContent>
		</Card>
	);
}
