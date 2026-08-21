import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";
import { REJECTION_TEMPLATES } from "@/lib/admin-templates";
import { reviewPendingInstitution } from "@/lib/features/institution-review/review";
import {
	createTelegramBotClient,
	type TelegramBotClient,
	type TelegramCallbackQuery,
	type TelegramMessage,
	type TelegramUpdate,
} from "./bot-api";
import {
	getNextTelegramReviewCandidate,
	getTelegramQueueCounts,
	getTelegramReviewCandidate,
} from "./review-repository";
import { isAuthorizedTelegramActor } from "./review-security";
import {
	buildApprovalConfirmation,
	buildCustomReasonConfirmation,
	buildCustomReasonPrompt,
	buildRejectionMenu,
	buildReviewCard,
	buildTemplateRejectionConfirmation,
	decodeReviewCallback,
	escapeTelegramHtml,
	extractCustomReason,
	getReviewBlockers,
	parseCustomReasonPrompt,
	type RejectionTemplateKey,
	TELEGRAM_MENU_BUTTONS,
	TELEGRAM_REVIEW_MENU,
	type TelegramReviewCandidate,
	type TelegramReviewScope,
} from "./review-ui";

const REJECTION_REASONS: Record<RejectionTemplateKey, string> = {
	unclear: REJECTION_TEMPLATES[0].value,
	individual: REJECTION_TEMPLATES[1].value,
	duplicate: REJECTION_TEMPLATES[2].value,
};

type ReviewBotConfig = {
	chatId: string;
	reviewerUserId: string;
	adminBaseUrl: string | null;
};

function getTelegramClient(): TelegramBotClient | null {
	return env.TELEGRAM_BOT_TOKEN
		? createTelegramBotClient(env.TELEGRAM_BOT_TOKEN, {
				allowedImageOrigins: [new URL(env.R2_PUBLIC_URL).origin],
			})
		: null;
}

async function getReviewBotConfig(): Promise<ReviewBotConfig | null> {
	if (!env.TELEGRAM_CHAT_ID) return null;
	let reviewerUserId = env.TELEGRAM_REVIEWER_USER_ID;
	if (!reviewerUserId) {
		const activeAdmins = await db
			.select({ id: users.id, banned: users.banned })
			.from(users)
			.where(and(eq(users.role, "admin"), eq(users.isActive, true)))
			.limit(3);
		const eligibleAdmins = activeAdmins.filter((admin) => !admin.banned);
		if (eligibleAdmins.length !== 1) return null;
		reviewerUserId = eligibleAdmins[0]?.id;
	}
	if (!reviewerUserId) return null;
	const rawAdminBaseUrl =
		env.TELEGRAM_ADMIN_BASE_URL ?? process.env.BETTER_AUTH_URL;
	let adminBaseUrl: string | null = null;
	if (rawAdminBaseUrl) {
		try {
			const parsed = new URL(rawAdminBaseUrl);
			if (parsed.protocol === "http:" || parsed.protocol === "https:") {
				adminBaseUrl = parsed.toString();
			}
		} catch {
			// Keep Telegram review usable without an admin link.
		}
	}
	return {
		chatId: env.TELEGRAM_CHAT_ID,
		reviewerUserId,
		adminBaseUrl,
	};
}

async function sendCandidate(
	client: TelegramBotClient,
	config: Pick<ReviewBotConfig, "chatId" | "adminBaseUrl">,
	candidate: TelegramReviewCandidate,
	scope: TelegramReviewScope,
): Promise<TelegramMessage> {
	const card = buildReviewCard(candidate, scope, {
		adminBaseUrl: config.adminBaseUrl,
	});
	let sent: TelegramMessage;
	if (candidate.qrImage) {
		try {
			sent = await client.sendPhoto({
				chatId: config.chatId,
				imageUrl: candidate.qrImage,
				caption: card.caption,
				replyMarkup: card.replyMarkup,
			});
		} catch (error) {
			console.error("[telegram review] photo delivery failed", error);
			sent = await client.sendMessage({
				chatId: config.chatId,
				text: card.caption,
				parseMode: "HTML",
				replyMarkup: card.replyMarkup,
			});
		}
	} else {
		sent = await client.sendMessage({
			chatId: config.chatId,
			text: card.caption,
			parseMode: "HTML",
			replyMarkup: card.replyMarkup,
		});
	}

	if (card.qrFollowUpText) {
		await client.sendMessage({
			chatId: config.chatId,
			text: card.qrFollowUpText,
			parseMode: "HTML",
			replyToMessageId: sent.message_id,
		});
	}
	return sent;
}

