import assert from "node:assert/strict";
import { test } from "node:test";
import { assessmentSchema } from "@/lib/features/institution-review/telegram-evidence";
import type { TelegramBotClient } from "./bot-api";
import { sendReviewText } from "./review-text";

test("long plain text preserves Unicode and binds controls to the final message", async () => {
	const text = `${"a".repeat(4095)}🕌\n${"Location details\n".repeat(400)}`;
	const sent: Array<Parameters<TelegramBotClient["sendMessage"]>[0]> = [];
	const keyboard = {
		inline_keyboard: [[{ text: "Confirm", callback_data: "example" }]],
	};
	const final = await sendReviewText(
		{
			sendMessage: async (input) => {
				sent.push(input);
				assert.ok(input.text.length <= 4096);
				return { message_id: sent.length, chat: { id: 123, type: "private" } };
			},
		},
		{ chatId: "123", text, replyMarkup: keyboard },
	);
	assert.equal(sent.map((message) => message.text).join(""), text);
	assert.equal(
		sent.slice(0, -1).every((message) => !message.replyMarkup),
		true,
	);
	assert.deepEqual(sent.at(-1)?.replyMarkup, keyboard);
	assert.equal(final.message_id, sent.length);
	for (const message of sent) assert.equal(message.text.isWellFormed(), true);
});

test("a maximum-size validated assessment can be delivered without truncation", async () => {
	const assessment = assessmentSchema.parse({
		imageType: "physical_photo",
		visibleInstitution: "I".repeat(500),
		visibleLocation: "L".repeat(500),
		recipientRelationship: "unclear",
		conflicts: Array(8).fill("C".repeat(300)),
		explanation: "E".repeat(800),
	});
	const text = [
		assessment.visibleInstitution,
		assessment.visibleLocation,
		...assessment.conflicts,
		assessment.explanation,
	].join("\n");
	const delivered: string[] = [];
	await sendReviewText(
		{
			sendMessage: async (input) => {
				assert.ok(input.text.length <= 4096);
				delivered.push(input.text);
				return {
					message_id: delivered.length,
					chat: { id: 123, type: "private" },
				};
			},
		},
		{ chatId: "123", text },
	);
	assert.ok(delivered.length > 1);
	assert.equal(delivered.join(""), text);
});
