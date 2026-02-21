"use client";

import { List } from "lucide-react";
import type {
	QuestMosqueWithStatus,
	QuestSortOption,
} from "@/app/quest/_lib/types";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import QuestMosqueListItem from "./quest-mosque-list-item";

type QuestBottomSheetProps = {
	mosques: QuestMosqueWithStatus[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	sort: QuestSortOption;
	onSortChange: (sort: QuestSortOption) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export default function QuestBottomSheet({
	mosques,
	selectedId,
	onSelect,
	sort,
	onSortChange,
	open,
	onOpenChange,
}: QuestBottomSheetProps) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerTrigger asChild>
				<button
					type="button"
					className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 shadow-lg ring-1 ring-zinc-700 transition-colors hover:bg-zinc-700"
				>
					<List className="h-4 w-4" />
					Senarai Masjid
				</button>
			</DrawerTrigger>
			<DrawerContent className="max-h-[70dvh] border-zinc-800 bg-zinc-950">
				<DrawerHeader className="pb-2">
					<DrawerTitle className="text-zinc-100">Senarai Masjid</DrawerTitle>
					<div className="mt-2">
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
				</DrawerHeader>
				<ScrollArea className="flex-1 px-2 pb-4">
					<div className="space-y-1">
						{mosques.map((mosque) => (
							<QuestMosqueListItem
								key={mosque.id}
								mosque={mosque}
								isSelected={mosque.id === selectedId}
								onSelect={(id) => {
									onSelect(id);
									onOpenChange(false);
								}}
							/>
						))}
						{mosques.length === 0 && (
							<p className="py-8 text-center text-sm text-zinc-500">
								Tiada masjid ditemui
							</p>
						)}
					</div>
				</ScrollArea>
			</DrawerContent>
		</Drawer>
	);
}
