import { cn } from "@/lib/utils";

export type CommunityInsight = {
	title: string;
	metric: string;
	description: string;
	tone?: "primary" | "success" | "warm" | "muted";
};

type CommunityInsightsProps = {
	insights: CommunityInsight[];
	className?: string;
};

const TONE_STYLES: Record<
	NonNullable<CommunityInsight["tone"]>,
	{ marker: string; metric: string; panel: string }
> = {
	primary: {
		marker: "bg-primary",
		metric: "text-primary",
		panel:
			"border-primary/20 bg-primary/[0.035] dark:border-primary/25 dark:bg-primary/[0.06]",
	},
	success: {
		marker: "bg-emerald-600 dark:bg-emerald-500",
		metric: "text-emerald-700 dark:text-emerald-400",
		panel:
			"border-emerald-600/20 bg-emerald-500/[0.045] dark:border-emerald-400/25 dark:bg-emerald-500/[0.07]",
	},
	warm: {
		marker: "bg-amber-500 dark:bg-amber-400",
		metric: "text-amber-700 dark:text-amber-400",
		panel:
			"border-amber-500/25 bg-amber-500/[0.05] dark:border-amber-400/25 dark:bg-amber-500/[0.08]",
	},
	muted: {
		marker: "bg-muted-foreground/60",
		metric: "text-foreground",
		panel: "border-border/60 bg-card dark:border-border/80",
	},
};

export function CommunityInsights({
	insights,
	className,
}: CommunityInsightsProps) {
	if (insights.length === 0) return null;

	const [lead, ...supporting] = insights;
	const leadTone = TONE_STYLES[lead.tone ?? "primary"];

	return (
		<div className={cn("space-y-5", className)}>
			<div
				className={cn(
					"rounded-2xl border p-5 shadow-sm sm:p-6 dark:shadow-none",
					leadTone.panel,
				)}
			>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div className="max-w-xl">
						<p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Lead pattern
						</p>
						<h3 className="mt-2 font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
							{lead.title}
						</h3>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
							{lead.description}
						</p>
					</div>
					<p
						className={cn(
							"shrink-0 font-heading text-4xl font-bold tabular-nums tracking-tight sm:text-5xl",
							leadTone.metric,
						)}
					>
						{lead.metric}
					</p>
				</div>
			</div>

			{supporting.length > 0 && (
				<div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card shadow-sm dark:divide-border/70 dark:border-border/80 dark:shadow-none">
					{supporting.map((insight) => {
						const tone = TONE_STYLES[insight.tone ?? "muted"];
						return (
							<div
								key={insight.title}
								className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"
							>
								<div className="flex min-w-0 gap-3">
									<span
										className={cn(
											"mt-1.5 size-2.5 shrink-0 rounded-full",
											tone.marker,
										)}
									/>
									<div className="min-w-0">
										<h4 className="font-heading text-base font-semibold tracking-tight text-foreground">
											{insight.title}
										</h4>
										<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
											{insight.description}
										</p>
									</div>
								</div>
								<p
									className={cn(
										"pl-5 font-heading text-2xl font-bold tabular-nums tracking-tight sm:pl-0 sm:text-right sm:text-3xl",
										tone.metric,
									)}
								>
									{insight.metric}
								</p>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