async function sendNextCandidate(
	client: TelegramBotClient,
	config: ReviewBotConfig,
	scope: TelegramReviewScope,
	afterInstitutionId?: number,
) {
	const candidate = await getNextTelegramReviewCandidate(
		scope,
		afterInstitutionId,
	);
	if (!candidate) {
		await client.sendMessage({
			chatId: config.chatId,
			text: `✅ No more pending ${scope === "imports" ? "Akrimi imports" : scope === "community" ? "community submissions" : "institutions"} in this review run.`,
			replyMarkup: TELEGRAM_REVIEW_MENU,
		});
		return;
	}
	await sendCandidate(client, config, candidate, scope);
}

async function restoreReviewButtons(
	client: TelegramBotClient,
	config: ReviewBotConfig,
	chatId: number,
	messageId: number,
	institutionId: number,
	scope: TelegramReviewScope,
) {
	const candidate = await getTelegramReviewCandidate(institutionId, scope);
	if (!candidate) {
		await client.editMessageReplyMarkup({ chatId, messageId });
		return false;
	}
	const card = buildReviewCard(candidate, scope, {
		adminBaseUrl: config.adminBaseUrl,
	});
	await client.editMessageReplyMarkup({
		chatId,
		messageId,
		replyMarkup: card.replyMarkup,
	});
	return true;
}

async function acknowledgeUnauthorized(
	client: TelegramBotClient,
	callback?: TelegramCallbackQuery,
) {
	if (!callback) return;
	await client.answerCallbackQuery({
		callbackQueryId: callback.id,
		text: "This Telegram account is not authorized.",
		showAlert: true,
	});
}

async function handleMenuMessage(
	client: TelegramBotClient,
	config: ReviewBotConfig,
	message: TelegramMessage,
): Promise<void> {
	const text = message.text?.trim();
	const repliedPrompt = message.reply_to_message?.text
		? parseCustomReasonPrompt(message.reply_to_message.text)
		: null;
	if (repliedPrompt && text) {
		const confirmation = buildCustomReasonConfirmation(
			repliedPrompt.institutionId,
			repliedPrompt.scope,
			text,
			repliedPrompt.reviewMessageId,
		);
		await client.sendMessage({
			chatId: config.chatId,
			text: confirmation.text,
			parseMode: "HTML",
			replyMarkup: confirmation.replyMarkup,
			replyToMessageId: repliedPrompt.reviewMessageId,
		});
		return;
	}

	if (text === "/start" || text === "/menu") {
		await client.sendMessage({
			chatId: config.chatId,
			text: "Institution review is ready. Community submissions are the default; Akrimi imports stay in a separate queue.",
			replyMarkup: TELEGRAM_REVIEW_MENU,
		});
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.reviewNext) {
		await sendNextCandidate(client, config, "community");
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.community) {
		await sendNextCandidate(client, config, "community");
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.imports) {
		await sendNextCandidate(client, config, "imports");
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.queue) {
		const counts = await getTelegramQueueCounts();
		await client.sendMessage({
			chatId: config.chatId,
			text: [
				"<b>Pending review</b>",
				`Community submissions: <b>${counts.community}</b>`,
				`Akrimi imports: <b>${counts.imports}</b>`,
				`Total: <b>${counts.all}</b>`,
			].join("\n"),
			parseMode: "HTML",
			replyMarkup: TELEGRAM_REVIEW_MENU,
		});
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.openAdmin) {
		await client.sendMessage({
			chatId: config.chatId,
			text: config.adminBaseUrl
				? `<a href="${escapeTelegramHtml(new URL("/admin/institutions/pending", config.adminBaseUrl).toString())}">Open pending institutions in the web admin</a>`
				: "The web-admin URL is not configured.",
			parseMode: "HTML",
			replyMarkup: TELEGRAM_REVIEW_MENU,
		});
		return;
	}

	await client.sendMessage({
		chatId: config.chatId,
		text: "Use the menu buttons below to review institutions.",
		replyMarkup: TELEGRAM_REVIEW_MENU,
	});
}

