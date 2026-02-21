"use client";

import type { QuestStats } from "@/app/quest/_lib/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type QuestHeaderProps = {
	stats: QuestStats;
};

export default function QuestHeader({ stats }: QuestHeaderProps) {
	const pct = stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0;
	const remaining = Math.max(stats.total - stats.unlocked, 0);
	const objective =
		remaining > 0
			? `Unlock ${Math.min(3, remaining)} lagi`
			: "Semua masjid unlocked";

	return (
		<div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex items-center gap-2">
					<h1 className="text-lg font-bold text-zinc-100">Mosque Quest</h1>
					<Badge
						variant="outline"
						className="border-zinc-700 text-xs text-zinc-400"
					>
						Petaling
					</Badge>
				</div>
				<Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs hover:bg-emerald-500/15">
					Objective: {objective}
				</Badge>
				<div className="ml-auto flex min-w-[220px] items-center gap-3">
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
