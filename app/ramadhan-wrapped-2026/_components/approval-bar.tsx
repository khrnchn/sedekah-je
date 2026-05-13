import { cn } from "@/lib/utils";

type ApprovalBarProps = {
	approved: number;
	pending: number;
	rejected: number;
	total: number;
	className?: string;
};

export function ApprovalBar({
	approved,
	pending,
	rejected,
	total,
	className,
}: ApprovalBarProps) {
	if (total === 0) return null;

	const approvedPct = (approved / total) * 100;
	const pendingPct = (pending / total) * 100;
	const rejectedPct = (rejected / total) * 100;

	return (
		<div className={cn("space-y-3", className)}>
			<div className="flex h-2.5 overflow-hidden rounded-full bg-muted sm:h-3">
				<div
					className="rounded-l-full bg-emerald-600 dark:bg-emerald-500"
					style={{ width: `${approvedPct}%` }}
				/>
				<div
					className="bg-amber-500 dark:bg-amber-400"
					style={{ width: `${pendingPct}%` }}
				/>
				<div
					className="rounded-r-full bg-red-500/60 dark:bg-red-400/60"
					style={{ width: `${rejectedPct}%` }}
				/>
			</div>
			<div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
				<span className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
					<span className="text-muted-foreground">Approved</span>
					<span className="font-semibold tabular-nums text-foreground">
						{approvedPct.toFixed(1)}%
					</span>
				</span>
				<span className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-amber-500 dark:bg-amber-400" />
					<span className="text-muted-foreground">Pending</span>
					<span className="font-semibold tabular-nums text-foreground">
						{pendingPct.toFixed(1)}%
					</span>
				</span>
				<span className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-red-500/60 dark:bg-red-400/60" />
					<span className="text-muted-foreground">Rejected</span>
					<span className="font-semibold tabular-nums text-foreground">
						{rejectedPct.toFixed(1)}%
					</span>
				</span>
			</div>
		</div>
	);
}
