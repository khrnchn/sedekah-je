import { cn } from "@/lib/utils";
import { formatNumber } from "./shared";

type CityBarListProps = {
	cities: Array<{ city: string; state: string; submissions: number }>;
	totalSubmissions?: number;
	className?: string;
};

export function CityBarList({
	cities,
	totalSubmissions,
	className,
}: CityBarListProps) {
	if (cities.length === 0) return null;
	const maxSubs = Math.max(...cities.map((c) => c.submissions), 1);

	return (
		<div className={cn("space-y-2.5", className)}>
			{cities.map((row, i) => {
				const pct = (row.submissions / maxSubs) * 100;
				const shareOfTotal =
					totalSubmissions && totalSubmissions > 0
						? Math.round((row.submissions / totalSubmissions) * 100)
						: null;
				return (
					<div
						key={`${row.city}-${row.state}`}
						className="group flex items-center gap-3"
					>
						<span
							className={cn(
								"w-36 shrink-0 truncate text-sm text-foreground sm:w-44",
								i === 0 && "font-semibold",
							)}
						>
							<span className="text-foreground/90">{row.city}</span>
							<span className="text-muted-foreground">, {row.state}</span>
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
