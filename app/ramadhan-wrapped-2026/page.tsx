import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Header } from "@/components/shared/header";
import { Card, CardContent } from "@/components/ui/card";
import {
	getRamadhanWrappedStats,
	RAMADHAN_WRAPPED_CONFIG,
} from "@/lib/ramadhan-wrapped";
import { cn } from "@/lib/utils";
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

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-GB").format(value);
}

export default async function RamadhanWrappedPage({ searchParams }: Props) {
	const params = await searchParams;
	// Poster mode hides chrome only; colors follow the active site theme (light/dark).
	const posterMode = params.poster === "1" || params.poster === "true";
	const stats = await getWrappedStatsCached();
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
					"min-h-screen bg-gradient-to-b from-primary/[0.07] via-background to-muted/30",
					"dark:from-background dark:via-background dark:to-muted/20",
				)}
			>
				<div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
					<header
						className={cn(
							"mb-8 rounded-xl border border-border/80 bg-card p-6",
							"dark:border-border",
						)}
					>
						<p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
							Sedekah Je
						</p>
						<h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
							Ramadhan Wrapped {RAMADHAN_WRAPPED_CONFIG.year}
						</h1>
						<p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
							Community snapshot for {range.label}. Figures are computed live
							from the Sedekah Je database.
						</p>
						<p className="mt-2 text-xs text-muted-foreground">
							Last updated:{" "}
							{new Date(stats.generatedAt).toLocaleString("en-GB", {
								timeZone: range.timezone,
							})}
						</p>
					</header>

					<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-6">
						<StatCard
							className="lg:col-span-2"
							title="New users"
							value={formatNumber(kpis.newUsers)}
							description="Accounts registered in the period"
						/>
						<StatCard
							className="lg:col-span-2"
							title="Institutions submitted"
							value={formatNumber(kpis.totalSubmissions)}
							description="All submissions (any status)"
						/>
						<StatCard
							className="lg:col-span-2"
							title="Unique contributors"
							value={formatNumber(kpis.uniqueContributors)}
							description="Distinct contributors in the window"
						/>

						<StatCard
							className="lg:col-span-2"
							title="Approved"
							value={formatNumber(kpis.approvedSubmissions)}
							description="Submissions marked approved"
						/>
						<StatCard
							className="lg:col-span-2"
							title="Pending"
							value={formatNumber(kpis.pendingSubmissions)}
							description="Submissions awaiting review"
						/>
						<StatCard
							className="lg:col-span-2"
							title="Rejected"
							value={formatNumber(kpis.rejectedSubmissions)}
							description="Submissions marked rejected"
						/>

						<StatCard
							className="lg:col-span-3"
							title="Approved in window"
							value={formatNumber(kpis.approvedInWindow)}
							description="Reviewed and approved during the campaign range"
						/>
						<StatCard
							className="lg:col-span-3"
							title="30 Days 30 QR progress"
							value={`${campaignProgress.filledDays}/${campaignProgress.targetDays}`}
							description={`${campaignProgress.completionRate}% complete`}
						/>
					</section>

					<section className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-3">
						<ListCard
							title="Top 5 contributors"
							items={rankings.topContributors.map(
								(row, index) =>
									`${index + 1}. ${row.name} (${formatNumber(row.submissions)})`,
							)}
						/>
						<ListCard
							title="Top states"
							items={rankings.topStates.map(
								(row) => `${row.state} (${formatNumber(row.submissions)})`,
							)}
						/>
						<ListCard
							title="Top categories"
							items={rankings.topCategories.map(
								(row) => `${row.category} (${formatNumber(row.submissions)})`,
							)}
						/>
					</section>

					<section className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-2">
						<Card className="rounded-xl border-border/80 shadow-none dark:border-border">
							<CardContent className="p-5 pt-5">
								<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
									<h2 className="text-base font-semibold text-foreground">
										Daily trend
									</h2>
									<p className="text-xs text-muted-foreground">
										Submissions per day
									</p>
								</div>
								<div className="mt-4">
									<DailySubmissionsChart data={chartPoints} />
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-xl border-border/80 shadow-none dark:border-border">
							<CardContent className="p-5">
								<h2 className="text-base font-semibold text-foreground">
									Highlight
								</h2>
								<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
									Busiest day:{" "}
									<span className="font-medium text-foreground">
										{strongestDay?.label ?? "-"}
									</span>{" "}
									with{" "}
									<span className="font-medium tabular-nums text-foreground">
										{formatNumber(strongestDay?.submissions ?? 0)}
									</span>{" "}
									submissions.
								</p>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									Campaign days without content:{" "}
									<span className="font-medium tabular-nums text-foreground">
										{campaignProgress.missingDays.length}
									</span>{" "}
									({campaignProgress.missingDays.join(", ") || "none"}).
								</p>
								<p className="mt-6 text-xs text-muted-foreground">
									Umami analytics are not included in this version.
								</p>
							</CardContent>
						</Card>
					</section>

					{!posterMode && (
						<footer className="mt-6 rounded-xl border border-dashed border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground dark:border-border">
							Tip: use{" "}
							<code className="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
								/ramadhan-wrapped-2026?poster=1
							</code>{" "}
							for a poster-friendly screenshot layout.
						</footer>
					)}
				</div>
			</main>
		</>
	);
}

function StatCard({
	title,
	value,
	description,
	className,
}: {
	title: string;
	value: string;
	description: string;
	className?: string;
}) {
	return (
		<Card
			className={cn(
				"rounded-xl border-border/80 shadow-none dark:border-border",
				className,
			)}
		>
			<CardContent className="p-5">
				<p className="text-xs font-medium text-muted-foreground">{title}</p>
				<p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground md:text-3xl">
					{value}
				</p>
				<p className="mt-2 text-sm leading-snug text-muted-foreground">
					{description}
				</p>
			</CardContent>
		</Card>
	);
}

function ListCard({ title, items }: { title: string; items: string[] }) {
	return (
		<Card className="rounded-xl border-border/80 shadow-none dark:border-border">
			<CardContent className="p-5">
				<h2 className="text-base font-semibold text-foreground">{title}</h2>
				<ul className="mt-4 space-y-0">
					{items.length > 0 ? (
						items.map((item, i) => (
							<li
								key={item}
								className={cn(
									"border-border/60 py-2.5 text-sm text-muted-foreground",
									"dark:border-border/80",
									i > 0 && "border-t",
								)}
							>
								{item}
							</li>
						))
					) : (
						<li className="py-2 text-sm text-muted-foreground">-</li>
					)}
				</ul>
			</CardContent>
		</Card>
	);
}
