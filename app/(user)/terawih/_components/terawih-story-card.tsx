import Image from "next/image";
import {
	formatAverageMprForCard,
	formatDurationForCard,
	formatTimeForCard,
	getRamadanNightLabel,
} from "@/lib/terawih";

type TerawihStoryCardProps = {
	title: string;
	subtitle: string;
	highlightLabel: string;
	highlightValue: string;
	stats: Array<{
		label: string;
		value: string;
	}>;
};

function TelemetryBackground() {
	return (
		<>
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.24),_transparent_35%),linear-gradient(180deg,_#0b0908_0%,_#14100d_100%)]" />
			<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
			<div className="absolute inset-x-0 bottom-48 h-40 bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),_transparent_60%)]" />
			<div className="absolute inset-x-8 bottom-56 h-28 rounded-full border border-orange-500/15" />
			<div className="absolute inset-x-10 bottom-72 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
			<div className="absolute inset-x-10 bottom-44 h-24">
				<svg
					viewBox="0 0 100 20"
					preserveAspectRatio="none"
					className="h-full w-full opacity-35"
				>
					<path
						d="M0 14 C10 8, 20 8, 30 14 S50 20, 60 12 S80 2, 100 16"
						fill="none"
						stroke="#f97316"
						strokeWidth="0.6"
						strokeDasharray="1.4 1.6"
					/>
				</svg>
			</div>
		</>
	);
}

export function TerawihStoryCard({
	title,
	subtitle,
	highlightLabel,
	highlightValue,
	stats,
}: TerawihStoryCardProps) {
	return (
		<div className="relative isolate flex h-full w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#0d0a08] p-7 text-white shadow-2xl">
			<TelemetryBackground />
			<div className="relative z-10 flex h-full w-full flex-col">
				<div className="flex items-start justify-between">
					<div className="space-y-3">
						<div className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-medium tracking-[0.35em] text-orange-300">
							{subtitle}
						</div>
						<div>
							<h1 className="text-[70px] font-black uppercase leading-none tracking-[-0.08em]">
								<span className="text-white">TERA</span>
								<span className="text-orange-500">WIH</span>
							</h1>
							<p className="mt-4 max-w-[15rem] text-[24px] font-semibold uppercase leading-tight tracking-[0.18em] text-white/90">
								{title}
							</p>
						</div>
					</div>
					<div className="flex flex-col items-end gap-3 text-right">
						<Image
							src="/masjid.svg"
							alt="SedekahJe"
							width={40}
							height={40}
							unoptimized
							className="h-10 w-10 opacity-85"
						/>
						<div className="text-[11px] uppercase tracking-[0.28em] text-white/50">
							sedekah.je/terawih
						</div>
					</div>
				</div>

				<div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-white/10 bg-white/10">
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="bg-black/30 px-5 py-6 backdrop-blur-[1px]"
						>
							<p className="text-[10px] uppercase tracking-[0.34em] text-white/45">
								{stat.label}
							</p>
							<p className="mt-3 text-[32px] font-bold leading-none tracking-[-0.06em]">
								{stat.value}
							</p>
						</div>
					))}
				</div>

				<div className="mt-auto rounded-[22px] border border-orange-500/25 bg-orange-500/12 px-5 py-4 backdrop-blur-sm">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-[10px] uppercase tracking-[0.34em] text-orange-200/80">
								{highlightLabel}
							</p>
							<p className="mt-2 max-w-[13rem] break-words text-[28px] font-black uppercase leading-[1.05] tracking-[-0.05em] text-orange-400">
								{highlightValue}
							</p>
						</div>
						<div className="text-right">
							<p className="text-[10px] uppercase tracking-[0.34em] text-white/45">
								Status
							</p>
							<p className="mt-2 text-[28px] font-bold text-orange-400">DONE</p>
						</div>
					</div>
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
			title={props.mosqueName}
			subtitle={getRamadanNightLabel(props.sessionDate, props.ramadanStartDate)}
			highlightLabel="Rakaat"
			highlightValue={`${props.rakaat}`}
			stats={[
				{
					label: "Start Time",
					value: formatTimeForCard(props.startTime),
				},
				{
					label: "End Time",
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
					label: "Avg MPR",
					value: formatAverageMprForCard(props.averageMpr),
				},
				{
					label: "Best Streak",
					value: `${props.bestStreak}`,
				},
				{
					label: "Feature",
					value: "WRAPPED",
				},
			]}
		/>
	);
}
