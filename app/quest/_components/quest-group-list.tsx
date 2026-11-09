"use client";

import { ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { QuestMosqueView } from "@/app/quest/_lib/types";
import type { QuestStatus } from "@/lib/features/quest/rules";

const STATUS_LABEL: Record<QuestStatus, string> = {
	missing: "Missing QR",
	in_review: "In review",
	has_qr: "Has QR",
};

const ORDER: Record<QuestStatus, number> = {
	missing: 0,
	in_review: 1,
	has_qr: 2,
};

export default function QuestGroupList({
	mosques,
	onSelect,
	onClose,
}: {
	mosques: QuestMosqueView[];
	onSelect: (id: number) => void;
	onClose: () => void;
}) {
	const closeRef = useRef<HTMLButtonElement>(null);
	// The parent passes a fresh onClose each render; a ref keeps the effect from re-focusing.
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	useEffect(() => {
		closeRef.current?.focus({ preventScroll: true });
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCloseRef.current();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const sorted = [...mosques].sort(
		(a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name),
	);
	const left = mosques.filter((m) => m.status === "missing").length;

	return (
		<section aria-label="Mosques at this spot" className="quest-detail">
			<button
				ref={closeRef}
				type="button"
				onClick={onClose}
				aria-label="Close list"
				className="quest-detail-close"
			>
				<X size={18} />
			</button>
			<div className="quest-detail-scroll">
				<p className="quest-detail-status">
					{left > 0 ? `${left} without a QR` : "All have a QR"}
				</p>
				<h2>{mosques.length} mosques here</h2>
				<ul className="quest-group-list">
					{sorted.map((mosque) => (
						<li key={mosque.id}>
							<button type="button" onClick={() => onSelect(mosque.id)}>
								<span
									aria-hidden
									className="quest-group-dot"
									data-status={mosque.status}
								/>
								<span className="quest-group-text">
									<span className="quest-group-name">{mosque.name}</span>
									<span className="quest-group-status">
										{STATUS_LABEL[mosque.status]}
									</span>
								</span>
								<ChevronRight aria-hidden size={16} />
							</button>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
