"use client";

import "../quest.css";

import { useMemo, useRef, useState } from "react";
import { questTour } from "@/app/quest/_lib/tour";
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
import QuestGroupList from "./quest-group-list";
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
	const selectionTrigger = useRef<HTMLElement | null>(null);
	const [view, setView] = useState<QuestView>(initialView);
	const [selectedId, setSelectedId] = useState<number | null>(
		initialSelectedId,
	);
	const [statusFilter, setStatusFilter] = useState<QuestStatusFilter>("all");
	const [groupIds, setGroupIds] = useState<number[] | null>(null);

	const selectedMosque = mosques.find((m) => m.id === selectedId) ?? null;
	const groupMosques = groupIds
		? mosques.filter((m) => groupIds.includes(m.id))
		: [];

	// Prev/next walks the mosques the current filter shows, nearest first.
	const tour = useMemo(
		() =>
			questTour(
				mosques.filter((m) =>
					statusFilter === "all"
						? true
						: statusFilter === "unmapped"
							? m.coords === null
							: m.status === statusFilter,
				),
			),
		[mosques, statusFilter],
	);
	const tourIndex = selectedId === null ? -1 : tour.indexOf(selectedId);

	const navigate = (nextView: QuestView, nextSelectedId: number | null) => {
		setGroupIds(null);
		setView(nextView);
		setSelectedId(nextSelectedId);
		const params = new URLSearchParams();
		if (nextView !== "map") params.set("view", nextView);
		if (nextSelectedId !== null) params.set("m", String(nextSelectedId));
		const query = params.toString();
		window.history.replaceState(null, "", query ? `/quest?${query}` : "/quest");
	};

	const onSelect = (id: number | null) => {
		if (id !== null && document.activeElement instanceof HTMLElement) {
			selectionTrigger.current = document.activeElement;
		}
		navigate(view, id);
		if (id === null) {
			requestAnimationFrame(() =>
				selectionTrigger.current?.focus({ preventScroll: true }),
			);
		}
	};
	const onFindMissing = () => {
		setStatusFilter("missing");
		navigate("board", null);
	};
	const onShowUnmapped = () => {
		setStatusFilter("unmapped");
		navigate("board", selectedId);
	};

	return (
		<div
			lang="en"
			className="quest-surface flex h-dvh w-full flex-col bg-background"
		>
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
							onFindMissing={onFindMissing}
							onShowGroup={(ids) => {
								navigate(view, null);
								setGroupIds(ids);
							}}
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
				{!selectedMosque && groupMosques.length > 0 && (
					<QuestGroupList
						mosques={groupMosques}
						onSelect={onSelect}
						onClose={() => setGroupIds(null)}
					/>
				)}
				{selectedMosque && (
					<QuestCard
						key={selectedMosque.id}
						mosque={selectedMosque}
						view={view}
						onClose={() => onSelect(null)}
						step={
							tourIndex === -1
								? undefined
								: {
										index: tourIndex,
										total: tour.length,
										onPrev: () =>
											navigate(
												view,
												tour[(tourIndex - 1 + tour.length) % tour.length],
											),
										onNext: () =>
											navigate(view, tour[(tourIndex + 1) % tour.length]),
									}
						}
					/>
				)}
			</div>
		</div>
	);
}
