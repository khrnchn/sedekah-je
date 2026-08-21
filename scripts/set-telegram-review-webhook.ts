import { env } from "@/env";
import { getTelegramReviewAllowedUpdates } from "@/lib/integrations/telegram/review-bot";

const adminBaseUrl = env.TELEGRAM_ADMIN_BASE_URL ?? process.env.BETTER_AUTH_URL;

if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET || !adminBaseUrl) {
	throw new Error(
		"TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, and TELEGRAM_ADMIN_BASE_URL or BETTER_AUTH_URL are required",
	);
}

const webhookUrl = new URL(
	"/api/integrations/telegram/webhook",
	adminBaseUrl,
).toString();
const response = await fetch(
	`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`,
	{
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			url: webhookUrl,
			secret_token: env.TELEGRAM_WEBHOOK_SECRET,
			allowed_updates: getTelegramReviewAllowedUpdates(),
			drop_pending_updates: false,
		}),
	},
);
const result = (await response.json()) as {
	ok?: boolean;
	description?: string;
};
if (!response.ok || !result.ok) {
	throw new Error(
		`Telegram setWebhook failed (${response.status}): ${result.description ?? "unknown error"}`,
	);
}

console.log(`Telegram review webhook configured at ${webhookUrl}`);
