import assert from "node:assert/strict";
import { test } from "node:test";
import { clusterMapPoints } from "./map-clusters";

const project = ([x, y]: [number, number]) => ({ x, y });

test("overlapping marker targets form a single selectable group", () => {
	const groups = clusterMapPoints(
		[
			{ id: 1, coords: [0, 0] },
			{ id: 2, coords: [30, 0] },
			{ id: 3, coords: [10, 20] },
		],
		project,
	);
	assert.equal(groups.length, 1);
	assert.deepEqual(
		groups[0].points.map((p) => p.id),
		[1, 2, 3],
	);
});

test("a line of neighbours does not chain into one district-wide group", () => {
	const line = Array.from({ length: 10 }, (_, i) => ({
		id: i,
		coords: [i * 30, 0] as [number, number],
	}));
	const groups = clusterMapPoints(line, project);
	assert.ok(
		groups.length >= 4,
		`expected separate groups, got ${groups.length}`,
	);
	for (const group of groups) {
		const xs = group.points.map((p) => p.coords[0]);
		assert.ok(Math.max(...xs) - Math.min(...xs) <= 54 * 2);
	}
});

test("zooming in separates nearby mosques back into individual markers", () => {
	const points = [
		{ id: 1, coords: [0, 0] as [number, number] },
		{ id: 2, coords: [30, 0] as [number, number] },
	];
	assert.equal(clusterMapPoints(points, project).length, 1);
	assert.equal(
		clusterMapPoints(points, ([x, y]) => ({ x: x * 4, y: y * 4 })).length,
		2,
	);
});

test("unmapped mosques do not create fake map locations", () => {
	assert.deepEqual(clusterMapPoints([{ id: 1, coords: null }], project), []);
});
