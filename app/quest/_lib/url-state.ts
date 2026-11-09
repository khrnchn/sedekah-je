import type { QuestMosqueView } from "./types";

export type QuestView = "map" | "board" | "grid";

const VIEWS: readonly QuestView[] = ["map", "board", "grid"];

export function parseQuestParams(
	params: { view?: string; m?: string },
	ids: Set<number>,
): { view: QuestView; selectedId: number | null } {
	const view = VIEWS.find((v) => v === params.view) ?? "map";
	const id = params.m && /^\d+$/.test(params.m) ? Number(params.m) : null;
	return { view, selectedId: id !== null && ids.has(id) ? id : null };
}

export function directionsUrl(
	m: Pick<QuestMosqueView, "name" | "address" | "coords">,
): string {
	const query = m.coords
		? `${m.coords[0]},${m.coords[1]}`
		: [m.name, m.address].filter(Boolean).join(", ");
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
