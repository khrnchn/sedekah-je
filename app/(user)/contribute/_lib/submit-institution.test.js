import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("website submission duplicates preserve privacy and skip side effects", () => {
	const result = spawnSync(
		process.execPath,
		["run", `${import.meta.dir}/__fixtures__/duplicate-responses.js`],
		{ cwd: process.cwd(), encoding: "utf8", timeout: 30_000 },
	);
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
