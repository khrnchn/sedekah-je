"use client";

import "../quest.css";

import { ArrowRight, Loader2, LocateFixed, Moon, Sun } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { QuestLeaderboardEntry } from "@/app/quest/_lib/types";
import { LAST_DISTRICT_KEY } from "@/app/quest/_lib/url-state";
import { Skeleton } from "@/components/ui/skeleton";
import { districtAt, districtBySlug } from "@/lib/features/quest/districts";
import QuestLeaderboard from "./quest-leaderboard";

const QuestOverviewMap = dynamic(() => import("./quest-overview-map"), {
	loading: () => <Skeleton className="h-full w-full rounded-none bg-muted" />,
	ssr: false,
});

export type QuestDistrictSummary = {
	slug: string;
	name: string;
	total: number;
	hasQr: number;
	inReview: number;
};

type QuestOverviewProps = {
	districts: QuestDistrictSummary[];
	leaderboard: QuestLeaderboardEntry[];
};

export default function QuestOverview({
	districts,
	leaderboard,
}: QuestOverviewProps) {
	const router = useRouter();
	const { resolvedTheme, setTheme } = useTheme();
	const [lastDistrict, setLastDistrict] = useState<{
		slug: string;
		name: string;
	} | null>(null);
	const [locating, setLocating] = useState(false);
	const [locateMessage, setLocateMessage] = useState<string | null>(null);

	useEffect(() => {
		try {
			const slug = localStorage.getItem(LAST_DISTRICT_KEY);
			setLastDistrict(slug ? districtBySlug(slug) : null);
		} catch {}
	}, []);

	const total = districts.reduce((sum, d) => sum + d.total, 0);
	const hasQr = districts.reduce((sum, d) => sum + d.hasQr, 0);
	const sorted = [...districts].sort(
		(a, b) =>
			b.total - b.hasQr - (a.total - a.hasQr) || a.name.localeCompare(b.name),
	);

	const findNearMe = () => {
		if (!("geolocation" in navigator)) {
			setLocateMessage("Your browser can't share a location.");
			return;
		}
		setLocating(true);
		setLocateMessage(null);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const slug = districtAt(
					position.coords.latitude,
					position.coords.longitude,
				);
				if (slug) {
					router.push(`/quest/${slug}`);
					return;
				}
				setLocating(false);
				setLocateMessage("You seem to be outside Selangor. Pick a district.");
			},
			() => {
				setLocating(false);
				setLocateMessage("Couldn't get your location. Pick a district.");
			},
			{ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
		);
	};

	return (
		<div
			lang="en"
			className="quest-surface flex h-dvh w-full flex-col bg-background"
		>
			<header className="quest-header shrink-0">
				<div className="quest-topbar">
					<Link href="/" aria-label="Sedekah Je home" className="quest-brand">
						<Image src="/masjid.svg" width={36} height={36} alt="" priority />
					</Link>
					<div className="quest-title">
						<h1>Mosque Quest</h1>
						<span className="quest-district">Selangor</span>
					</div>
					<div className="quest-header-actions">
						<QuestLeaderboard leaderboard={leaderboard} scope="Selangor" />
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
			</header>

			<div className="quest-overview">
				<div className="quest-overview-map">
					<QuestOverviewMap districts={districts} />
				</div>

				<section
					className="quest-overview-list"
					aria-labelledby="quest-districts"
				>
					{lastDistrict && (
						<Link
							href={`/quest/${lastDistrict.slug}`}
							className="quest-continue"
						>
							<span>
								<span className="quest-continue-label">Continue in</span>
								<strong>{lastDistrict.name}</strong>
							</span>
							<ArrowRight size={18} aria-hidden />
						</Link>
					)}

					<div className="quest-overview-summary">
						<p>
							<strong>{hasQr}</strong> of {total} mosques in Selangor have a QR
						</p>
						<div
							role="progressbar"
							aria-label="Mosques in Selangor with QR"
							aria-valuemin={0}
							aria-valuemax={total}
							aria-valuenow={hasQr}
							className="quest-progress"
						>
							<div
								style={{ width: `${total > 0 ? (hasQr / total) * 100 : 0}%` }}
							/>
						</div>
					</div>

					<div className="quest-overview-heading">
						<h2 id="quest-districts">Pick a district</h2>
						<button
							type="button"
							className="quest-near-me"
							onClick={findNearMe}
							disabled={locating}
						>
							{locating ? (
								<Loader2 size={15} className="animate-spin" aria-hidden />
							) : (
								<LocateFixed size={15} aria-hidden />
							)}
							Near me
						</button>
					</div>
					<p aria-live="polite" className="quest-near-me-message">
						{locateMessage}
					</p>

					<ol className="quest-district-list">
						{sorted.map((d) => {
							const pct =
								d.total > 0 ? Math.round((d.hasQr / d.total) * 100) : 0;
							const missing = d.total - d.hasQr - d.inReview;
							return (
								<li key={d.slug}>
									<Link
										href={`/quest/${d.slug}`}
										className="quest-district-row"
									>
										<span className="quest-district-row-top">
											<span className="quest-district-name">{d.name}</span>
											<span className="quest-district-count">
												<strong>{d.hasQr}</strong>/{d.total}
											</span>
										</span>
										<span
											role="progressbar"
											aria-label={`${d.name} mosques with QR`}
											aria-valuemin={0}
											aria-valuemax={d.total}
											aria-valuenow={d.hasQr}
											className="quest-progress"
										>
											<span style={{ width: `${pct}%` }} />
										</span>
										<span className="quest-district-meta">
											{pct}% have QR
											{missing > 0 && <> · {missing} missing</>}
											{d.inReview > 0 && <> · {d.inReview} in review</>}
										</span>
									</Link>
								</li>
							);
						})}
					</ol>
				</section>
			</div>
		</div>
	);
}
