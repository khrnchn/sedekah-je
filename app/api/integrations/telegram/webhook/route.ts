import { NextResponse } from "next/server";
import type { TelegramUpdate } from "@/lib/integrations/telegram/bot-api";
import {
	getTelegramReviewWebhookSecret,
	handleTelegramReviewUpdate,
} from "@/lib/integrations/telegram/review-bot";
import { telegramSecretsMatch } from "@/lib/integrations/telegram/review-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const secret = getTelegramReviewWebhookSecret();
	if (!secret) {
		return NextResponse.json(
			{ error: "Telegram review bot is not configured" },
			{ status: 503 },
		);
	}
	if (
		!telegramSecretsMatch(
			request.headers.get("x-telegram-bot-api-secret-token"),
			secret,
		)
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let update: TelegramUpdate;
	try {
		update = (await request.json()) as TelegramUpdate;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	try {
		await handleTelegramReviewUpdate(update);
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[telegram review] update failed", error);
		return NextResponse.json(
			{ error: "Telegram update failed" },
			{ status: 500 },
		);
	}
}
