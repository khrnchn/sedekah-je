"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
	QuestLeaderboardEntry,
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
	leaderboard: QuestLeaderboardEntry[];
};

type QuestStatusFilter = "all" | "unlocked" | "locked";

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
	leaderboard,
}: QuestPageClientProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [sort, setSort] = useState<QuestSortOption>("alphabetical");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<QuestStatusFilter>("all");
	const [sheetOpen, setSheetOpen] = useState(false);

	const filteredMosques = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();

		return mosques.filter((mosque) => {
			if (statusFilter === "unlocked" && !mosque.isUnlocked) return false;
			if (statusFilter === "locked" && mosque.isUnlocked) return false;

			if (!normalizedQuery) return true;

			const haystack = `${mosque.name} ${mosque.address ?? ""}`.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [mosques, searchQuery, statusFilter]);

	const sortedMosques = useMemo(
		() => sortMosques(filteredMosques, sort),
		[filteredMosques, sort],
	);

	const selectedMosque = useMemo(
		() => sortedMosques.find((m) => m.id === selectedId) ?? null,
		[sortedMosques, selectedId],
	);

	useEffect(() => {
		if (selectedId === null) return;
		if (!sortedMosques.some((mosque) => mosque.id === selectedId)) {
			setSelectedId(null);
		}
	}, [selectedId, sortedMosques]);

	const handleSelect = useCallback(
		(id: number) => {
			setSelectedId((prev) => {
				const next = prev === id ? null : id;
				if (!isDesktop && next !== null) {
					setSheetOpen(true);
				}
				return next;
			});
		},
		[isDesktop],
	);

	return (
		<div className="flex h-dvh w-full flex-col bg-zinc-950">
			<QuestHeader stats={stats} leaderboard={leaderboard} />
			<div className="relative flex flex-1 overflow-hidden">
				{isDesktop && (
					<QuestSidebar
						mosques={sortedMosques}
						totalMosques={mosques.length}
						selectedId={selectedId}
						onSelect={handleSelect}
						sort={sort}
						onSortChange={setSort}
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						statusFilter={statusFilter}
						onStatusFilterChange={setStatusFilter}
					/>
				)}
				<div className="relative flex-1">
					<QuestMap
						mosques={sortedMosques}
						selectedId={selectedId}
						onMarkerClick={handleSelect}
						bottomSheetOpen={sheetOpen}
						isDesktop={isDesktop}
					/>
					{isDesktop && (
						<QuestMosqueDetail
							mosque={selectedMosque}
							onClose={() => setSelectedId(null)}
						/>
					)}
				</div>
				{!isDesktop && (
					<QuestBottomSheet
						mosques={sortedMosques}
						totalMosques={mosques.length}
						selectedId={selectedId}
						selectedMosque={selectedMosque}
						onSelect={handleSelect}
						onClearSelection={() => setSelectedId(null)}
						sort={sort}
						onSortChange={setSort}
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						statusFilter={statusFilter}
						onStatusFilterChange={setStatusFilter}
						open={sheetOpen}
						onOpenChange={(open) => {
							setSheetOpen(open);
							if (!open) setSelectedId(null);
						}}
					/>
				)}
			</div>
		</div>
	);
}
