import {
	formatAverageMprForCard,
	formatDurationForCard,
	formatTimeForCard,
	getRamadanNightLabel,
} from "@/lib/terawih";

export type StoryCardTheme = "ember" | "emerald" | "midnight" | "sand";

type ThemeTokens = {
	bg: string;
	cardBg: string;
	cellBg: string;
	accent: string;
	accentMuted: string;
	accentBorder: string;
	accentBadgeBg: string;
	accentBadgeBorder: string;
	accentBadgeText: string;
	highlightBg: string;
	highlightBorder: string;
	highlightLabel: string;
	highlightValue: string;
	highlightDivider: string;
	highlightSecondary: string;
	gridBorder: string;
	gridCellBorder: string;
	text: string;
	textMuted: string;
	textDim: string;
	wave: string;
	waveDot: string;
	footer: string;
	gridLine: string;
};

const THEMES: Record<StoryCardTheme, ThemeTokens> = {
	ember: {
		bg: "radial-gradient(circle at top, rgba(249,115,22,0.20), transparent 40%), linear-gradient(180deg, #0b0908 0%, #14100d 100%)",
		cardBg: "#0d0a08",
		cellBg: "rgba(13,10,8,0.9)",
		accent: "#f97316",
		accentMuted: "#f97316",
		accentBorder: "rgba(249,115,22,0.3)",
		accentBadgeBg: "rgba(249,115,22,0.1)",
		accentBadgeBorder: "rgba(249,115,22,0.3)",
		accentBadgeText: "#fdba74",
		highlightBg: "rgba(249,115,22,0.1)",
		highlightBorder: "rgba(249,115,22,0.25)",
		highlightLabel: "rgba(254,215,170,0.7)",
		highlightValue: "#fb923c",
		highlightDivider: "rgba(249,115,22,0.15)",
		highlightSecondary: "rgba(253,186,116,0.6)",
		gridBorder: "rgba(255,255,255,0.1)",
		gridCellBorder: "rgba(255,255,255,0.1)",
		text: "#ffffff",
		textMuted: "rgba(255,255,255,0.8)",
		textDim: "rgba(255,255,255,0.4)",
		wave: "#f97316",
		waveDot: "#f97316",
		footer: "rgba(255,255,255,0.3)",
		gridLine: "rgba(255,255,255,0.04)",
	},
	emerald: {
		bg: "radial-gradient(circle at top, rgba(16,185,129,0.20), transparent 40%), linear-gradient(180deg, #050d0a 0%, #0a1410 100%)",
		cardBg: "#060d0a",
		cellBg: "rgba(6,13,10,0.9)",
		accent: "#10b981",
		accentMuted: "#10b981",
		accentBorder: "rgba(16,185,129,0.3)",
		accentBadgeBg: "rgba(16,185,129,0.1)",
		accentBadgeBorder: "rgba(16,185,129,0.3)",
		accentBadgeText: "#6ee7b7",
		highlightBg: "rgba(16,185,129,0.1)",
		highlightBorder: "rgba(16,185,129,0.25)",
		highlightLabel: "rgba(167,243,208,0.7)",
		highlightValue: "#34d399",
		highlightDivider: "rgba(16,185,129,0.15)",
		highlightSecondary: "rgba(110,231,183,0.6)",
		gridBorder: "rgba(255,255,255,0.1)",
		gridCellBorder: "rgba(255,255,255,0.1)",
		text: "#ffffff",
		textMuted: "rgba(255,255,255,0.8)",
		textDim: "rgba(255,255,255,0.4)",
		wave: "#10b981",
		waveDot: "#10b981",
		footer: "rgba(255,255,255,0.3)",
		gridLine: "rgba(255,255,255,0.04)",
	},
	midnight: {
		bg: "radial-gradient(circle at top, rgba(59,130,246,0.20), transparent 40%), linear-gradient(180deg, #06080d 0%, #0a0e14 100%)",
		cardBg: "#070a0f",
		cellBg: "rgba(7,10,15,0.9)",
		accent: "#3b82f6",
		accentMuted: "#3b82f6",
		accentBorder: "rgba(59,130,246,0.3)",
		accentBadgeBg: "rgba(59,130,246,0.1)",
		accentBadgeBorder: "rgba(59,130,246,0.3)",
		accentBadgeText: "#93c5fd",
		highlightBg: "rgba(59,130,246,0.1)",
		highlightBorder: "rgba(59,130,246,0.25)",
		highlightLabel: "rgba(191,219,254,0.7)",
		highlightValue: "#60a5fa",
		highlightDivider: "rgba(59,130,246,0.15)",
		highlightSecondary: "rgba(147,197,253,0.6)",
		gridBorder: "rgba(255,255,255,0.1)",
		gridCellBorder: "rgba(255,255,255,0.1)",
		text: "#ffffff",
		textMuted: "rgba(255,255,255,0.8)",
		textDim: "rgba(255,255,255,0.4)",
		wave: "#3b82f6",
		waveDot: "#3b82f6",
		footer: "rgba(255,255,255,0.3)",
		gridLine: "rgba(255,255,255,0.04)",
	},
	sand: {
		bg: "radial-gradient(circle at top, rgba(217,180,130,0.15), transparent 40%), linear-gradient(180deg, #faf6f0 0%, #f0e9df 100%)",
		cardBg: "#f7f2ea",
		cellBg: "rgba(255,255,255,0.6)",
		accent: "#a0774a",
		accentMuted: "#a0774a",
		accentBorder: "rgba(160,119,74,0.3)",
		accentBadgeBg: "rgba(160,119,74,0.1)",
		accentBadgeBorder: "rgba(160,119,74,0.3)",
		accentBadgeText: "#92693e",
		highlightBg: "rgba(160,119,74,0.08)",
		highlightBorder: "rgba(160,119,74,0.2)",
		highlightLabel: "rgba(130,90,50,0.6)",
		highlightValue: "#7c5a30",
		highlightDivider: "rgba(160,119,74,0.12)",
		highlightSecondary: "rgba(160,119,74,0.5)",
		gridBorder: "rgba(0,0,0,0.1)",
		gridCellBorder: "rgba(0,0,0,0.08)",
		text: "#2c1e0e",
		textMuted: "rgba(44,30,14,0.75)",
		textDim: "rgba(44,30,14,0.35)",
		wave: "#a0774a",
		waveDot: "#a0774a",
		footer: "rgba(44,30,14,0.25)",
		gridLine: "rgba(0,0,0,0.04)",
	},
};

