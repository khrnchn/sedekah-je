import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkReadiness } from "@/lib/health";

describe("readiness check", () => {
	test("reports ready after the database responds", async () => {
		let calls = 0;
		const result = await checkReadiness(async () => {
			calls += 1;
		});

		assert.deepEqual(result, { status: "ok" });
		assert.equal(calls, 1);
	});

	test("reports unavailable without leaking a database failure", async () => {
		const result = await checkReadiness(async () => {
			throw new Error("postgresql://user:password@private-host/database");
		});

		assert.deepEqual(result, { status: "unavailable" });
		assert.equal(JSON.stringify(result).includes("password"), false);
	});
});
