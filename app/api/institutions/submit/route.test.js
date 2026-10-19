import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("submission route duplicate responses and side effects", () => {
	// Module mocks stay in the child process, away from the rest of the suite.
	const result = spawnSync(
		process.execPath,
		["run", `${import.meta.dir}/__fixtures__/duplicate-responses.js`],
		{ cwd: process.cwd(), encoding: "utf8", timeout: 30_000 },
	);
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
