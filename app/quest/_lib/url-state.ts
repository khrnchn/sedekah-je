import type { QuestMosqueView } from "./types";

export type QuestView = "map" | "board" | "grid";

export const LAST_DISTRICT_KEY = "quest:last-district";

export const VIEWS: readonly QuestView[] = ["map", "board", "grid"];

export function parseQuestParams(
	params: { view?: string; m?: string },
	ids: Set<number>,
): { view: QuestView; selectedId: number | null } {
	const view = VIEWS.find((v) => v === params.view) ?? "map";
	const id = params.m && /^\d+$/.test(params.m) ? Number(params.m) : null;
	return { view, selectedId: id !== null && ids.has(id) ? id : null };
}

// view=map is the default, so the URL omits it.
export function questPath(
	districtSlug: string,
	view: QuestView,
	selectedId: number | null,
): string {
	const params = new URLSearchParams();
	if (view !== "map") params.set("view", view);
	if (selectedId !== null) params.set("m", String(selectedId));
	const query = params.toString();
	return `/quest/${districtSlug}${query ? `?${query}` : ""}`;
}

export function directionsUrl(
	m: Pick<QuestMosqueView, "name" | "address" | "coords">,
): string {
	const query = m.coords
		? `${m.coords[0]},${m.coords[1]}`
		: [m.name, m.address].filter(Boolean).join(", ");
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
