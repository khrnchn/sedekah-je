"use client";

import type {
	QuestMosqueWithStatus,
	QuestSortOption,
} from "@/app/quest/_lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import QuestMosqueListItem from "./quest-mosque-list-item";

type QuestSidebarProps = {
	mosques: QuestMosqueWithStatus[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	sort: QuestSortOption;
	onSortChange: (sort: QuestSortOption) => void;
};

export default function QuestSidebar({
	mosques,
	selectedId,
	onSelect,
	sort,
	onSortChange,
}: QuestSidebarProps) {
	return (
		<div className="flex w-80 flex-col border-r border-zinc-800 bg-zinc-950">
			<div className="border-b border-zinc-800 px-4 py-3">
				<Select
					value={sort}
					onValueChange={(v) => onSortChange(v as QuestSortOption)}
				>
					<SelectTrigger className="h-8 w-full border-zinc-700 bg-zinc-900 text-zinc-300 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="border-zinc-700 bg-zinc-900">
						<SelectItem
							value="alphabetical"
							className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100"
						>
							A-Z
						</SelectItem>
						<SelectItem
							value="status"
							className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100"
						>
							Status
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<ScrollArea className="flex-1">
				<div className="space-y-1 p-2">
					{mosques.map((mosque) => (
						<QuestMosqueListItem
							key={mosque.id}
							mosque={mosque}
							isSelected={mosque.id === selectedId}
							onSelect={onSelect}
						/>
					))}
					{mosques.length === 0 && (
						<p className="py-8 text-center text-sm text-zinc-500">
							Tiada masjid ditemui
						</p>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
