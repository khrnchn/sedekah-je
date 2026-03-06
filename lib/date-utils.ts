import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const MALAYSIA_TIMEZONE = "Asia/Kuala_Lumpur";

export function formatDate(
	date: Date | string | null,
	formatStr: string,
): string {
	if (!date) return "-";
	const zonedDate = toZonedTime(new Date(date), MALAYSIA_TIMEZONE);
	return format(zonedDate, formatStr);
}

export function formatDateTime(date: Date | string | null): string {
	return formatDate(date, "d MMM yyyy h:mm a");
}

export function formatDateOnly(date: Date | string | null): string {
	return formatDate(date, "d MMM yyyy");
}

export function formatTime(date: Date | string | null): string {
	return formatDate(date, "h:mm a");
}

export function formatFullDate(date: Date | string | null): string {
	return formatDate(date, "d MMMM yyyy");
}

export function formatFullDateTime(date: Date | string | null): string {
	return formatDate(date, "d MMMM yyyy h:mm a");
}
