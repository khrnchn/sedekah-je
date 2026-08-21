import { cn } from "@/lib/utils";
import { formatNumber } from "./shared";

type StateBarListProps = {
	states: Array<{ state: string; submissions: number }>;
	totalSubmissions?: number;
	className?: string;
};

export function StateBarList({
	states,
	totalSubmissions,
	className,
}: StateBarListProps) {
	if (states.length === 0) return null;
	const maxSubs = Math.max(...states.map((s) => s.submissions), 1);

	return (
		<div className={cn("space-y-2.5", className)}>
			{states.map((row, i) => {
				const pct = (row.submissions / maxSubs) * 100;
				const shareOfTotal =
					totalSubmissions && totalSubmissions > 0
						? Math.round((row.submissions / totalSubmissions) * 100)
						: null;
				return (
					<div key={row.state} className="group flex items-center gap-3">
						<span
							className={cn(
								"w-28 shrink-0 truncate text-sm text-foreground sm:w-32",
								i === 0 && "font-semibold",
							)}
						>
							{row.state}
						</span>
						<div className="flex-1">
							<div className="h-2.5 overflow-hidden rounded-full bg-secondary dark:bg-secondary/60">
								<div
									className="h-full rounded-full bg-primary transition-all duration-500"
									style={{ width: `${pct}%` }}
								/>
							</div>
						</div>
						<span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground">
							{formatNumber(row.submissions)}
						</span>
						{shareOfTotal !== null && (
							<span className="hidden w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground/60 sm:block">
								{shareOfTotal}%
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}

const CATEGORY_COLORS: Record<string, { dot: string; text: string }> = {
	masjid: {
		dot: "bg-blue-500 dark:bg-blue-400",
		text: "text-blue-700 dark:text-blue-300",
	},
	surau: {
		dot: "bg-emerald-500 dark:bg-emerald-400",
		text: "text-emerald-700 dark:text-emerald-300",
	},
	tahfiz: {
		dot: "bg-yellow-500 dark:bg-yellow-400",
		text: "text-yellow-700 dark:text-yellow-300",
	},
	kebajikan: {
		dot: "bg-orange-500 dark:bg-orange-400",
		text: "text-orange-700 dark:text-orange-300",
	},
	"lain-lain": {
		dot: "bg-purple-500 dark:bg-purple-400",
		text: "text-purple-700 dark:text-purple-300",
	},
};

const DEFAULT_CATEGORY = {
	dot: "bg-muted-foreground dark:bg-muted-foreground/80",
	text: "text-muted-foreground",
};

const CATEGORY_LABELS: Record<string, string> = {
	masjid: "Masjid",
	surau: "Surau",
	tahfiz: "Tahfiz",
	kebajikan: "Kebajikan",
	"lain-lain": "Lain-lain",
};

type CategoryPillsProps = {
	categories: Array<{ category: string; submissions: number }>;
	totalSubmissions?: number;
	className?: string;
};

export function CategoryPills({
	categories,
	totalSubmissions,
	className,
}: CategoryPillsProps) {
	if (categories.length === 0) return null;

	return (
		<div className={cn("flex flex-wrap gap-3", className)}>
			{categories.map((row) => {
				const colors = CATEGORY_COLORS[row.category] ?? DEFAULT_CATEGORY;
				const label = CATEGORY_LABELS[row.category] ?? row.category;
				const shareOfTotal =
					totalSubmissions && totalSubmissions > 0
						? Math.round((row.submissions / totalSubmissions) * 100)
						: null;
				return (
					<div
						key={row.category}
						className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm dark:border-border/80 dark:shadow-none"
					>
						<span
							className={cn("size-2.5 shrink-0 rounded-full", colors.dot)}
						/>
						<span className={cn("text-sm font-medium", colors.text)}>
							{label}
						</span>
						<span className="font-heading text-sm font-bold tabular-nums text-foreground">
							{formatNumber(row.submissions)}
						</span>
						{shareOfTotal !== null && (
							<span className="text-xs tabular-nums text-muted-foreground/60">
								({shareOfTotal}%)
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}
