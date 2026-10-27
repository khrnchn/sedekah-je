import type { TelegramBotClient, TelegramMessage } from "./bot-api";

const MAX_MESSAGE_LENGTH = 4096;
type PlainTextMessage = Omit<
	Parameters<TelegramBotClient["sendMessage"]>[0],
	"parseMode"
>;

/** Preserve all plain text and return the final message for operation binding. */
export async function sendReviewText(
	client: Pick<TelegramBotClient, "sendMessage">,
	input: PlainTextMessage,
): Promise<TelegramMessage> {
	if (!input.text) throw new Error("Review message cannot be empty");
	let offset = 0;
	let sent: TelegramMessage;
	do {
		let end = Math.min(offset + MAX_MESSAGE_LENGTH, input.text.length);
		if (end < input.text.length) {
			// Keep surrogate pairs intact; UTF-16 length is a conservative bound.
			const last = input.text.charCodeAt(end - 1);
			if (last >= 0xd800 && last <= 0xdbff) end--;
			const newline = input.text.lastIndexOf("\n", end - 1);
			if (newline >= offset + MAX_MESSAGE_LENGTH / 2) end = newline + 1;
		}
		const final = end === input.text.length;
		sent = await client.sendMessage({
			...input,
			text: input.text.slice(offset, end),
			replyMarkup: final ? input.replyMarkup : undefined,
		});
		offset = end;
	} while (offset < input.text.length);
	return sent;
}
