import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	isAuthorizedTelegramActor,
	telegramSecretsMatch,
} from "@/lib/integrations/telegram/review-security";

describe("Telegram review security", () => {
	test("requires both the configured private chat and Telegram sender", () => {
		assert.equal(isAuthorizedTelegramActor("123", 123, 123), true);
		assert.equal(isAuthorizedTelegramActor("123", 999, 123), false);
		assert.equal(isAuthorizedTelegramActor("123", 123, 999), false);
	});

	test("compares webhook secrets without accepting missing or partial values", () => {
		assert.equal(
			telegramSecretsMatch("a-secure-secret", "a-secure-secret"),
			true,
		);
		assert.equal(telegramSecretsMatch(null, "a-secure-secret"), false);
		assert.equal(telegramSecretsMatch("a-secure", "a-secure-secret"), false);
	});
});
