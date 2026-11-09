import type { QuestMosqueView } from "@/app/quest/_lib/types";
import type { QuestStatus } from "@/lib/features/quest/rules";

const STATUS_ORDER: Record<QuestStatus, number> = {
	missing: 0,
	in_review: 1,
	has_qr: 2,
};

function haversineKm(a: [number, number], b: [number, number]) {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b[0] - a[0]);
	const dLon = toRad(b[1] - a[1]);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function filterAndSortMosques(
	mosques: QuestMosqueView[],
	opts: {
		query: string;
		status: QuestStatus | "all" | "unmapped";
		sort: "az" | "nearest";
		origin: [number, number] | null;
	},
): QuestMosqueView[] {
	const query = opts.query.trim().toLowerCase();
	const filtered = mosques.filter((m) => {
		if (opts.status === "unmapped" && m.coords !== null) return false;
		if (
			opts.status !== "all" &&
			opts.status !== "unmapped" &&
			m.status !== opts.status
		)
			return false;
		if (!query) return true;
		return (
			m.name.toLowerCase().includes(query) ||
			(m.address ?? "").toLowerCase().includes(query)
		);
	});

	const byStatusThenName = (a: QuestMosqueView, b: QuestMosqueView) =>
		STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
		a.name.localeCompare(b.name);

	const origin = opts.origin;
	if (opts.sort === "nearest" && origin) {
		const distance = (m: QuestMosqueView) =>
			m.coords ? haversineKm(origin, m.coords) : Number.POSITIVE_INFINITY;
		return filtered.sort(
			(a, b) =>
				(distance(a) === distance(b) ? 0 : distance(a) - distance(b)) ||
				a.name.localeCompare(b.name),
		);
	}
	return filtered.sort(byStatusThenName);
}
