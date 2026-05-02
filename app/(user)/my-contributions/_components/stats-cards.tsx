import { CheckCircle2, Clock, ListChecks, XCircle } from "lucide-react";
import { StatCard, StatsGrid } from "@/components/layout/user-page-components";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
	stats: {
		totalContributions: number;
		approvedContributions: number;
		pendingContributions: number;
		rejectedContributions: number;
	};
}

export function StatsCards({ stats }: StatsCardsProps) {
	const mobileStats = [
		{
			label: "Diluluskan",
			value: stats.approvedContributions,
			icon: CheckCircle2,
			className: "text-emerald-700 dark:text-emerald-300",
		},
		{
			label: "Menunggu",
			value: stats.pendingContributions,
			icon: Clock,
			className: "text-amber-700 dark:text-amber-300",
		},
		{
			label: "Ditolak",
			value: stats.rejectedContributions,
			icon: XCircle,
			className: "text-red-700 dark:text-red-300",
		},
	];

	return (
		<div data-tour="mycontrib-stats">
			<div className="md:hidden rounded-lg border bg-card px-3 py-3">
				<div className="flex items-center gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
						<ListChecks className="size-5" aria-hidden="true" />
					</div>
					<div className="min-w-0">
						<p className="text-xs font-medium text-muted-foreground">
							Jumlah sumbangan
						</p>
						<p className="text-2xl font-semibold leading-none tabular-nums">
							{stats.totalContributions}
						</p>
					</div>
				</div>
				<div className="mt-3 grid grid-cols-3 gap-2">
					{mobileStats.map(({ label, value, icon: Icon, className }) => (
						<div
							key={label}
							className="rounded-md bg-muted/50 px-2.5 py-2 text-center"
						>
							<div
								className={cn(
									"mx-auto flex items-center justify-center gap-1 text-sm font-semibold tabular-nums",
									className,
								)}
							>
								<Icon className="size-3.5" aria-hidden="true" />
								{value}
							</div>
							<p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
								{label}
							</p>
						</div>
					))}
				</div>
			</div>
			<div className="hidden md:block">
				<StatsGrid cols={4}>
					<StatCard value={stats.totalContributions} label="Jumlah Sumbangan" />
					<StatCard value={stats.approvedContributions} label="Diluluskan" />
					<StatCard
						value={stats.pendingContributions}
						label="Menunggu Semakan"
					/>
					<StatCard value={stats.rejectedContributions} label="Ditolak" />
				</StatsGrid>
			</div>
		</div>
	);
}