async function handleReviewCallback(
	client: TelegramBotClient,
	config: ReviewBotConfig,
	callback: TelegramCallbackQuery,
): Promise<void> {
	const message = callback.message;
	const parsed = callback.data ? decodeReviewCallback(callback.data) : null;
	if (!message || !parsed) {
		await client.answerCallbackQuery({
			callbackQueryId: callback.id,
			text: "This review action is no longer valid.",
			showAlert: true,
		});
		return;
	}

	const chatId = message.chat.id;
	if (parsed.action === "approve") {
		const candidate = await getTelegramReviewCandidate(
			parsed.institutionId,
			parsed.scope,
		);
		if (!candidate || getReviewBlockers(candidate).length > 0) {
			await client.answerCallbackQuery({
				callbackQueryId: callback.id,
				text: "This institution requires web review.",
				showAlert: true,
			});
			return;
		}
		await client.editMessageReplyMarkup({
			chatId,
			messageId: message.message_id,
			replyMarkup: buildApprovalConfirmation(
				parsed.institutionId,
				parsed.scope,
			),
		});
		await client.answerCallbackQuery({
			callbackQueryId: callback.id,
			text: "Confirm approval",
		});
		return;
	}

	if (parsed.action === "reject") {
		await client.editMessageReplyMarkup({
			chatId,
			messageId: message.message_id,
			replyMarkup: buildRejectionMenu(parsed.institutionId, parsed.scope),
		});
		await client.answerCallbackQuery({
			callbackQueryId: callback.id,
			text: "Choose a rejection reason",
		});
		return;
	}

	if (parsed.action === "reject-template" && parsed.template) {
		await client.sendMessage({
			chatId,
			text: `<b>Rejection reason</b>\n\n${escapeTelegramHtml(REJECTION_REASONS[parsed.template])}`,
			parseMode: "HTML",
			replyToMessageId: message.message_id,
		});
		await client.editMessageReplyMarkup({
			chatId,
			messageId: message.message_id,
			replyMarkup: buildTemplateRejectionConfirmation(
				parsed.institutionId,
				parsed.scope,
				parsed.template,
			),
		});
		await client.answerCallbackQuery({
			callbackQueryId: callback.id,
			text: "Review and confirm the reason",
		});
		return;
	}

	if (parsed.action === "reject-custom") {
		await client.sendMessage({
			chatId,
			text: buildCustomReasonPrompt(
				parsed.institutionId,
				parsed.scope,
				message.message_id,
			),
			replyMarkup: {
				force_reply: true,
				selective: true,
				input_field_placeholder: "Type the rejection reason",
			},
			replyToMessageId: message.message_id,
		});
		await client.answerCallbackQuery({
			callbackQueryId: callback.id,
			text: "Reply with your custom reason",
		});
		return;
	}

	if (parsed.action === "cancel") {
		const reviewMessageId = parsed.reviewMessageId ?? message.message_id;
		await restoreReviewButtons(
			client,
			config,
			chatId,
			reviewMessageId,
			parsed.institutionId,
			parsed.scope,
		);
		if (message.message_id !== reviewMessageId) {
			await client.editMessageReplyMarkup({
				chatId,
				messageId: message.message_id,
			});
		}
		await client.answerCallbackQuery({
			callbackQueryId: callback.id,
			text: "Cancelled",
		});
		return;
	}

	if (parsed.action === "next") {
		await client.answerCallbackQuery({ callbackQueryId: callback.id });
		await sendNextCandidate(client, config, parsed.scope, parsed.institutionId);
		return;
	}

	let decision: "approved" | "rejected" | null = null;
	let adminNotes: string | undefined;
	if (parsed.action === "approve-confirm") decision = "approved";
	if (parsed.action === "reject-template-confirm" && parsed.template) {
		decision = "rejected";
		adminNotes = REJECTION_REASONS[parsed.template];
	}
	if (parsed.action === "reject-custom-confirm") {
		const reason = message.text
			? extractCustomReason(message.text, parsed.institutionId)
			: null;
		if (!reason) {
			await client.answerCallbackQuery({
				callbackQueryId: callback.id,
				text: "The custom reason could not be read.",
				showAlert: true,
			});
			return;
		}
		decision = "rejected";
		adminNotes = reason;
	}
	if (!decision) return;

	if (decision === "approved") {
		const candidate = await getTelegramReviewCandidate(
			parsed.institutionId,
			parsed.scope,
		);
		if (!candidate || getReviewBlockers(candidate).length > 0) {
			await client.answerCallbackQuery({
				callbackQueryId: callback.id,
				text: "This institution is no longer eligible for quick approval.",
				showAlert: true,
			});
			return;
		}
	}

	try {
		await reviewPendingInstitution({
			institutionId: parsed.institutionId,
			reviewerId: config.reviewerUserId,
			decision,
			adminNotes,
		});
	} catch (error) {
		const alreadyReviewed =
			error instanceof Error && error.message.includes("not pending");
		await client.answerCallbackQuery({
			callbackQueryId: callback.id,
			text: alreadyReviewed
				? "This institution has already been reviewed."
				: "The review could not be saved.",
			showAlert: true,
		});
		if (alreadyReviewed) {
			await client.editMessageReplyMarkup({
				chatId,
				messageId: parsed.reviewMessageId ?? message.message_id,
			});
		}
		return;
	}

	const reviewMessageId = parsed.reviewMessageId ?? message.message_id;
	await client.editMessageReplyMarkup({ chatId, messageId: reviewMessageId });
	if (message.message_id !== reviewMessageId) {
		await client.editMessageReplyMarkup({
			chatId,
			messageId: message.message_id,
		});
	}
	await client.sendMessage({
		chatId,
		text:
			decision === "approved"
				? `✅ Institution #${parsed.institutionId} approved.`
				: `❌ Institution #${parsed.institutionId} rejected.`,
		replyToMessageId: reviewMessageId,
	});
	await client.answerCallbackQuery({
		callbackQueryId: callback.id,
		text: decision === "approved" ? "Approved" : "Rejected",
	});
	await sendNextCandidate(client, config, parsed.scope, parsed.institutionId);
}

