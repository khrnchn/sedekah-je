export const categories = [
	"masjid",
	"surau",
	"tahfiz",
	"kebajikan",
	"lain-lain",
] as const;

export const states = [
	"Johor",
	"Kedah",
	"Kelantan",
	"Melaka",
	"Negeri Sembilan",
	"Pahang",
	"Perak",
	"Perlis",
	"Pulau Pinang",
	"Sabah",
	"Sarawak",
	"Selangor",
	"Terengganu",
	"W.P. Kuala Lumpur",
	"W.P. Labuan",
	"W.P. Putrajaya",
] as const;

export const supportedPayments = ["duitnow", "tng", "boost"] as const;

export const institutionStatuses = ["pending", "approved", "rejected"] as const;

export const INSTITUTION_STATUSES = {
	PENDING: "pending",
	APPROVED: "approved",
	REJECTED: "rejected",
} as const;
