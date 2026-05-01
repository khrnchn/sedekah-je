const TIMEZONE = "Asia/Kuala_Lumpur";
const FRIDAY_DAY = 5;
const ROLLOVER_HOUR = 19;

type MYTDateParts = {
	year: number;
	month: number;
	day: number;
	hour: number;
};

function getMYTDateParts(now: Date): MYTDateParts {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hour12: false,
	});
	const parts = formatter.formatToParts(now);
	return {
		year: Number(parts.find((p) => p.type === "year")?.value ?? 0),
		month: Number(parts.find((p) => p.type === "month")?.value ?? 1) - 1,
		day: Number(parts.find((p) => p.type === "day")?.value ?? 1),
		hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
	};
}

export function toFridayCampaignDateString(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function getFridayCampaignDateMYT(now = new Date()): Date | null {
	const parts = getMYTDateParts(now);
	const campaignDate = new Date(parts.year, parts.month, parts.day);

	if (parts.hour >= ROLLOVER_HOUR) {
		campaignDate.setDate(campaignDate.getDate() + 1);
	}

	if (campaignDate.getDay() !== FRIDAY_DAY) {
		return null;
	}

	return campaignDate;
}

export function getFridayCampaignDateStringMYT(now = new Date()) {
	const campaignDate = getFridayCampaignDateMYT(now);
	return campaignDate ? toFridayCampaignDateString(campaignDate) : null;
}

export function isFridayCampaignWindowActiveMYT(now = new Date()) {
	return getFridayCampaignDateMYT(now) !== null;
}
