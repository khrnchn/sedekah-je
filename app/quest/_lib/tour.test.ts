import assert from "node:assert/strict";
import { test } from "node:test";
import { questTour } from "./tour";

const m = (id: number, name: string, coords: [number, number] | null) => ({
	id,
	name,
	coords,
});

test("starts in the west and always steps to the nearest unvisited mosque", () => {
	const order = questTour([
		m(1, "East", [3.0, 101.9]),
		m(2, "West", [3.0, 101.4]),
		m(3, "Middle", [3.0, 101.6]),
		m(4, "Near west", [3.0, 101.45]),
	]);
	assert.deepEqual(order, [2, 4, 3, 1]);
});

test("unmapped mosques follow the mapped ones, A to Z", () => {
	const order = questTour([
		m(1, "Zeta", null),
		m(2, "Alpha", null),
		m(3, "Mapped", [3.0, 101.5]),
	]);
	assert.deepEqual(order, [3, 2, 1]);
});

test("empty input gives an empty tour", () => {
	assert.deepEqual(questTour([]), []);
});
