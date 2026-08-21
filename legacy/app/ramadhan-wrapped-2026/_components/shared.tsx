import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-GB").format(value);
}

export function formatPercent(value: number, decimals: number = 1): string {
	return `${value.toFixed(decimals)}%`;
}

export function SectionLabel({
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

export function StatCard({
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

export function RankingCard({
	title,
	items,
}: {
	title: string;
	items: RankItem[];
}) {
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
