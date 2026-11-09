"use client";

import type { QuestLeaderboardEntry, QuestStats } from "@/app/quest/_lib/types";
import type { QuestView } from "@/app/quest/_lib/url-state";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { cn } from "@/lib/utils";
import QuestLeaderboard from "./quest-leaderboard";

const VIEW_LABELS: { value: QuestView; label: string }[] = [
	{ value: "map", label: "Map" },
	{ value: "board", label: "Board" },
	{ value: "grid", label: "Grid" },
];

type QuestHeaderProps = {
	stats: QuestStats;
	leaderboard: QuestLeaderboardEntry[];
	view: QuestView;
	onViewChange: (view: QuestView) => void;
};

export default function QuestHeader({
	stats,
	leaderboard,
	view,
	onViewChange,
}: QuestHeaderProps) {
	const pct = stats.total > 0 ? (stats.hasQr / stats.total) * 100 : 0;

	return (
		<header className="border-b border-border bg-background px-4 pb-3 pt-4">
			<div className="flex items-center justify-between gap-2">
				<div className="min-w-0">
					<h1 className="whitespace-nowrap text-base font-semibold tracking-tight text-foreground">
						Mosque Quest
					</h1>
					<p className="text-xs text-muted-foreground">Petaling</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="whitespace-nowrap pr-1 text-right">
						<p className="font-mono text-base font-semibold tabular-nums text-foreground">
							{stats.hasQr}
							<span className="text-muted-foreground">/{stats.total}</span>
						</p>
						<p className="text-xs text-muted-foreground">have QR</p>
					</div>
					<QuestLeaderboard leaderboard={leaderboard} />
					<ModeToggle className="h-11 w-11 shrink-0" />
				</div>
			</div>
			<div
				role="progressbar"
				aria-label="Mosques with QR"
				aria-valuemin={0}
				aria-valuemax={stats.total}
				aria-valuenow={stats.hasQr}
				className="mt-2 h-[3px] overflow-hidden rounded-full bg-muted"
			>
				<div
					className="h-full rounded-full bg-emerald-600"
					style={{ width: `${pct}%` }}
				/>
			</div>
			<fieldset className="mt-3 flex rounded-lg border border-border bg-muted p-0.5">
				<legend className="sr-only">View</legend>
				{VIEW_LABELS.map((v) => (
					<button
						key={v.value}
						type="button"
						aria-pressed={view === v.value}
						onClick={() => onViewChange(v.value)}
						className={cn(
							"min-h-11 flex-1 rounded-md text-xs transition-colors",
							view === v.value
								? "bg-background font-semibold text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{v.label}
					</button>
				))}
			</fieldset>
		</header>
	);
}