function TelemetryBackground({ theme }: { theme: ThemeTokens }) {
	return (
		<>
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: theme.bg,
				}}
			/>
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage: `linear-gradient(${theme.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridLine} 1px, transparent 1px)`,
					backgroundSize: "40px 40px",
				}}
			/>
			<div
				style={{
					position: "absolute",
					left: 24,
					right: 24,
					bottom: "26%",
					height: 112,
				}}
			>
				<svg
					viewBox="0 0 100 24"
					preserveAspectRatio="none"
					style={{ width: "100%", height: "100%", display: "block" }}
				>
					<path
						d="M0 16 C8 6, 18 6, 28 16 S48 26, 58 14 S78 0, 88 12 L100 18"
						fill="none"
						stroke={theme.wave}
						strokeWidth="0.5"
						strokeDasharray="1.2 1.8"
						opacity="0.4"
					/>
					<circle cx="14" cy="6" r="1.2" fill={theme.waveDot} opacity="0.5" />
					<circle cx="53" cy="22" r="1.2" fill={theme.waveDot} opacity="0.5" />
					<circle cx="83" cy="4" r="1.2" fill={theme.waveDot} opacity="0.5" />
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
	theme?: StoryCardTheme;
	stats: Array<{
		label: string;
		value: string;
	}>;
};

