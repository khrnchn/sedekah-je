import type { DriveStep } from "driver.js";

export const TOUR_ROUTES = [
	"/contribute",
	"/my-contributions",
	"/leaderboard",
] as const;

export type TourRoute = (typeof TOUR_ROUTES)[number];

const STEP_COPY: Record<TourRoute, { title: string; description: string }[]> = {
	"/contribute": [
		{
			title: "Menu navigasi",
			description:
				"Gunakan menu ini untuk navigasi ke halaman lain seperti sumbangan, carta penyumbang, dan lain-lain.",
		},
		{
			title: "Lokasi semasa",
			description:
				"Gunakan lokasi semasa anda untuk mengisi maklumat institusi dengan lebih pantas.",
		},
		{
			title: "Upload QR",
			description:
				"Muat naik gambar kod QR institusi untuk diekstrak secara automatik.",
		},
		{
			title: "Hantar sumbangan",
			description:
				"Klik butang hantar selepas mengisi semua maklumat yang diperlukan.",
		},
	],
	"/my-contributions": [
		{
			title: "Kad statistik",
			description:
				"Lihat ringkasan sumbangan anda: jumlah, diluluskan, menunggu, dan ditolak.",
		},
		{
			title: "Tab status",
			description:
				"Tapis sumbangan mengikut status: semua, diluluskan, menunggu, atau ditolak.",
		},
		{
			title: "Cara edit item ditolak",
			description:
				"Klik ikon pensil pada item ditolak untuk mengemaskini dan hantar semula.",
		},
	],
	"/leaderboard": [
		{
			title: "Statistik komuniti",
			description:
				"Lihat statistik keseluruhan komuniti penyumbang sedekah.je.",
		},
		{
			title: "Top 5 penyumbang",
			description: "Lihat 5 penyumbang teratas dalam komuniti.",
		},
		{
			title: "Teruskan menyumbang",
			description:
				"Setiap sumbangan anda membantu komuniti. Teruskan berkongsi QR masjid dan surau untuk memudahkan sedekah digital. Jazakallahu khair!",
		},
	],
};

/** Primary selector per step; step 2 of my-contributions has fallback. */
const STEP_SELECTORS: Record<
	TourRoute,
	(string | undefined | [primary: string, fallback: string])[]
> = {
	"/contribute": [
		["[data-tour='nav-menu']", "[data-tour='nav-desktop']"],
		"[data-tour='contribute-location']",
		"[data-tour='contribute-qr-upload']",
		"[data-tour='contribute-submit']",
	],
	"/my-contributions": [
		"[data-tour='mycontrib-stats']",
		"[data-tour='mycontrib-status-tabs']",
		[
			"[data-tour='mycontrib-edit-rejected']",
			"[data-tour='mycontrib-tab-rejected']",
		],
	],
	"/leaderboard": [
		"[data-tour='leaderboard-stats']",
		"[data-tour='leaderboard-top5']",
		undefined,
	],
};

function resolveSelector(
	route: TourRoute,
	stepIndex: number,
	useFallback = false,
): string | undefined {
	const sel = STEP_SELECTORS[route][stepIndex];
	if (Array.isArray(sel)) return useFallback ? sel[1] : sel[0];
	return sel;
}

export function buildStepsForRoute(
	route: TourRoute,
	fromStepIndex: number,
): DriveStep[] {
	const copy = STEP_COPY[route];
	const steps: DriveStep[] = [];

	for (let i = fromStepIndex; i < copy.length; i++) {
		const primary = resolveSelector(route, i, false);
		const fallback = getFallbackSelector(route, i);
		const { title, description } = copy[i];

		const step: DriveStep = {
			popover: {
				title,
				description,
				side: "bottom",
				align: "center",
			},
		};

		if (primary && fallback) {
			step.element = () => {
				const el = document.querySelector(primary);
				if (el) return el as HTMLElement;
				const fb = document.querySelector(fallback);
				return (fb ?? document.body) as HTMLElement;
			};
		} else if (primary) {
			step.element = primary;
		}
		steps.push(step);
	}

	return steps;
}

/** Get fallback selector for my-contributions step 2 when no rejected items. */
export function getFallbackSelector(
	route: TourRoute,
	stepIndex: number,
): string | undefined {
	const sel = STEP_SELECTORS[route][stepIndex];
	if (Array.isArray(sel)) return sel[1];
	return undefined;
}

export { STEP_COPY, STEP_SELECTORS };
