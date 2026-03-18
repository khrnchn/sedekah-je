import { formatDateBM, toDateString } from "@/lib/ramadhan";

export const TERAWIH_RAKAAT_PRESETS = ["8", "20", "custom"] as const;

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit",
	hour12: true,
});

export function parseTimeToMinutes(time: string): number {
	const [hours, minutes] = time.split(":").map(Number);

	if (
		!Number.isInteger(hours) ||
		!Number.isInteger(minutes) ||
		hours < 0 ||
		hours > 23 ||
		minutes < 0 ||
		minutes > 59
	) {
		throw new Error("Invalid time format");
	}

	return hours * 60 + minutes;
}

export function calculateDurationMinutes(
	startTime: string,
	endTime: string,
): number {
	return parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
}

export function calculateAverageMpr(
	durationMinutes: number,
	rakaat: number,
): number {
	if (durationMinutes <= 0 || rakaat <= 0) {
		throw new Error("Duration and rakaat must be positive");
	}

	return Number((durationMinutes / rakaat).toFixed(2));
}

export function formatTimeForCard(time: string): string {
	const [hours, minutes] = time.split(":").map(Number);
	const date = new Date(2000, 0, 1, hours, minutes);
	return TIME_FORMATTER.format(date).replace(":", ".");
}

export function formatDurationForCard(durationMinutes: number): string {
	const hours = Math.floor(durationMinutes / 60);
	const minutes = durationMinutes % 60;

	if (hours === 0) {
		return `${minutes}m`;
	}

	if (minutes === 0) {
		return `${hours}h`;
	}

	return `${hours}h ${minutes}m`;
}

export function formatAverageMprForCard(averageMpr: number): string {
	return Number.isInteger(averageMpr)
		? `${averageMpr}`
		: averageMpr.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatSessionDateLabel(sessionDate: string): string {
	return formatDateBM(sessionDate);
}

export function getRamadanNightLabel(
	sessionDate: string,
	ramadanStartDate?: string | null,
): string {
	if (!ramadanStartDate) {
		return formatSessionDateLabel(sessionDate).toUpperCase();
	}

	const start = new Date(`${ramadanStartDate}T00:00:00`);
	const current = new Date(`${sessionDate}T00:00:00`);
	const diffMs = current.getTime() - start.getTime();
	const dayNumber = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;

	if (dayNumber < 1 || dayNumber > 30) {
		return formatSessionDateLabel(sessionDate).toUpperCase();
	}

	return `MALAM ${dayNumber} RAMADAN`;
}

export function getTodayDateStringInTimezone(
	timeZone = "Asia/Kuala_Lumpur",
	date = new Date(),
): string {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	const parts = formatter.formatToParts(date);
	const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
	const month = Number(parts.find((part) => part.type === "month")?.value ?? 1);
	const day = Number(parts.find((part) => part.type === "day")?.value ?? 1);

	return toDateString(new Date(year, month - 1, day));
}

type WrappedSessionLike = {
	sessionDate: string;
	durationMinutes: number;
	rakaat: number;
	averageMpr: number;
	mosqueName: string;
};

export type TerawihWrappedSummary = {
	totalNights: number;
	totalMinutes: number;
	totalRakaat: number;
	averageMpr: number;
	longestSessionMinutes: number;
	bestStreak: number;
	topMosque: string | null;
	uniqueMosques: number;
};

export function buildWrappedSummary(
	sessions: WrappedSessionLike[],
): TerawihWrappedSummary {
	if (sessions.length === 0) {
		return {
			totalNights: 0,
			totalMinutes: 0,
			totalRakaat: 0,
			averageMpr: 0,
			longestSessionMinutes: 0,
			bestStreak: 0,
			topMosque: null,
			uniqueMosques: 0,
		};
	}

	const sorted = [...sessions].sort((a, b) =>
		a.sessionDate.localeCompare(b.sessionDate),
	);
	const totalMinutes = sorted.reduce(
		(total, session) => total + session.durationMinutes,
		0,
	);
	const totalRakaat = sorted.reduce(
		(total, session) => total + session.rakaat,
		0,
	);
	const averageMpr = Number((totalMinutes / totalRakaat).toFixed(2));
	const longestSessionMinutes = sorted.reduce(
		(longest, session) => Math.max(longest, session.durationMinutes),
		0,
	);

	const mosqueCounts = new Map<string, number>();
	for (const session of sorted) {
		mosqueCounts.set(
			session.mosqueName,
			(mosqueCounts.get(session.mosqueName) ?? 0) + 1,
		);
	}

	const topMosque =
		[...mosqueCounts.entries()].sort((a, b) => {
			if (b[1] !== a[1]) return b[1] - a[1];
			return a[0].localeCompare(b[0]);
		})[0]?.[0] ?? null;

	return {
		totalNights: sorted.length,
		totalMinutes,
		totalRakaat,
		averageMpr,
		longestSessionMinutes,
		bestStreak: calculateBestStreak(
			sorted.map((session) => session.sessionDate),
		),
		topMosque,
		uniqueMosques: mosqueCounts.size,
	};
}

export function calculateBestStreak(sessionDates: string[]): number {
	if (sessionDates.length === 0) return 0;

	const uniqueSortedDates = [...new Set(sessionDates)].sort();
	let best = 1;
	let current = 1;

	for (let index = 1; index < uniqueSortedDates.length; index++) {
		const previous = new Date(`${uniqueSortedDates[index - 1]}T00:00:00`);
		const next = new Date(`${uniqueSortedDates[index]}T00:00:00`);
		const diffDays = Math.round(
			(next.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000),
		);

		if (diffDays === 1) {
			current += 1;
			best = Math.max(best, current);
			continue;
		}

		current = 1;
	}

	return best;
}
