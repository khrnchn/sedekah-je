"use client";

import { useState } from "react";
import type {
	QuestLeaderboardEntry,
	QuestMosqueView,
	QuestStats,
	QuestStatusFilter,
} from "@/app/quest/_lib/types";
import type { QuestView } from "@/app/quest/_lib/url-state";
import QuestBoard from "./quest-board";
import QuestCard from "./quest-card";
import QuestGrid from "./quest-grid";
import QuestHeader from "./quest-header";
import QuestMap from "./quest-map";

type QuestPageClientProps = {
	mosques: QuestMosqueView[];
	stats: QuestStats;
	leaderboard: QuestLeaderboardEntry[];
	initialView: QuestView;
	initialSelectedId: number | null;
};

export default function QuestPageClient({
	mosques,
	stats,
	leaderboard,
	initialView,
	initialSelectedId,
}: QuestPageClientProps) {
	const [view, setView] = useState<QuestView>(initialView);
	const [selectedId, setSelectedId] = useState<number | null>(
		initialSelectedId,
	);
	const [statusFilter, setStatusFilter] = useState<QuestStatusFilter>("all");

	const selectedMosque = mosques.find((m) => m.id === selectedId) ?? null;

	const navigate = (nextView: QuestView, nextSelectedId: number | null) => {
		setView(nextView);
		setSelectedId(nextSelectedId);
		const params = new URLSearchParams();
		if (nextView !== "map") params.set("view", nextView);
		if (nextSelectedId !== null) params.set("m", String(nextSelectedId));
		const query = params.toString();
		window.history.replaceState(null, "", query ? `/quest?${query}` : "/quest");
	};

	const onSelect = (id: number | null) => navigate(view, id);
	const onShowUnmapped = () => {
		setStatusFilter("unmapped");
		navigate("board", selectedId);
	};

	return (
		<div className="flex h-dvh w-full flex-col bg-background">
			<QuestHeader
				stats={stats}
				leaderboard={leaderboard}
				view={view}
				onViewChange={(next) => navigate(next, selectedId)}
			/>
			<div className="relative flex min-h-0 flex-1">
				<main className="relative min-w-0 flex-1">
					{view === "map" ? (
						<QuestMap
							mosques={mosques}
							selectedId={selectedId}
							onSelect={onSelect}
							statusFilter={statusFilter}
							onStatusFilterChange={setStatusFilter}
							onShowUnmapped={onShowUnmapped}
						/>
					) : view === "board" ? (
						<QuestBoard
							mosques={mosques}
							selectedId={selectedId}
							onSelect={onSelect}
							statusFilter={statusFilter}
							onStatusFilterChange={setStatusFilter}
						/>
					) : (
						<QuestGrid
							mosques={mosques}
							selectedId={selectedId}
							onSelect={onSelect}
						/>
					)}
				</main>
				{selectedMosque && (
					<QuestCard
						key={selectedMosque.id}
						mosque={selectedMosque}
						view={view}
						onClose={() => onSelect(null)}
					/>
				)}
			</div>
		</div>
	);
}
