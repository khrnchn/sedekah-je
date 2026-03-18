import { MapPin } from "lucide-react";
import Image from "next/image";
import {
	formatAverageMprForCard,
	formatDurationForCard,
	formatTimeForCard,
	getRamadanNightLabel,
} from "@/lib/terawih";

function TelemetryBackground() {
	return (
		<>
			{/* Base gradient */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.20),_transparent_40%),linear-gradient(180deg,_#0b0908_0%,_#14100d_100%)]" />
			{/* Grid overlay */}
			<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
			{/* Wave graphic above bottom section */}
			<div className="absolute inset-x-6 bottom-[26%] h-28">
				<svg
					viewBox="0 0 100 24"
					preserveAspectRatio="none"
					className="h-full w-full"
				>
					<path
						d="M0 16 C8 6, 18 6, 28 16 S48 26, 58 14 S78 0, 88 12 L100 18"
						fill="none"
						stroke="#f97316"
						strokeWidth="0.5"
						strokeDasharray="1.2 1.8"
						opacity="0.4"
					/>
					{/* Dots at peaks/valleys */}
					<circle cx="14" cy="6" r="1.2" fill="#f97316" opacity="0.5" />
					<circle cx="53" cy="22" r="1.2" fill="#f97316" opacity="0.5" />
					<circle cx="83" cy="4" r="1.2" fill="#f97316" opacity="0.5" />
				</svg>
			</div>
		</>
	);
}

type TerawihStoryCardProps = {
	title: string;
	subtitle: string;
	mosqueName?: string;
	highlightLabel: string;
	highlightValue: string;
	highlightSecondary?: string;
	stats: Array<{
		label: string;
		value: string;
		icon?: string;
	}>;
};

export function TerawihStoryCard({
	title,
	subtitle,
	mosqueName,
	highlightLabel,
	highlightValue,
	highlightSecondary,
	stats,
}: TerawihStoryCardProps) {
	return (
		<div className="relative isolate flex h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0a08] p-6 text-white shadow-2xl">
			<TelemetryBackground />
			<div className="relative z-10 flex h-full w-full flex-col">
				{/* Header: badge + branding */}
				<div className="flex items-start justify-between">
					<div className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-semibold tracking-[0.3em] text-orange-300">
						{subtitle}
					</div>
					<Image
						src="/masjid.svg"
						alt="SedekahJe"
						width={32}
						height={32}
						unoptimized
						className="h-8 w-8 opacity-80"
					/>
				</div>

				{/* Title */}
				<div className="mt-5">
					<h1 className="text-[64px] font-black uppercase leading-[0.85] tracking-[-0.06em]">
						<span className="text-white">TERA</span>
						<span className="text-orange-500">WIH</span>
					</h1>
					{mosqueName && (
						<div className="mt-3 flex items-center gap-1.5">
							<MapPin className="h-3.5 w-3.5 text-orange-400" />
							<p className="text-sm font-medium uppercase tracking-[0.12em] text-white/80">
								{mosqueName}
							</p>
						</div>
					)}
					{!mosqueName && title && (
						<p className="mt-3 max-w-[15rem] text-xl font-semibold uppercase leading-tight tracking-[0.12em] text-white/90">
							{title}
						</p>
					)}
				</div>

				{/* Stats grid - 2x2 */}
				<div className="mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="bg-black/40 px-4 py-5 backdrop-blur-[1px]"
						>
							<p className="text-[9px] uppercase tracking-[0.3em] text-white/40">
								{stat.label}
							</p>
							<p className="mt-2 text-[28px] font-bold leading-none tracking-[-0.04em]">
								{stat.value}
							</p>
						</div>
					))}
				</div>

				{/* Bottom highlight bar */}
				<div className="mt-3 overflow-hidden rounded-2xl border border-orange-500/25 bg-orange-500/10">
					<div className="flex items-center justify-between gap-3 px-4 py-4">
						<div className="min-w-0">
							<p className="text-[9px] uppercase tracking-[0.3em] text-orange-200/70">
								{highlightLabel}
							</p>
							<p className="mt-1.5 truncate text-[26px] font-black uppercase leading-none tracking-[-0.04em] text-orange-400">
								{highlightValue}
							</p>
						</div>
						<div className="shrink-0 text-right">
							<p className="text-[9px] uppercase tracking-[0.3em] text-white/40">
								Status
							</p>
							<p className="mt-1.5 flex items-center gap-1 text-[26px] font-bold leading-none text-orange-400">
								<span className="text-lg">&#10003;</span> DONE
							</p>
						</div>
					</div>
					{highlightSecondary && (
						<div className="border-t border-orange-500/15 px-4 py-2.5">
							<p className="text-right text-sm font-medium text-orange-300/60">
								{highlightSecondary}
							</p>
						</div>
					)}
				</div>

				{/* Branding footer */}
				<div className="mt-3 text-center">
					<p className="text-[9px] tracking-[0.3em] text-white/30">
						sedekah.je/terawih
					</p>
				</div>
			</div>
		</div>
	);
}

type TerawihSessionStoryCardProps = {
	mosqueName: string;
	sessionDate: string;
	ramadanStartDate?: string | null;
	startTime: string;
	endTime: string;
	durationMinutes: number;
	averageMpr: number;
	rakaat: number;
};

export function TerawihSessionStoryCard(props: TerawihSessionStoryCardProps) {
	return (
		<TerawihStoryCard
			title=""
			mosqueName={props.mosqueName}
			subtitle={getRamadanNightLabel(props.sessionDate, props.ramadanStartDate)}
			highlightLabel="Rakaat"
			highlightValue={`${props.rakaat}`}
			stats={[
				{
					label: "Start Time",
					value: formatTimeForCard(props.startTime),
				},
				{
					label: "Finish Time",
					value: formatTimeForCard(props.endTime),
				},
				{
					label: "Duration",
					value: formatDurationForCard(props.durationMinutes),
				},
				{
					label: "Avg MPR",
					value: formatAverageMprForCard(props.averageMpr),
				},
			]}
		/>
	);
}

type TerawihWrappedStoryCardProps = {
	year: number;
	totalNights: number;
	totalMinutes: number;
	totalRakaat: number;
	averageMpr: number;
	bestStreak: number;
	topMosque: string | null;
};

export function TerawihWrappedStoryCard(props: TerawihWrappedStoryCardProps) {
	return (
		<TerawihStoryCard
			title={`RAMADAN ${props.year} WRAPPED`}
			subtitle="PERFORMANCE SUMMARY"
			highlightLabel="Top Mosque"
			highlightValue={props.topMosque ?? "N/A"}
			stats={[
				{
					label: "Nights",
					value: `${props.totalNights}`,
				},
				{
					label: "Minutes",
					value: formatDurationForCard(props.totalMinutes),
				},
				{
					label: "Total Rakaat",
					value: `${props.totalRakaat}`,
				},
				{
					label: "Best Streak",
					value: `${props.bestStreak}`,
				},
			]}
		/>
	);
}
