"use client";

import type {
	QuestMosqueWithStatus,
	QuestSortOption,
} from "@/app/quest/_lib/types";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import QuestMosqueListItem from "./quest-mosque-list-item";

type QuestStatusFilter = "all" | "unlocked" | "locked";

type QuestSidebarProps = {
	mosques: QuestMosqueWithStatus[];
	totalMosques: number;
	selectedId: number | null;
	onSelect: (id: number) => void;
	sort: QuestSortOption;
	onSortChange: (sort: QuestSortOption) => void;
	searchQuery: string;
	onSearchQueryChange: (value: string) => void;
	statusFilter: QuestStatusFilter;
	onStatusFilterChange: (filter: QuestStatusFilter) => void;
};

export default function QuestSidebar({
	mosques,
	totalMosques,
	selectedId,
	onSelect,
	sort,
	onSortChange,
	searchQuery,
	onSearchQueryChange,
	statusFilter,
	onStatusFilterChange,
}: QuestSidebarProps) {
	const statusFilters: { value: QuestStatusFilter; label: string }[] = [
		{ value: "all", label: "Semua" },
		{ value: "unlocked", label: "Tersedia" },
		{ value: "locked", label: "Belum" },
	];

	return (
		<div className="relative z-10 flex w-80 flex-col border-r border-border bg-background">
			<div className="space-y-3 border-b border-border px-4 py-3">
				<Input
					value={searchQuery}
					onChange={(event) => onSearchQueryChange(event.target.value)}
					placeholder="Cari masjid atau alamat..."
					className="h-8 border-border bg-muted text-xs text-foreground placeholder:text-muted-foreground"
				/>
				<div className="flex items-center gap-1 rounded-md bg-muted p-1">
					{statusFilters.map((filter) => (
						<button
							key={filter.value}
							type="button"
							aria-pressed={statusFilter === filter.value}
							onClick={() => onStatusFilterChange(filter.value)}
							className={cn(
								"flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
								statusFilter === filter.value
									? "bg-accent text-foreground"
									: "text-muted-foreground hover:bg-accent hover:text-foreground",
							)}
						>
							{filter.label}
						</button>
					))}
				</div>
				<Select
					value={sort}
					onValueChange={(v) => onSortChange(v as QuestSortOption)}
				>
					<SelectTrigger className="h-8 w-full border-border bg-muted text-foreground/80 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="border-border bg-popover">
						<SelectItem
							value="alphabetical"
							className="text-foreground/80 text-xs focus:bg-accent focus:text-foreground"
						>
							A-Z
						</SelectItem>
						<SelectItem
							value="status"
							className="text-foreground/80 text-xs focus:bg-accent focus:text-foreground"
						>
							Status
						</SelectItem>
					</SelectContent>
				</Select>
				<p className="text-[11px] text-muted-foreground">
					{mosques.length}/{totalMosques} masjid
				</p>
			</div>
			<div className="flex-1 overflow-y-auto">
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
						<p className="py-8 text-center text-sm text-muted-foreground">
							Tiada masjid ditemui
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
