import assert from "node:assert/strict";
import { test } from "node:test";
import {
	directionsUrl,
	parseQuestParams,
	questPath,
} from "@/app/quest/_lib/url-state";

test("parseQuestParams keeps a valid view and a known mosque id", () => {
	assert.deepEqual(
		parseQuestParams({ view: "board", m: "41" }, new Set([41])),
		{
			view: "board",
			selectedId: 41,
		},
	);
});

test("parseQuestParams drops a mosque id that is not in the list", () => {
	assert.deepEqual(parseQuestParams({ m: "99" }, new Set([41])), {
		view: "map",
		selectedId: null,
	});
});

test("parseQuestParams falls back to map and no selection on junk input", () => {
	assert.deepEqual(parseQuestParams({ view: "x", m: "abc" }, new Set([41])), {
		view: "map",
		selectedId: null,
	});
});

test("directionsUrl uses coordinates when present", () => {
	const url = directionsUrl({
		name: "Masjid Al-Ikhlas",
		address: "SS 3",
		coords: [3.1, 101.5],
	});
	assert.equal(
		url,
		"https://www.google.com/maps/search/?api=1&query=3.1%2C101.5",
	);
});

test("directionsUrl falls back to the encoded name and address", () => {
	const url = directionsUrl({
		name: "Masjid Al-Ikhlas",
		address: "SS 3, Petaling Jaya",
		coords: null,
	});
	assert.ok(url.startsWith("https://www.google.com/maps/search/?api=1&query="));
	assert.ok(
		url.includes(encodeURIComponent("Masjid Al-Ikhlas, SS 3, Petaling Jaya")),
	);
});

test("questPath scopes the URL to the district and omits the default view", () => {
	assert.equal(questPath("petaling", "map", null), "/quest/petaling");
	assert.equal(questPath("klang", "map", 7), "/quest/klang?m=7");
	assert.equal(
		questPath("hulu-langat", "grid", 12),
		"/quest/hulu-langat?view=grid&m=12",
	);
	assert.equal(questPath("sepang", "board", null), "/quest/sepang?view=board");
});
