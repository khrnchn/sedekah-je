import type { UmamiWrappedStats } from "@/lib/ramadhan-wrapped-umami";
import { cn } from "@/lib/utils";
import { formatNumber } from "./shared";

type WeeklyTrafficChartProps = {
	weeks?: UmamiWrappedStats["weeklyDayOfWeekPageviews"];
	className?: string;
};

export function WeeklyTrafficChart({
	weeks,
	className,
}: WeeklyTrafficChartProps) {
	const visibleWeeks = (weeks ?? []).filter((week) => week.totalViews > 0);
	if (visibleWeeks.length === 0) return null;

	const maxViews = Math.max(
		...visibleWeeks.flatMap((week) => week.days.map((day) => day.views)),
		1,
	);

	return (
		<div className={cn("grid gap-4 lg:grid-cols-2", className)}>
			{visibleWeeks.map((week) => {
				const strongestDay = [...week.days].sort(
					(a, b) => b.views - a.views,
				)[0];
				return (
					<div
						key={week.week}
						className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5 dark:border-border/80 dark:shadow-none"
					>
						<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
							<div>
								<h4 className="font-heading text-sm font-semibold tracking-tight text-foreground sm:text-base">
									{week.label}
								</h4>
								<p className="text-xs text-muted-foreground">
									{week.startDate} to {week.endDate}
								</p>
							</div>
							<p className="text-xs text-muted-foreground">
								Peak:{" "}
								<span className="font-semibold text-foreground">
									{strongestDay?.day ?? "-"}
								</span>
								{" · "}
								<span className="tabular-nums">
									{formatNumber(strongestDay?.views ?? 0)} views
								</span>
							</p>
						</div>

						<div className="mt-4 space-y-2.5">
							{week.days.map((day) => {
								const pct = (day.views / maxViews) * 100;
								const isFriday = day.day === "Fri";
								const isPeak = day.dayIndex === strongestDay?.dayIndex;

								return (
									<div key={`${week.week}-${day.day}`} className="flex gap-3">
										<span
											className={cn(
												"w-8 shrink-0 text-xs font-medium tabular-nums text-muted-foreground",
												isFriday && "text-primary",
												isPeak && "font-semibold text-foreground",
											)}
										>
											{day.day}
										</span>
										<div className="flex min-w-0 flex-1 items-center gap-3">
											<div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary dark:bg-secondary/60">
												<div
													className={cn(
														"h-full rounded-full transition-all duration-500",
														isPeak
															? "bg-primary"
															: isFriday
																? "bg-primary/70"
																: "bg-muted-foreground/35",
													)}
													style={{
														width: `${Math.max(pct, day.views > 0 ? 3 : 0)}%`,
													}}
												/>
											</div>
											<span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
												{formatNumber(day.views)}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}
