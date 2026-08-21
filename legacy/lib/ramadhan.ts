/**
 * Ramadan campaign utilities.
 * Uses Asia/Kuala_Lumpur timezone for "today" calculations.
 */
import moment from "moment-hijri";

const TIMEZONE = "Asia/Kuala_Lumpur";

/**
 * Compute Gregorian date for a given Ramadan day.
 * @param startDate - Gregorian date when Ramadan begins in Malaysia
 * @param dayNumber - Day number (1-30)
 * @returns Gregorian date for that Ramadan day
 */
export function getRamadhanDate(startDate: Date, dayNumber: number): Date {
	const result = new Date(startDate);
	result.setDate(result.getDate() + dayNumber - 1);
	return result;
}

/**
 * Format date as YYYY-MM-DD for DB comparison.
 * Uses local date components to avoid UTC shift (e.g. near midnight MYT).
 */
export function toDateString(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

/**
 * Get today's date in Asia/Kuala_Lumpur timezone.
 */
export function getTodayMYT(): Date {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const parts = formatter.formatToParts(new Date());
	const year = Number(parts.find((p) => p.type === "year")?.value ?? 0);
	const month = Number(parts.find((p) => p.type === "month")?.value ?? 1) - 1;
	const day = Number(parts.find((p) => p.type === "day")?.value ?? 1);
	return new Date(year, month, day);
}

/**
 * Get the current Islamic date in MYT.
 * In the Islamic calendar, the new day begins at Maghrib (~7pm).
 * So after 7pm MYT, this returns tomorrow's Gregorian date.
 */
export function getIslamicDateMYT(): Date {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hour12: false,
	});
	const parts = formatter.formatToParts(new Date());
	const year = Number(parts.find((p) => p.type === "year")?.value ?? 0);
	const month = Number(parts.find((p) => p.type === "month")?.value ?? 1) - 1;
	const day = Number(parts.find((p) => p.type === "day")?.value ?? 1);
	const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
	const date = new Date(year, month, day);
	if (hour >= 19) {
		date.setDate(date.getDate() + 1);
	}
	return date;
}

/**
 * Check if today is within the 30-day Ramadan window.
 * @param startDate - Gregorian date when Ramadan begins
 * @returns true if today is between startDate and startDate + 29
 */
export function isWithinRamadhan(startDate: Date): boolean {
	const today = getTodayMYT();
	const start = new Date(startDate);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(end.getDate() + 29);
	end.setHours(23, 59, 59, 999);
	return today >= start && today <= end;
}

/**
 * Get current Ramadan day number (1-30) based on start date.
 * @param startDate - Gregorian date when Ramadan begins
 * @returns Day number 1-30, or null if not within Ramadan
 */
export function getCurrentRamadhanDay(startDate: Date): number | null {
	if (!isWithinRamadhan(startDate)) {
		return null;
	}
	const today = getTodayMYT();
	const start = new Date(startDate);
	start.setHours(0, 0, 0, 0);
	const diffMs = today.getTime() - start.getTime();
	const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
	return Math.min(Math.max(diffDays, 1), 30);
}

type RamadhanWindow = {
	startDate: Date;
	endDate: Date;
};

/**
 * Get the Gregorian Ramadan window for a given Gregorian year in Malaysia.
 * Returns the start and end dates (inclusive) for the Ramadan that falls in that year.
 */
export function getRamadhanWindowForGregorianYear(
	year: number,
): RamadhanWindow | null {
	const candidateHijriYears = [year - 581, year - 580, year - 579];

	for (const hijriYear of candidateHijriYears) {
		const ramadhanStart = moment().iYear(hijriYear).iMonth(8).iDate(1).toDate();

		if (ramadhanStart.getFullYear() !== year) continue;

		const daysInRamadhan = moment.iDaysInMonth(hijriYear, 8);
		const startDate = new Date(
			ramadhanStart.getFullYear(),
			ramadhanStart.getMonth(),
			ramadhanStart.getDate(),
		);
		const endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + daysInRamadhan - 1);

		return { startDate, endDate };
	}

	return null;
}

/**
 * Check if today's MYT date falls within the Ramadan window for the current Gregorian year.
 */
export function isCurrentGregorianYearRamadhanActive(): boolean {
	const today = getTodayMYT();
	const window = getRamadhanWindowForGregorianYear(today.getFullYear());

	if (!window) return false;

	const start = new Date(window.startDate);
	start.setHours(0, 0, 0, 0);

	const end = new Date(window.endDate);
	end.setHours(23, 59, 59, 999);

	return today >= start && today <= end;
}

/**
 * Check if a given date string (YYYY-MM-DD) equals today in MYT.
 */
export function isTodayMYT(dateStr: string): boolean {
	return toDateString(getTodayMYT()) === dateStr;
}

const BM_MONTHS = [
	"Januari",
	"Februari",
	"Mac",
	"April",
	"Mei",
	"Jun",
	"Julai",
	"Ogos",
	"September",
	"Oktober",
	"November",
	"Disember",
];

/**
 * Format a date string (YYYY-MM-DD) for display in Bahasa Malaysia.
 * Example: "2026-03-19" -> "19 Mac 2026"
 */
export function formatDateBM(dateStr: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	const month = BM_MONTHS[(m ?? 1) - 1] ?? "";
	return `${d ?? 0} ${month} ${y ?? 0}`;
}

/**
 * Format a date string (YYYY-MM-DD) without year in Bahasa Malaysia.
 * Example: "2026-03-19" -> "19 Mac"
 */
export function formatDateBMShort(dateStr: string): string {
	const [, m, d] = dateStr.split("-").map(Number);
	const month = BM_MONTHS[(m ?? 1) - 1] ?? "";
	return `${d ?? 0} ${month}`;
}

/**
 * Format a date string (YYYY-MM-DD) for display in English.
 * Example: "2026-03-19" -> "19 March 2026"
 */
export function formatDateEn(dateStr: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
	if (Number.isNaN(date.getTime())) return dateStr;
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(date);
}

/**
 * Format a date string (YYYY-MM-DD) without year in English.
 * Example: "2026-03-19" -> "19 Mar"
 */
export function formatDateEnShort(dateStr: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
	if (Number.isNaN(date.getTime())) return dateStr;
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
	}).format(date);
}
