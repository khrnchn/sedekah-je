"use client";

import type { QuestStats } from "@/app/quest/_lib/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type QuestHeaderProps = {
	stats: QuestStats;
};

export default function QuestHeader({ stats }: QuestHeaderProps) {
	const pct = stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0;

	return (
		<div className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
			<div className="flex items-center gap-2">
				<h1 className="text-lg font-bold text-zinc-100">Mosque Quest</h1>
				<Badge
					variant="outline"
					className="border-zinc-700 text-xs text-zinc-400"
				>
					Petaling
				</Badge>
			</div>
			<div className="ml-auto flex items-center gap-3">
				<span className="text-sm text-zinc-400">
					{stats.unlocked}/{stats.total} masjid
				</span>
				<Progress
					value={pct}
					className="h-2 w-24 bg-zinc-800 [&>div]:bg-green-500"
				/>
			</div>
		</div>
	);
}