export async function handleTelegramReviewUpdate(
	update: TelegramUpdate,
): Promise<void> {
	const client = getTelegramClient();
	const config = await getReviewBotConfig();
	if (!client || !config) {
		throw new Error("Telegram review bot is not fully configured");
	}

	const callback = update.callback_query;
	const message = update.message;
	const fromId = callback?.from?.id ?? message?.from?.id;
	const chatId = callback?.message?.chat?.id ?? message?.chat?.id;
	if (
		fromId === undefined ||
		chatId === undefined ||
		!isAuthorizedTelegramActor(config.chatId, fromId, chatId)
	) {
		await acknowledgeUnauthorized(client, callback);
		return;
	}

	if (callback) {
		await handleReviewCallback(client, config, callback);
		return;
	}
	if (message) await handleMenuMessage(client, config, message);
}

export async function notifyInstitutionSubmission(
	institutionId: number,
): Promise<boolean> {
	const client = getTelegramClient();
	if (!client || !env.TELEGRAM_CHAT_ID) return false;
	const candidate = await getTelegramReviewCandidate(institutionId, "all");
	if (!candidate) return false;
	const scope: TelegramReviewScope =
		candidate.sourceUrl && !candidate.sourceUrl.startsWith("http")
			? "imports"
			: "community";
	await sendCandidate(
		client,
		{
			chatId: env.TELEGRAM_CHAT_ID,
			adminBaseUrl:
				env.TELEGRAM_ADMIN_BASE_URL ?? process.env.BETTER_AUTH_URL ?? null,
		},
		candidate,
		scope,
	);
	return true;
}

export function getTelegramReviewWebhookSecret(): string | null {
	return env.TELEGRAM_WEBHOOK_SECRET ?? null;
}

export function getTelegramReviewAllowedUpdates() {
	return ["message", "callback_query"] as const;
}
