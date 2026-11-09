"use client";

import { ChevronRight, Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { filterAndSortMosques } from "@/app/quest/_lib/board";
import type {
	QuestMosqueView,
	QuestStatusFilter,
} from "@/app/quest/_lib/types";
import { cn } from "@/lib/utils";

const STATUS_CHIPS: { value: QuestStatusFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "missing", label: "Missing" },
	{ value: "in_review", label: "In review" },
	{ value: "has_qr", label: "Has QR" },
];

const STATUS_LABEL = {
	has_qr: "Has QR",
	in_review: "In review",
	missing: "Missing QR",
} as const;

type QuestBoardProps = {
	mosques: QuestMosqueView[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	statusFilter: QuestStatusFilter;
	onStatusFilterChange: (filter: QuestStatusFilter) => void;
};

export default function QuestBoard({
	mosques,
	selectedId,
	onSelect,
	statusFilter,
	onStatusFilterChange,
}: QuestBoardProps) {
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<"az" | "nearest">("az");
	const [origin, setOrigin] = useState<[number, number] | null>(null);
	const [locationError, setLocationError] = useState(false);
	const wantsNearest = useRef(false);
	const locating = useRef(false);

	const visible = filterAndSortMosques(mosques, {
		query,
		status: statusFilter,
		sort,
		origin,
	});

	const onSortChange = (next: "az" | "nearest") => {
		setLocationError(false);
		wantsNearest.current = next === "nearest";
		if (next === "az") {
			setSort("az");
			return;
		}
		if (origin) {
			setSort("nearest");
			return;
		}
		if (!("geolocation" in navigator)) {
			setLocationError(true);
			return;
		}
		if (locating.current) return;
		locating.current = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				locating.current = false;
				setOrigin([pos.coords.latitude, pos.coords.longitude]);
				// The user may have switched back to A to Z while waiting.
				if (wantsNearest.current) setSort("nearest");
			},
			() => {
				locating.current = false;
				if (!wantsNearest.current) return;
				setSort("az");
				setLocationError(true);
			},
			{ timeout: 10000 },
		);
	};

	const clearFilters = () => {
		setQuery("");
		onStatusFilterChange("all");
	};

	return (
		<div
			className={cn(
				"quest-board h-full overflow-y-auto",
				selectedId !== null && "pb-[45dvh] md:pb-0",
			)}
		>
			<div className="quest-board-inner">
				<div className="quest-board-tools">
					<div className="quest-board-heading">
						<h2>Find a mosque</h2>
						<span>{visible.length} mosques</span>
					</div>
					<div className="flex gap-2">
						<label className="relative min-w-0 flex-1">
							<span className="sr-only">Search mosques</span>
							<Search
								aria-hidden
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
							/>
							<input
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search name or area"
								className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</label>
						<label>
							<span className="sr-only">Sort</span>
							<select
								value={sort}
								onChange={(e) =>
									onSortChange(e.target.value as "az" | "nearest")
								}
								className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="az">A to Z</option>
								<option value="nearest">Nearest</option>
							</select>
						</label>
					</div>
					{locationError && (
						<output className="block text-xs text-muted-foreground">
							Location unavailable
						</output>
					)}
					<div className="quest-board-filters">
						{STATUS_CHIPS.map((chip) => (
							<button
								key={chip.value}
								type="button"
								aria-pressed={statusFilter === chip.value}
								onClick={() => onStatusFilterChange(chip.value)}
							>
								{chip.label}
							</button>
						))}
						{statusFilter === "unmapped" && (
							<button
								type="button"
								onClick={() => onStatusFilterChange("all")}
								aria-label="Remove No map location filter"
								className="flex items-center gap-1.5"
							>
								No map location
								<X aria-hidden className="size-4" />
							</button>
						)}
					</div>
				</div>

				{visible.length === 0 ? (
					<div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
						<p className="text-sm text-muted-foreground">No mosques match.</p>
						<button
							type="button"
							onClick={clearFilters}
							className="h-11 rounded-lg border border-border px-4 text-sm text-foreground"
						>
							Clear filters
						</button>
					</div>
				) : (
					<ul className="quest-board-list">
						{visible.map((m) => (
							<li key={m.id}>
								<button
									type="button"
									onClick={() => onSelect(m.id)}
									aria-current={m.id === selectedId}
									className="quest-board-row"
								>
									<span className="quest-row-index">
										{String(m.id).padStart(2, "0")}
									</span>
									<span
										aria-hidden
										className="quest-row-seal"
										data-status={m.status}
									>
										<span />
									</span>
									<span className="sr-only">{STATUS_LABEL[m.status]}, </span>
									<span className="min-w-0 flex-1">
										<span className="quest-row-name block truncate text-foreground">
											{m.name}
										</span>
										<span className="quest-row-address block truncate text-muted-foreground">
											{[m.address, !m.coords && "No map location"]
												.filter(Boolean)
												.join(" · ")}
										</span>
									</span>
									{m.pendingAttempts > 0 && m.status === "in_review" ? (
										<span className="quest-row-review">
											{m.pendingAttempts} in review
										</span>
									) : (
										<ChevronRight
											aria-hidden
											className="size-4 shrink-0 text-muted-foreground"
										/>
									)}
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
