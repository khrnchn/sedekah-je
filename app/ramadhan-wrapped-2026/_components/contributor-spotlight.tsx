import { cn } from "@/lib/utils";
import { formatNumber } from "./shared";

type ContributorSpotlightProps = {
	contributors: Array<{ name: string; submissions: number }>;
	className?: string;
};

const MEDAL_STYLES = [
	"bg-amber-500/[0.15] text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:text-amber-400 dark:bg-amber-500/20 dark:ring-amber-400/25",
	"bg-zinc-400/10 text-zinc-500 ring-1 ring-inset ring-zinc-400/20 dark:text-zinc-300 dark:bg-zinc-400/[0.15] dark:ring-zinc-400/25",
	"bg-orange-500/10 text-orange-700 ring-1 ring-inset ring-orange-500/20 dark:text-orange-400 dark:bg-orange-500/[0.15] dark:ring-orange-400/25",
];

const MEDAL_LABELS = ["1st", "2nd", "3rd"];

export function ContributorSpotlight({
	contributors,
	className,
}: ContributorSpotlightProps) {
	if (contributors.length === 0) return null;

	return (
		<div className={cn("space-y-3", className)}>
			{contributors.map((row, i) => (
				<div
					key={`${row.name}-${i}`}
					className={cn(
						"flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm dark:border-border/80 dark:shadow-none",
						i < 3 &&
							"border-primary/20 bg-primary/[0.02] dark:border-primary/25 dark:bg-primary/[0.04]",
					)}
				>
					<span
						className={cn(
							"flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
							i < 3
								? MEDAL_STYLES[i]
								: "bg-muted text-muted-foreground dark:bg-muted/80",
						)}
					>
						{i < 3 ? MEDAL_LABELS[i] : i + 1}
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold text-foreground">
							{row.name}
						</p>
						<p className="text-xs text-muted-foreground">
							{i === 0
								? "Top contributor"
								: i === 1
									? "Runner-up"
									: i === 2
										? "Third place"
										: "Contributor"}
						</p>
					</div>
					<span className="shrink-0 font-heading text-lg font-bold tabular-nums text-foreground sm:text-xl">
						{formatNumber(row.submissions)}
					</span>
				</div>
			))}
		</div>
	);
}
