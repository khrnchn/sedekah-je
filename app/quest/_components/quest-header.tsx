"use client";

import type { QuestLeaderboardEntry, QuestStats } from "@/app/quest/_lib/types";
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
		<div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex items-center gap-2">
					<h1 className="text-lg font-bold text-zinc-100">Mosque Quest</h1>
					<Badge
						variant="outline"
						className="border-zinc-700 text-xs text-zinc-400"
					>
						Petaling
					</Badge>
				</div>
				<div>
					<QuestLeaderboard leaderboard={leaderboard} />
				</div>
				<div className="flex items-center gap-3 sm:ml-auto sm:min-w-[220px]">
					<span className="text-sm text-zinc-400">
						{stats.unlocked}/{stats.total} masjid
					</span>
					<Progress
						value={pct}
						className="h-2 flex-1 bg-zinc-800 [&>div]:bg-emerald-500"
					/>
					<Badge
						variant="outline"
						className="border-zinc-700 text-xs text-zinc-400"
					>
						{Math.round(pct)}%
					</Badge>
				</div>
			</div>
		</div>
	);
}
