"use client";

import { useCallback, useMemo, useState } from "react";
import type {
	QuestMosqueWithStatus,
	QuestSortOption,
	QuestStats,
} from "@/app/quest/_lib/types";
import { useMediaQuery } from "@/hooks/use-media-query";
import QuestBottomSheet from "./quest-bottom-sheet";
import QuestHeader from "./quest-header";
import QuestMap from "./quest-map";
import QuestMosqueDetail from "./quest-mosque-detail";
import QuestSidebar from "./quest-sidebar";

type QuestPageClientProps = {
	mosques: QuestMosqueWithStatus[];
	stats: QuestStats;
};

function sortMosques(
	mosques: QuestMosqueWithStatus[],
	sort: QuestSortOption,
): QuestMosqueWithStatus[] {
	if (sort === "status") {
		return [...mosques].sort((a, b) => {
			if (a.isUnlocked !== b.isUnlocked) {
				return a.isUnlocked ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		});
	}
	return mosques;
}

export default function QuestPageClient({
	mosques,
	stats,
}: QuestPageClientProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [sort, setSort] = useState<QuestSortOption>("alphabetical");
	const [sheetOpen, setSheetOpen] = useState(false);

	const sortedMosques = useMemo(
		() => sortMosques(mosques, sort),
		[mosques, sort],
	);

	const selectedMosque = useMemo(
		() => mosques.find((m) => m.id === selectedId) ?? null,
		[mosques, selectedId],
	);

	const handleSelect = useCallback((id: number) => {
		setSelectedId((prev) => (prev === id ? null : id));
	}, []);

	return (
		<div className="flex h-dvh w-full flex-col bg-zinc-950">
			<QuestHeader stats={stats} />
			<div className="relative flex flex-1 overflow-hidden">
				{isDesktop && (
					<QuestSidebar
						mosques={sortedMosques}
						selectedId={selectedId}
						onSelect={handleSelect}
						sort={sort}
						onSortChange={setSort}
					/>
				)}
				<div className="relative flex-1">
					<QuestMap
						mosques={mosques}
						selectedId={selectedId}
						onMarkerClick={handleSelect}
					/>
					<QuestMosqueDetail
						mosque={selectedMosque}
						onClose={() => setSelectedId(null)}
					/>
				</div>
				{!isDesktop && (
					<QuestBottomSheet
						mosques={sortedMosques}
						selectedId={selectedId}
						onSelect={handleSelect}
						sort={sort}
						onSortChange={setSort}
						open={sheetOpen}
						onOpenChange={setSheetOpen}
					/>
				)}
			</div>
		</div>
	);
}
