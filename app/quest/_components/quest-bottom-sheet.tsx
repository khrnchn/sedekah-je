"use client";

import { List } from "lucide-react";
import type {
	QuestMosqueWithStatus,
	QuestSortOption,
} from "@/app/quest/_lib/types";
import { Button } from "@/components/ui/button";
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
import QuestMosqueDetail from "./quest-mosque-detail";
import QuestMosqueListItem from "./quest-mosque-list-item";

type QuestBottomSheetProps = {
	mosques: QuestMosqueWithStatus[];
	selectedId: number | null;
	selectedMosque: QuestMosqueWithStatus | null;
	onSelect: (id: number) => void;
	onClearSelection: () => void;
	sort: QuestSortOption;
	onSortChange: (sort: QuestSortOption) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export default function QuestBottomSheet({
	mosques,
	selectedId,
	selectedMosque,
	onSelect,
	onClearSelection,
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
					className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 shadow-lg ring-1 ring-zinc-700 transition-colors hover:bg-zinc-700"
				>
					<List className="h-4 w-4" />
					Senarai Masjid
				</button>
			</DrawerTrigger>
			<DrawerContent className="flex h-[72dvh] flex-col overflow-hidden border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)] sm:h-[70dvh]">
				{selectedMosque ? (
					<div className="flex h-full flex-col">
						<DrawerHeader className="pb-2">
							<DrawerTitle className="text-zinc-100">
								Butiran Masjid
							</DrawerTitle>
							<Button
								type="button"
								variant="ghost"
								className="mt-1 h-7 w-fit px-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
								onClick={onClearSelection}
							>
								Kembali ke Senarai
							</Button>
						</DrawerHeader>
						<ScrollArea className="flex-1 px-3 pb-4">
							<QuestMosqueDetail
								mosque={selectedMosque}
								onClose={onClearSelection}
								variant="sheet"
							/>
						</ScrollArea>
					</div>
				) : (
					<>
						<DrawerHeader className="pb-2">
							<DrawerTitle className="text-zinc-100">
								Senarai Masjid
							</DrawerTitle>
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
					</>
				)}
			</DrawerContent>
		</Drawer>
	);
}
