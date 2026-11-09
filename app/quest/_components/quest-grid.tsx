"use client";

import type { QuestMosqueView } from "@/app/quest/_lib/types";
import { cn } from "@/lib/utils";

const STATUS = {
	has_qr: { label: "Has QR", className: "bg-emerald-600" },
	in_review: { label: "In review", className: "bg-amber-600" },
	missing: {
		label: "Missing QR",
		className: "border border-foreground bg-background",
	},
} as const;

type QuestGridProps = {
	mosques: QuestMosqueView[];
	selectedId: number | null;
	onSelect: (id: number) => void;
};

export default function QuestGrid({
	mosques,
	selectedId,
	onSelect,
}: QuestGridProps) {
	return (
		<div
			className={cn(
				"h-full overflow-y-auto",
				selectedId !== null && "pb-[45dvh] md:pb-0",
			)}
		>
			<div className="quest-grid-wrap">
				<div className="quest-board-heading">
					<h2>Every mosque counts.</h2>
					<span>{mosques.length} in Petaling</span>
				</div>
				<ul className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
					{Object.entries(STATUS).map(([status, s]) => (
						<li key={status} className="flex items-center gap-1.5">
							<span
								aria-hidden
								className={cn("size-2 rounded-full", s.className)}
							/>
							{s.label}
							<span className="ml-1 tabular-nums text-foreground">
								{mosques.filter((m) => m.status === status).length}
							</span>
						</li>
					))}
				</ul>
				{mosques.length === 0 && (
					<p className="py-12 text-center text-sm text-muted-foreground">
						No mosques to show yet.
					</p>
				)}
				<div className="quest-collection">
					{mosques.map((m) => (
						<button
							key={m.id}
							type="button"
							onClick={() => onSelect(m.id)}
							aria-label={`${m.name}, ${STATUS[m.status].label}`}
							aria-current={m.id === selectedId}
							data-status={m.status}
							className="quest-tile"
						>
							<span className="quest-tile-meta">
								<span>{String(m.id).padStart(2, "0")}</span>
								<span
									aria-hidden
									className={cn(
										"size-1.5 rounded-full",
										STATUS[m.status].className,
									)}
								/>
							</span>
							<span className="quest-tile-name">
								{m.name.replace(/^masjid\s+/i, "")}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
