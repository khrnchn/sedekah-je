"use client";

import type { QuestMosqueView } from "@/app/quest/_lib/types";
import { cn } from "@/lib/utils";

const STATUS = {
	has_qr: { label: "Has QR", className: "bg-emerald-600" },
	in_review: { label: "In review", className: "bg-amber-500" },
	missing: { label: "Missing QR", className: "bg-muted-foreground/25" },
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
				"h-full overflow-y-auto px-4 py-4",
				selectedId !== null && "pb-[45dvh] md:pb-4",
			)}
		>
			<div className="grid grid-cols-8 gap-1.5 md:grid-cols-[repeat(auto-fill,minmax(44px,1fr))]">
				{mosques.map((m) => (
					<button
						key={m.id}
						type="button"
						onClick={() => onSelect(m.id)}
						aria-label={`${m.name}, ${STATUS[m.status].label}`}
						aria-current={m.id === selectedId}
						className={cn(
							"aspect-square min-h-11 rounded-md",
							STATUS[m.status].className,
							m.id === selectedId &&
								"ring-2 ring-foreground ring-offset-2 ring-offset-background",
						)}
					/>
				))}
			</div>
			<ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
				{Object.values(STATUS).map((s) => (
					<li key={s.label} className="flex items-center gap-1.5">
						<span
							aria-hidden
							className={cn("size-3 rounded-sm", s.className)}
						/>
						{s.label}
					</li>
				))}
			</ul>
		</div>
	);
}
