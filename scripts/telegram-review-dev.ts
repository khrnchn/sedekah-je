import { env } from "@/env";
import { createTelegramBotClient } from "@/lib/integrations/telegram/bot-api";
import { handleTelegramReviewUpdate } from "@/lib/integrations/telegram/review-bot";

if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
	throw new Error(
		"TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required for Telegram review development",
	);
}

const client = createTelegramBotClient(env.TELEGRAM_BOT_TOKEN, {
	allowedImageOrigins: [new URL(env.R2_PUBLIC_URL).origin],
});
let running = true;
let offset: number | undefined;

process.on("SIGINT", () => {
	running = false;
});
process.on("SIGTERM", () => {
	running = false;
});

console.log("Telegram institution review bot is polling for private updates.");

while (running) {
	try {
		const updates = await client.getUpdates({ offset, timeout: 25 });
		for (const update of updates) {
			try {
				await handleTelegramReviewUpdate(update);
			} catch (error) {
				console.error(
					`Telegram update ${update.update_id} failed`,
					error instanceof Error ? error.message : "Unknown error",
				);
			}
			offset = update.update_id + 1;
		}
	} catch (error) {
		console.error(
			"Telegram polling failed",
			error instanceof Error ? error.message : "Unknown error",
		);
		await new Promise((resolve) => setTimeout(resolve, 2_000));
	}
}

console.log("Telegram institution review bot stopped.");