export function TerawihStoryCard({
	title,
	subtitle,
	mosqueName,
	highlightLabel,
	highlightValue,
	highlightSecondary,
	theme: themeName = "ember",
	stats,
}: TerawihStoryCardProps) {
	const t = THEMES[themeName];

	return (
		<div
			style={{
				position: "relative",
				display: "flex",
				height: "100%",
				width: "100%",
				overflow: "hidden",
				borderRadius: 28,
				border: `1px solid ${t.gridBorder}`,
				backgroundColor: t.cardBg,
				padding: 24,
				color: t.text,
				fontFamily:
					'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
			}}
		>
			<TelemetryBackground theme={t} />
			<div
				style={{
					position: "relative",
					zIndex: 10,
					display: "flex",
					flexDirection: "column",
					height: "100%",
					width: "100%",
				}}
			>
				{/* Header: badge + branding */}
				<div
					style={{
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "space-between",
					}}
				>
					<div
						style={{
							display: "inline-flex",
							borderRadius: 9999,
							border: `1px solid ${t.accentBadgeBorder}`,
							backgroundColor: t.accentBadgeBg,
							padding: "4px 12px",
							fontSize: 10,
							fontWeight: 600,
							letterSpacing: "0.3em",
							color: t.accentBadgeText,
						}}
					>
						{subtitle}
					</div>
					{/* biome-ignore lint/performance/noImgElement: plain img for reliable html-to-image export */}
					<img
						src="/masjid.svg"
						alt=""
						width={32}
						height={32}
						style={{ width: 32, height: 32, opacity: 0.8 }}
					/>
				</div>

				{/* Title */}
				<div style={{ marginTop: 20 }}>
					<div
						style={{
							fontSize: 64,
							fontWeight: 900,
							textTransform: "uppercase",
							lineHeight: 0.85,
							letterSpacing: "-0.06em",
						}}
					>
						<span style={{ color: t.text }}>TERA</span>
						<span style={{ color: t.accent }}>WIH</span>
					</div>
					{mosqueName && (
						<p
							style={{
								marginTop: 12,
								fontSize: 14,
								fontWeight: 500,
								textTransform: "uppercase",
								letterSpacing: "0.12em",
								color: t.textMuted,
							}}
						>
							{mosqueName}
						</p>
					)}
					{!mosqueName && title && (
						<p
							style={{
								marginTop: 12,
								maxWidth: 240,
								fontSize: 20,
								fontWeight: 600,
								textTransform: "uppercase",
								lineHeight: 1.15,
								letterSpacing: "0.12em",
								color: t.textMuted,
							}}
						>
							{title}
						</p>
					)}
				</div>

				{/* Spacer */}
				<div style={{ flex: 1, minHeight: 24 }} />

				{/* Stats grid - 2x2 */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 1,
						overflow: "hidden",
						borderRadius: 16,
						border: `1px solid ${t.gridCellBorder}`,
						backgroundColor: t.gridCellBorder,
					}}
				>
					{stats.map((stat) => (
						<div
							key={stat.label}
							style={{
								backgroundColor: t.cellBg,
								padding: "20px 16px",
							}}
						>
							<p
								style={{
									fontSize: 9,
									textTransform: "uppercase",
									letterSpacing: "0.3em",
									color: t.textDim,
									margin: 0,
								}}
							>
								{stat.label}
							</p>
							<p
								style={{
									marginTop: 8,
									fontSize: 28,
									fontWeight: 700,
									lineHeight: 1,
									letterSpacing: "-0.04em",
									margin: "8px 0 0 0",
								}}
							>
								{stat.value}
							</p>
						</div>
					))}
				</div>

				{/* Bottom highlight bar */}
				<div
					style={{
						marginTop: 12,
						overflow: "hidden",
						borderRadius: 16,
						border: `1px solid ${t.highlightBorder}`,
						backgroundColor: t.highlightBg,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: 12,
							padding: 16,
						}}
					>
						<div style={{ minWidth: 0 }}>
							<p
								style={{
									fontSize: 9,
									textTransform: "uppercase",
									letterSpacing: "0.3em",
									color: t.highlightLabel,
									margin: 0,
								}}
							>
								{highlightLabel}
							</p>
							<p
								style={{
									marginTop: 6,
									fontSize: 26,
									fontWeight: 900,
									textTransform: "uppercase",
									lineHeight: 1,
									letterSpacing: "-0.04em",
									color: t.highlightValue,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									margin: "6px 0 0 0",
								}}
							>
								{highlightValue}
							</p>
						</div>
						<div style={{ flexShrink: 0, textAlign: "right" }}>
							<p
								style={{
									fontSize: 9,
									textTransform: "uppercase",
									letterSpacing: "0.3em",
									color: t.textDim,
									margin: 0,
								}}
							>
								Status
							</p>
							<p
								style={{
									marginTop: 6,
									display: "flex",
									alignItems: "center",
									gap: 4,
									fontSize: 26,
									fontWeight: 700,
									lineHeight: 1,
									color: t.highlightValue,
									margin: "6px 0 0 0",
								}}
							>
								<span style={{ fontSize: 18 }}>&#10003;</span> DONE
							</p>
						</div>
					</div>
					{highlightSecondary && (
						<div
							style={{
								borderTop: `1px solid ${t.highlightDivider}`,
								padding: "10px 16px",
							}}
						>
							<p
								style={{
									textAlign: "right",
									fontSize: 14,
									fontWeight: 500,
									color: t.highlightSecondary,
									margin: 0,
								}}
							>
								{highlightSecondary}
							</p>
						</div>
					)}
				</div>

				{/* Branding footer */}
				<div style={{ marginTop: 12, textAlign: "center" }}>
					<p
						style={{
							fontSize: 9,
							letterSpacing: "0.3em",
							color: t.footer,
							margin: 0,
						}}
					>
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
	theme?: StoryCardTheme;
};

export function TerawihSessionStoryCard(props: TerawihSessionStoryCardProps) {
	return (
		<TerawihStoryCard
			title=""
			mosqueName={props.mosqueName}
			subtitle={getRamadanNightLabel(props.sessionDate, props.ramadanStartDate)}
			highlightLabel="Rakaat"
			highlightValue={`${props.rakaat}`}
			theme={props.theme}
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
	theme?: StoryCardTheme;
};

export function TerawihWrappedStoryCard(props: TerawihWrappedStoryCardProps) {
	return (
		<TerawihStoryCard
			title={`RAMADAN ${props.year} WRAPPED`}
			subtitle="PERFORMANCE SUMMARY"
			highlightLabel="Top Mosque"
			highlightValue={props.topMosque ?? "N/A"}
			theme={props.theme}
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
