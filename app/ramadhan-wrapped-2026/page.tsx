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
									Data langsung
								</span>
							</div>
							<h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:mt-5 sm:text-4xl md:text-5xl">
								Ramadhan Wrapped {RAMADHAN_WRAPPED_CONFIG.year}
							</h1>
							<p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
								Ringkasan komuniti untuk {range.label}. Angka dikira langsung
								dari pangkalan data Sedekah Je.
							</p>
							<p className="mt-4 text-xs text-muted-foreground/80">
								Dikemaskini:{" "}
								<span className="tabular-nums text-foreground/70">
									{new Date(stats.generatedAt).toLocaleString("en-GB", {
										timeZone: range.timezone,
									})}
								</span>
							</p>
							{!posterMode && (
								<Button asChild variant="outline" size="sm" className="mt-4">
									<a href="/ramadhan-wrapped-2026?poster=1">Lihat poster</a>
								</Button>
							)}
						</div>
					</header>

					<SectionLabel>Gambaran Keseluruhan</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
						<StatCard
							title="Pengguna baharu"
							value={formatNumber(kpis.newUsers)}
							description="Akaun baharu dalam tempoh"
							size="hero"
						/>
						<StatCard
							title="Institusi dihantar"
							value={formatNumber(kpis.totalSubmissions)}
							description="Semua penyerahan dalam tempoh"
							size="hero"
						/>
						<StatCard
							title="Penyumbang aktif"
							value={formatNumber(kpis.uniqueContributors)}
							description="Penyumbang berbeza dalam tempoh"
							size="hero"
						/>
					</section>

					{umamiStats && (
						<>
							<SectionLabel className="mt-6 sm:mt-8">Trafik Laman</SectionLabel>
							<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
								<StatCard
									title="Jumlah paparan"
									value={formatNumber(umamiStats.kpis.totalPageviews)}
									description="Semua muatan halaman sepanjang kempen"
									size="hero"
								/>
								<StatCard
									title="Pelawat unik"
									value={formatNumber(umamiStats.kpis.uniqueVisits)}
									description="Lawatan berbeza dalam tempoh"
									size="hero"
								/>
								<StatCard
									title="Hari puncak"
									value={formatNumber(umamiStats.kpis.peakDayViews)}
									description={`${umamiStats.kpis.peakDayLabel} — trafik tertinggi satu hari`}
									size="hero"
								/>
							</section>
						</>
					)}

					<SectionLabel className="mt-6 sm:mt-8">Pecahan Status</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
						<StatCard
							variant="success"
							title="Diluluskan"
							value={formatNumber(kpis.approvedSubmissions)}
							description="Penyerahan diluluskan"
						/>
						<StatCard
							variant="warning"
							title="Menunggu"
							value={formatNumber(kpis.pendingSubmissions)}
							description="Penyerahan menunggu semakan"
						/>
						<StatCard
							variant="destructive"
							title="Ditolak"
							value={formatNumber(kpis.rejectedSubmissions)}
							description="Penyerahan ditolak"
						/>
					</section>

					<SectionLabel className="mt-6 sm:mt-8">Kempen</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
						<StatCard
							title="Diluluskan dalam tempoh"
							value={formatNumber(kpis.approvedInWindow)}
							description="Disemak dan diluluskan dalam tempoh kempen"
						/>
						<StatCard
							title="Hari paling sibuk"
							value={formatNumber(strongestDay?.submissions ?? 0)}
							description={`${strongestDay?.label ?? "-"} — penyerahan terbanyak satu hari`}
						/>
					</section>

					<SectionLabel className="mt-6 sm:mt-8">Papan Pemimpin</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:gap-4 lg:grid-cols-3">
						<RankingCard
							title="5 Penyumbang Teratas"
							items={rankings.topContributors.map((row) => ({
								label: row.name,
								value: formatNumber(row.submissions),
							}))}
						/>
						<RankingCard
							title="Negeri Teratas"
							items={rankings.topStates.map((row) => ({
								label: row.state,
								value: formatNumber(row.submissions),
							}))}
						/>
						<RankingCard
							title="Kategori Teratas"
							items={rankings.topCategories.map((row) => ({
								label: row.category,
								value: formatNumber(row.submissions),
							}))}
						/>
					</section>

					{umamiStats && (
						<>
							<SectionLabel className="mt-6 sm:mt-8">
								Maklumat Trafik
							</SectionLabel>
							<section className="grid grid-cols-1 gap-2.5 sm:gap-4 lg:grid-cols-2">
								<RankingCard
									title="Halaman Teratas"
									items={umamiStats.rankings.topPages.map((row) => ({
										label: row.path,
										value: formatNumber(row.views),
									}))}
								/>
								<RankingCard
									title="Sumber Trafik"
									items={umamiStats.rankings.topReferrers.map((row) => ({
										label: row.domain,
										value: formatNumber(row.views),
									}))}
								/>
							</section>
						</>
					)}

					<SectionLabel className="mt-6 sm:mt-8">Aktiviti</SectionLabel>
					<section className="grid grid-cols-1 gap-2.5 sm:gap-4 lg:grid-cols-2">
						<Card className="rounded-xl border-border/60 shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
							<CardContent className="p-4 pt-5 sm:p-5 sm:pt-6">
								<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
									<h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
										Trend Harian
									</h2>
									<p className="text-xs text-muted-foreground">
										Penyerahan sehari
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
									Sorotan
								</h2>
								<div className="mt-5 space-y-4">
									<div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 dark:bg-primary/[0.06]">
										<p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
											Hari paling sibuk
										</p>
										<p className="mt-1.5 flex items-baseline gap-2 text-sm leading-relaxed">
											<span className="font-semibold text-foreground">
												{strongestDay?.label ?? "-"}
											</span>
											<span className="text-muted-foreground/60">·</span>
											<span className="text-lg font-bold tabular-nums text-primary sm:text-xl">
												{formatNumber(strongestDay?.submissions ?? 0)}
											</span>
											<span className="text-muted-foreground">penyerahan</span>
										</p>
									</div>
									<p className="text-pretty text-[0.8125rem] leading-relaxed text-muted-foreground sm:text-sm">
										Hari kempen tanpa kandungan:{" "}
										<span className="font-medium tabular-nums text-foreground">
											{campaignProgress.missingDays.length}
										</span>{" "}
										<span className="break-words text-muted-foreground/90">
											({campaignProgress.missingDays.join(", ") || "tiada"})
										</span>
									</p>
								</div>
								{!umamiStats && (
									<p className="mt-6 border-t border-border/50 pt-4 text-xs text-muted-foreground">
										Analitik Umami tidak tersedia.
									</p>
								)}
							</CardContent>
						</Card>
					</section>

					{umamiStats && (
						<>
							<SectionLabel className="mt-6 sm:mt-8">
								Paparan Harian
							</SectionLabel>
							<section>
								<Card className="rounded-xl border-border/60 shadow-sm sm:rounded-2xl dark:border-border/80 dark:shadow-none">
									<CardContent className="p-4 pt-5 sm:p-5 sm:pt-6">
										<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
											<h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
												Trend paparan halaman
											</h2>
											<p className="text-xs text-muted-foreground">
												Paparan harian sepanjang kempen
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

							<SectionLabel className="mt-6 sm:mt-8">Audiens</SectionLabel>
							<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
								<StatCard
									title="Trafik mudah alih"
									value={`${umamiStats.kpis.mobilePercent}%`}
									description="Pelawat menggunakan peranti mudah alih"
								/>
								<StatCard
									title="Waktu puncak"
									value={`${umamiStats.kpis.peakHour}:00`}
									description={`Waktu paling aktif semasa Ramadhan (${formatNumber(umamiStats.kpis.peakHourViews)} paparan)`}
								/>
							</section>
						</>
					)}

					{githubStats && (
						<>
							<SectionLabel className="mt-6 sm:mt-8">
								Sumber Terbuka
							</SectionLabel>
							<section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
								<StatCard
									title="Komit"
									value={formatNumber(githubStats.commits)}
									description="Komit kod sepanjang kempen"
								/>
								<StatCard
									title="Pull request digabung"
									value={formatNumber(githubStats.mergedPRs)}
									description={`${formatNumber(githubStats.pullRequests)} PR keseluruhan`}
								/>
								<StatCard
									title="Isu dibuka"
									value={formatNumber(githubStats.issues)}
									description="Laporan pepijat dan permintaan ciri"
								/>
							</section>
						</>
					)}

					{!posterMode && (
						<footer className="mt-6 rounded-xl border border-dashed border-border/60 bg-muted/25 px-3 py-3 text-sm text-muted-foreground sm:mt-8 sm:rounded-2xl sm:px-4 dark:border-border/80 dark:bg-muted/15">
							<span className="block sm:inline">
								Tip: gunakan{" "}
								<code className="mt-1 inline-block max-w-full break-all rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[0.6875rem] text-foreground sm:mt-0 sm:inline sm:max-w-none sm:break-normal sm:text-xs">
									/ramadhan-wrapped-2026?poster=1
								</code>{" "}
							</span>
							<span className="block sm:inline">
								untuk susun atur poster ramah tangkap skrin.
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

const VARIANT_STYLES: Record<StatVariant, { value: string; card?: string }> = {
	default: { value: "text-foreground" },
	success: { value: "text-emerald-700 dark:text-emerald-400" },
	warning: { value: "text-amber-700 dark:text-amber-400" },
	destructive: { value: "text-red-600/80 dark:text-red-400/80" },
	celebration: {
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
				"rounded-xl border-border/60 shadow-sm",
				"sm:rounded-2xl",
				"dark:border-border/80 dark:shadow-none",
				styles.card,
				className,
			)}
		>
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
