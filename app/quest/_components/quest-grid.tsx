"use client";

import type { QuestMosqueView } from "@/app/quest/_lib/types";
import { cn } from "@/lib/utils";

const STATUS = {
	has_qr: { label: "Has QR", className: "quest-legend-dot is-has-qr" },
	in_review: { label: "In review", className: "quest-legend-dot is-review" },
	missing: { label: "Missing QR", className: "quest-legend-dot is-missing" },
} as const;

type QuestGridProps = {
	districtName: string;
	mosques: QuestMosqueView[];
	selectedId: number | null;
	onSelect: (id: number) => void;
};

export default function QuestGrid({
	districtName,
	mosques,
	selectedId,
	onSelect,
}: QuestGridProps) {
	const stamped = mosques.filter((m) => m.status === "has_qr").length;
	const stampTop = { has_qr: "SEDEKAH.JE", in_review: "DALAM SEMAKAN" };

	return (
		<div
			className={cn(
				"h-full overflow-y-auto",
				selectedId !== null && "pb-[45dvh] md:pb-0",
			)}
		>
			{/* Shared stamp geometry and ink texture, referenced by every tile. */}
			<svg aria-hidden className="absolute size-0" focusable="false">
				<defs>
					{/* Both arcs run left to right so top and bottom text stay upright. */}
					<path id="quest-stamp-top" d="M12,50 a38,38 0 0,1 76,0" />
					<path id="quest-stamp-bottom" d="M12,50 a38,38 0 0,0 76,0" />
					<filter id="quest-ink" x="-5%" y="-5%" width="110%" height="110%">
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.9"
							numOctaves="2"
							seed="7"
							result="grain"
						/>
						<feDisplacementMap
							in="SourceGraphic"
							in2="grain"
							scale="1.4"
							result="rough"
						/>
						<feColorMatrix
							in="grain"
							type="matrix"
							values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 2.3"
							result="wear"
						/>
						<feComposite in="rough" in2="wear" operator="in" />
					</filter>
				</defs>
			</svg>
			<div className="quest-grid-wrap">
				<div className="quest-board-heading">
					<h2>Every mosque counts.</h2>
					<span>
						{stamped} of {mosques.length} stamped
					</span>
				</div>
				<ul className="quest-grid-legend">
					{Object.entries(STATUS).map(([status, s]) => (
						<li key={status}>
							<span aria-hidden className={s.className} />
							{s.label}
							<span className="quest-grid-legend-count">
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
								No. {String(m.id).padStart(2, "0")}
							</span>
							<span
								aria-hidden
								className="quest-stamp"
								// Deterministic tilt so stamps look hand-pressed but never jump between renders.
								style={{ rotate: `${((m.id * 37) % 23) - 11}deg` }}
							>
								{m.status === "missing" ? (
									<svg viewBox="0 0 100 100" className="quest-stamp-slot">
										<circle cx="50" cy="50" r="45" />
									</svg>
								) : (
									<svg viewBox="0 0 100 100" className="quest-stamp-ink">
										<circle cx="50" cy="50" r="46" className="is-outer" />
										<circle cx="50" cy="50" r="30" className="is-inner" />
										<text>
											<textPath href="#quest-stamp-top" startOffset="50%">
												{stampTop[m.status]}
											</textPath>
										</text>
										<text>
											<textPath href="#quest-stamp-bottom" startOffset="50%">
												{districtName.toUpperCase()}
											</textPath>
										</text>
										<circle cx="12" cy="50" r="2.2" className="is-dot" />
										<circle cx="88" cy="50" r="2.2" className="is-dot" />
									</svg>
								)}
								<span className="quest-stamp-mosque" />
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
