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

	test("reports unavailable when starting the database check throws", async () => {
		const result = await checkReadiness(() => {
			throw new Error("database client is not initialized");
		});

		assert.deepEqual(result, { status: "unavailable" });
	});

	test("cancels a database query that exceeds the readiness deadline", async () => {
		let cancellations = 0;
		const pending = new Promise<never>(() => undefined) as Promise<never> & {
			cancel: () => void;
		};
		pending.cancel = () => {
			cancellations += 1;
		};

		const result = await checkReadiness(() => pending, 10);

		assert.deepEqual(result, { status: "unavailable" });
		assert.equal(cancellations, 1);
	});

	test("still returns when the database cancellation hook throws", async () => {
		const pending = new Promise<never>(() => undefined) as Promise<never> & {
			cancel: () => void;
		};
		pending.cancel = () => {
			throw new Error("cancel failed");
		};

		const result = await checkReadiness(() => pending, 10);

		assert.deepEqual(result, { status: "unavailable" });
	});
});
