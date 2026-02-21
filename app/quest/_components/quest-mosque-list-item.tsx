"use client";

import { Lock, Unlock } from "lucide-react";
import type { QuestMosqueWithStatus } from "@/app/quest/_lib/types";
import { cn } from "@/lib/utils";

type QuestMosqueListItemProps = {
	mosque: QuestMosqueWithStatus;
	isSelected: boolean;
	onSelect: (id: number) => void;
};

export default function QuestMosqueListItem({
	mosque,
	isSelected,
	onSelect,
}: QuestMosqueListItemProps) {
	return (
		<button
			type="button"
			onClick={() => onSelect(mosque.id)}
			className={cn(
				"flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
				isSelected
					? "bg-zinc-800 ring-1 ring-yellow-500/50"
					: "hover:bg-zinc-800/50",
			)}
		>
			<div className="mt-0.5 shrink-0">
				{mosque.isUnlocked ? (
					<Unlock className="h-4 w-4 text-green-500" />
				) : (
					<Lock className="h-4 w-4 text-zinc-500" />
				)}
			</div>
			<div className="min-w-0 flex-1">
				<p
					className={cn(
						"truncate text-sm font-medium",
						mosque.isUnlocked ? "text-green-400" : "text-zinc-300",
					)}
				>
					{mosque.name}
				</p>
				{mosque.address && (
					<p className="truncate text-xs text-zinc-500">{mosque.address}</p>
				)}
			</div>
		</button>
	);
}
