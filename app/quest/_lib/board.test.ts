import assert from "node:assert/strict";
import { test } from "node:test";
import { filterAndSortMosques } from "@/app/quest/_lib/board";
import type { QuestMosqueView } from "@/app/quest/_lib/types";

const make = (
	id: number,
	name: string,
	status: QuestMosqueView["status"],
	coords: [number, number] | null,
	address: string | null = null,
): QuestMosqueView => ({
	id,
	name,
	address,
	coords,
	status,
	pendingAttempts: 0,
	institutionSlug: null,
	institutionCategory: null,
	qrContent: null,
	supportedPayment: null,
	contributorName: null,
});

const mosques = [
	make(1, "Masjid Zahir", "has_qr", [6.12, 100.37], "Alor Setar, Kedah"),
	make(2, "Masjid Besar", "missing", [3.14, 101.69], "Kuala Lumpur"),
	make(3, "Masjid Amir", "in_review", null, "Shah Alam"),
	make(4, "Masjid Aman", "missing", [5.41, 100.33], "George Town"),
];
const base = { query: "", status: "all", sort: "az", origin: null } as const;
const names = (list: QuestMosqueView[]) => list.map((m) => m.name);

test("default order is missing, in review, has QR, then name", () => {
	assert.deepEqual(names(filterAndSortMosques(mosques, base)), [
		"Masjid Aman",
		"Masjid Besar",
		"Masjid Amir",
		"Masjid Zahir",
	]);
});

test("query matches name or address case-insensitively", () => {
	assert.deepEqual(
		names(filterAndSortMosques(mosques, { ...base, query: "ZAHIR" })),
		["Masjid Zahir"],
	);
	assert.deepEqual(
		names(filterAndSortMosques(mosques, { ...base, query: "shah alam" })),
		["Masjid Amir"],
	);
});

test("unmapped status returns only mosques without coords", () => {
	assert.deepEqual(
		names(filterAndSortMosques(mosques, { ...base, status: "unmapped" })),
		["Masjid Amir"],
	);
});

test("nearest orders by distance and puts unmapped last", () => {
	const result = filterAndSortMosques(mosques, {
		...base,
		sort: "nearest",
		origin: [3.0, 101.5],
	});
	assert.deepEqual(names(result), [
		"Masjid Besar",
		"Masjid Aman",
		"Masjid Zahir",
		"Masjid Amir",
	]);
});

test("nearest without origin falls back to A to Z", () => {
	const result = filterAndSortMosques(mosques, {
		...base,
		sort: "nearest",
		origin: null,
	});
	assert.deepEqual(names(result), [
		"Masjid Aman",
		"Masjid Besar",
		"Masjid Amir",
		"Masjid Zahir",
	]);
});
