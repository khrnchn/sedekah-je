import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { approvalSendError, approvalSendResponse } from "./approval-result";
import { canRetryApprovalEmail } from "./approval-status";

describe("approval email provider outcomes", () => {
	test("acceptance needs the provider message ID", () => {
		assert.deepEqual(
			approvalSendResponse({
				statusCode: 202,
				headers: { "x-message-id": "msg-123" },
			}),
			{ ok: true, messageId: "msg-123" },
		);
		assertFields(approvalSendResponse({ statusCode: 202, headers: {} }), {
			ok: false,
			certainty: "unknown",
		});
	});
	test("structured SDK sandbox rejection remains actionable without recipient PII", () => {
		const result = approvalSendError({
			statusCode: 422,
			body: {
				message: "Sandbox account unique recipients limit. #MS42225",
				errors: { to: ["private@example.test"] },
			},
		});
		assertFields(result, { ok: false, certainty: "rejected" });
		assert.ok(JSON.stringify(result)?.includes("MS42225"));
		assert.ok(!JSON.stringify(result).includes("private@example.test"));
	});
	test("suppressed recipients are not accepted emails", () => {
		assertFields(
			approvalSendResponse({
				statusCode: 202,
				headers: {},
				body: { warnings: [{ type: "ALL_SUPPRESSED" }] },
			}),
			{ ok: false, certainty: "rejected" },
		);
	});
	test("timeouts and server errors must not invite duplicate sends", () => {
		for (const error of [
			new Error("timeout"),
			{ statusCode: 500 },
			{ statusCode: 408 },
		])
			assertFields(approvalSendError(error), {
				ok: false,
				certainty: "unknown",
			});
	});
	test("only known failures and unclaimed pending emails are retryable", () => {
		for (const status of [
			"accepted",
			"delivered",
			"bounced",
			"unknown",
			"sending",
			null,
		] as const)
			assert.equal(canRetryApprovalEmail(status), false);
		assert.equal(canRetryApprovalEmail("failed"), true);
		assert.equal(canRetryApprovalEmail("pending"), true);
	});
});

function assertFields(actual: object, expected: object) {
	for (const [key, value] of Object.entries(expected))
		assert.deepEqual(Reflect.get(actual, key), value);
}
