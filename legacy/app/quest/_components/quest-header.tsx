"use client";

import type { QuestLeaderboardEntry, QuestStats } from "@/app/quest/_lib/types";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import QuestLeaderboard from "./quest-leaderboard";

type QuestHeaderProps = {
	stats: QuestStats;
	leaderboard: QuestLeaderboardEntry[];
};

export default function QuestHeader({ stats, leaderboard }: QuestHeaderProps) {
	const pct = stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0;

	return (
		<div className="border-b border-border bg-background px-4 py-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex items-center gap-2">
					<h1 className="text-lg font-bold text-foreground">Mosque Quest</h1>
					<Badge
						variant="outline"
						className="border-border text-xs text-muted-foreground"
					>
						Petaling
					</Badge>
					<QuestLeaderboard leaderboard={leaderboard} />
				</div>
				<div className="flex items-center gap-3 sm:ml-auto">
					<ModeToggle className="h-8 w-16" />
				</div>
				<div className="flex items-center gap-3 sm:min-w-[220px]">
					<span className="text-sm text-muted-foreground">
						{stats.unlocked}/{stats.total} masjid
					</span>
					<Progress
						value={pct}
						className="h-2 flex-1 bg-secondary [&>div]:bg-emerald-500"
					/>
					<Badge
						variant="outline"
						className="border-border text-xs text-muted-foreground"
					>
						{Math.round(pct)}%
					</Badge>
				</div>
			</div>
		</div>
	);
}
