"use client";

import {
	ChevronLeft,
	Grid2X2,
	List,
	Map as MapIcon,
	Moon,
	Sun,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import type { QuestLeaderboardEntry, QuestStats } from "@/app/quest/_lib/types";
import type { QuestView } from "@/app/quest/_lib/url-state";
import { cn } from "@/lib/utils";
import QuestLeaderboard from "./quest-leaderboard";

const VIEWS = [
	{ value: "map", label: "Map", icon: MapIcon },
	{ value: "board", label: "Board", icon: List },
	{ value: "grid", label: "Grid", icon: Grid2X2 },
] as const;

type QuestHeaderProps = {
	districtName: string;
	stats: QuestStats;
	leaderboard: QuestLeaderboardEntry[];
	view: QuestView;
	onViewChange: (view: QuestView) => void;
};

export default function QuestHeader({
	districtName,
	stats,
	leaderboard,
	view,
	onViewChange,
}: QuestHeaderProps) {
	const { resolvedTheme, setTheme } = useTheme();
	const pct = stats.total > 0 ? (stats.hasQr / stats.total) * 100 : 0;

	return (
		<header className="quest-header shrink-0">
			<div className="quest-topbar">
				<Link
					href="/quest"
					aria-label="All districts"
					title="All districts"
					className="quest-back"
				>
					<ChevronLeft size={20} aria-hidden />
				</Link>
				<Link href="/" aria-label="Sedekah Je home" className="quest-brand">
					<Image src="/masjid.svg" width={36} height={36} alt="" />
				</Link>
				<div className="quest-title">
					<h1>{districtName}</h1>
					<span className="quest-district">Mosque Quest, Selangor</span>
				</div>
				<div className="quest-header-actions">
					<QuestLeaderboard leaderboard={leaderboard} scope={districtName} />
					<button
						type="button"
						className="quest-theme-button"
						aria-label="Toggle light or dark theme"
						onClick={() =>
							setTheme(resolvedTheme === "dark" ? "light" : "dark")
						}
					>
						<Sun size={17} className="dark:hidden" />
						<Moon size={17} className="hidden dark:block" />
					</button>
				</div>
			</div>
			<div className="quest-navigation">
				<fieldset className="quest-view-tabs">
					<legend className="sr-only">View</legend>
					{VIEWS.map(({ value, label, icon: Icon }) => (
						<button
							key={value}
							type="button"
							aria-pressed={view === value}
							onClick={() => onViewChange(value)}
							className={cn("quest-view-tab", view === value && "is-active")}
						>
							<Icon size={15} strokeWidth={1.7} />
							{label}
						</button>
					))}
				</fieldset>
				<div className="quest-progress-summary">
					<p>
						<strong>{stats.hasQr}</strong>
						<span> / {stats.total}</span>
						<span className="quest-progress-label"> have QR</span>
					</p>
					<div
						role="progressbar"
						aria-label="Mosques with QR"
						aria-valuemin={0}
						aria-valuemax={stats.total}
						aria-valuenow={stats.hasQr}
						className="quest-progress"
					>
						<div style={{ width: `${pct}%` }} />
					</div>
				</div>
			</div>
		</header>
	);
}
