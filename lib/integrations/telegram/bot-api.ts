import type { TelegramInlineKeyboard } from "@/lib/integrations/telegram/review-ui";

export type TelegramChat = {
	id: number;
	type: string;
};

export type TelegramUser = {
	id: number;
	is_bot?: boolean;
	first_name?: string;
	username?: string;
};

export type TelegramMessage = {
	message_id: number;
	chat: TelegramChat;
	from?: TelegramUser;
	text?: string;
	caption?: string;
	photo?: unknown[];
	reply_to_message?: TelegramMessage;
};

export type TelegramCallbackQuery = {
	id: string;
	from: TelegramUser;
	data?: string;
	message?: TelegramMessage;
};

export type TelegramUpdate = {
	update_id: number;
	message?: TelegramMessage;
	callback_query?: TelegramCallbackQuery;
};

export type TelegramReplyKeyboard = {
	keyboard: readonly (readonly string[])[];
	resize_keyboard?: boolean;
	is_persistent?: boolean;
	input_field_placeholder?: string;
};

export type TelegramForceReply = {
	force_reply: true;
	selective?: boolean;
	input_field_placeholder?: string;
};

type TelegramReplyMarkup =
	| TelegramInlineKeyboard
	| TelegramReplyKeyboard
	| TelegramForceReply;

type TelegramApiResponse<T> = {
	ok: boolean;
	result?: T;
	description?: string;
	error_code?: number;
};

export type TelegramBotClient = ReturnType<typeof createTelegramBotClient>;

export function createTelegramBotClient(
	botToken: string,
	options: { allowedImageOrigins?: readonly string[] } = {},
) {
	const baseUrl = `https://api.telegram.org/bot${botToken}`;

	async function request<T>(
		method: string,
		body: Record<string, unknown>,
		timeoutMs = 15_000,
	): Promise<T> {
		const response = await fetch(`${baseUrl}/${method}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(timeoutMs),
		});
		const payload = (await response.json()) as TelegramApiResponse<T>;
		if (!response.ok || !payload.ok || payload.result === undefined) {
			throw new Error(
				`Telegram ${method} failed (${payload.error_code ?? response.status}): ${payload.description ?? "unknown error"}`,
			);
		}
		return payload.result;
	}

	return {
		getUpdates(input: { offset?: number; timeout?: number } = {}) {
			const timeout = input.timeout ?? 25;
			return request<TelegramUpdate[]>(
				"getUpdates",
				{
					...(input.offset ? { offset: input.offset } : {}),
					timeout,
					allowed_updates: ["message", "callback_query"],
				},
				(timeout + 5) * 1_000,
			);
		},

		async sendMessage(input: {
			chatId: string | number;
			text: string;
			parseMode?: "HTML";
			replyMarkup?: TelegramReplyMarkup;
			replyToMessageId?: number;
		}): Promise<TelegramMessage> {
			return request<TelegramMessage>("sendMessage", {
				chat_id: input.chatId,
				text: input.text,
				...(input.parseMode ? { parse_mode: input.parseMode } : {}),
				...(input.replyMarkup ? { reply_markup: input.replyMarkup } : {}),
				...(input.replyToMessageId
					? {
							reply_parameters: {
								message_id: input.replyToMessageId,
								allow_sending_without_reply: true,
							},
						}
					: {}),
			});
		},

		async sendPhoto(input: {
			chatId: string | number;
			imageUrl: string;
			caption: string;
			replyMarkup: TelegramInlineKeyboard;
		}): Promise<TelegramMessage> {
			const imageUrl = new URL(input.imageUrl);
			if (
				imageUrl.protocol !== "https:" ||
				!options.allowedImageOrigins?.includes(imageUrl.origin)
			) {
				throw new Error("Institution image URL is not on an allowed origin");
			}
			const imageResponse = await fetch(input.imageUrl, {
				signal: AbortSignal.timeout(15_000),
			});
			if (!imageResponse.ok) {
				throw new Error(
					`Institution image fetch failed (${imageResponse.status})`,
				);
			}
			const declaredSize = Number(imageResponse.headers.get("content-length"));
			if (Number.isFinite(declaredSize) && declaredSize > 10 * 1024 * 1024) {
				throw new Error("Institution image exceeds the Telegram review limit");
			}
			const imageBlob = await imageResponse.blob();
			if (imageBlob.size > 10 * 1024 * 1024) {
				throw new Error("Institution image exceeds the Telegram review limit");
			}

			const form = new FormData();
			form.set("chat_id", String(input.chatId));
			form.set("caption", input.caption);
			form.set("parse_mode", "HTML");
			form.set("reply_markup", JSON.stringify(input.replyMarkup));
			form.set(
				"photo",
				new File([imageBlob], "institution-qr", {
					type:
						imageResponse.headers.get("content-type") ??
						"application/octet-stream",
				}),
			);

			const response = await fetch(`${baseUrl}/sendPhoto`, {
				method: "POST",
				body: form,
				signal: AbortSignal.timeout(30_000),
			});
			const payload =
				(await response.json()) as TelegramApiResponse<TelegramMessage>;
			if (!response.ok || !payload.ok || !payload.result) {
				throw new Error(
					`Telegram sendPhoto failed (${payload.error_code ?? response.status}): ${payload.description ?? "unknown error"}`,
				);
			}
			return payload.result;
		},

		answerCallbackQuery(input: {
			callbackQueryId: string;
			text?: string;
			showAlert?: boolean;
		}) {
			return request<boolean>("answerCallbackQuery", {
				callback_query_id: input.callbackQueryId,
				...(input.text ? { text: input.text } : {}),
				...(input.showAlert ? { show_alert: true } : {}),
			});
		},

		editMessageReplyMarkup(input: {
			chatId: string | number;
			messageId: number;
			replyMarkup?: TelegramInlineKeyboard;
		}) {
			return request<TelegramMessage | true>("editMessageReplyMarkup", {
				chat_id: input.chatId,
				message_id: input.messageId,
				reply_markup: input.replyMarkup ?? { inline_keyboard: [] },
			});
		},

		editMessageText(input: {
			chatId: string | number;
			messageId: number;
			text: string;
			replyMarkup?: TelegramInlineKeyboard;
		}) {
			return request<TelegramMessage | true>("editMessageText", {
				chat_id: input.chatId,
				message_id: input.messageId,
				text: input.text,
				parse_mode: "HTML",
				reply_markup: input.replyMarkup ?? { inline_keyboard: [] },
			});
		},

		editMessageCaption(input: {
			chatId: string | number;
			messageId: number;
			caption: string;
			replyMarkup?: TelegramInlineKeyboard;
		}) {
			return request<TelegramMessage | true>("editMessageCaption", {
				chat_id: input.chatId,
				message_id: input.messageId,
				caption: input.caption,
				parse_mode: "HTML",
				reply_markup: input.replyMarkup ?? { inline_keyboard: [] },
			});
		},
	};
}
