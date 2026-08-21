import assert from "node:assert/strict";
import { test } from "node:test";
import { createTelegramBotClient } from "./bot-api";

test("Telegram photo delivery rejects untrusted image origins before fetching", async () => {
	const client = createTelegramBotClient("000000:fake-token", {
		allowedImageOrigins: ["https://uploads.example.test"],
	});

	await assert.rejects(
		client.sendPhoto({
			chatId: "123",
			imageUrl: "https://untrusted.example.test/private-resource",
			caption: "Review",
			replyMarkup: { inline_keyboard: [] },
		}),
		/allowed origin/,
	);
});
