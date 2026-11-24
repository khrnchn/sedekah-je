import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import {
	MAILERSEND_TEST_SECRET,
	parseMailerSendEvent,
	verifyMailerSendSignature,
} from "./approval-webhook";

test("signatures authenticate the exact raw body and reject malformed headers", () => {
	const body = JSON.stringify({
		type: "activity.delivered",
		created_at: "2026-11-24T00:00:00Z",
		data: { message_id: "msg-123" },
	});
	const signature = createHmac("sha256", "private-test-secret")
		.update(body)
		.digest("hex");
	assert.equal(
		verifyMailerSendSignature(body, signature, "private-test-secret"),
		true,
	);
	assert.equal(
		verifyMailerSendSignature(`${body} `, signature, "private-test-secret"),
		false,
	);
	for (const invalid of [null, "bad", "g".repeat(64), signature.slice(1)])
		assert.equal(
			verifyMailerSendSignature(body, invalid, "private-test-secret"),
			false,
		);
	assert.equal(
		verifyMailerSendSignature(body, signature, MAILERSEND_TEST_SECRET),
		false,
	);
	assert.equal(parseMailerSendEvent(body)?.data?.message_id, "msg-123");
});

test("invalid payloads cannot turn into delivery evidence", () => {
	for (const body of [
		"{",
		"null",
		'{"type":"activity.delivered"}',
		'{"type":"activity.delivered","created_at":"bad"}',
	])
		assert.equal(parseMailerSendEvent(body), null);
});
