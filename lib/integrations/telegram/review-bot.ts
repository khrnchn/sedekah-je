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
} from "@/lib/integrations/telegram/bot-api";
import {
	getNextTelegramReviewCandidate,
	getTelegramQueueCounts,
	getTelegramReviewCandidate,
	getTelegramReviewSession,
	saveTelegramReviewSession,
} from "@/lib/integrations/telegram/review-repository";
import { isAuthorizedTelegramActor } from "@/lib/integrations/telegram/review-security";
import {
	buildApprovalConfirmation,
	buildCustomReasonConfirmation,
	buildCustomReasonPrompt,
	buildRejectionMenu,
	buildReviewCard,
	buildReviewedCardStatus,
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
} from "@/lib/integrations/telegram/review-ui";

const REJECTION_REASONS: Record<RejectionTemplateKey, string> = {
	unclear: REJECTION_TEMPLATES[0].value,
	individual: REJECTION_TEMPLATES[1].value,
	duplicate: REJECTION_TEMPLATES[2].value,
};

export type ReviewBotConfig = {
	chatId: string;
	reviewerUserId: string;
	reviewerName: string | null;
	adminBaseUrl: string | null;
};

export type ReviewBotDependencies = {
	getCandidate: typeof getTelegramReviewCandidate;
	getNextCandidate: typeof getNextTelegramReviewCandidate;
	getQueueCounts: typeof getTelegramQueueCounts;
	getSession: typeof getTelegramReviewSession;
	saveSession: typeof saveTelegramReviewSession;
	reviewInstitution: (input: {
		institutionId: number;
		reviewerId: string;
		decision: "approved" | "rejected";
		adminNotes?: string;
	}) => Promise<unknown>;
};

const defaultDependencies: ReviewBotDependencies = {
	getCandidate: getTelegramReviewCandidate,
	getNextCandidate: getNextTelegramReviewCandidate,
	getQueueCounts: getTelegramQueueCounts,
	getSession: getTelegramReviewSession,
	saveSession: saveTelegramReviewSession,
	reviewInstitution: reviewPendingInstitution,
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
	let reviewerName: string | null = null;
	if (!reviewerUserId) {
		const activeAdmins = await db
			.select({ id: users.id, name: users.name, banned: users.banned })
			.from(users)
			.where(and(eq(users.role, "admin"), eq(users.isActive, true)))
			.limit(3);
		const eligibleAdmins = activeAdmins.filter((admin) => !admin.banned);
		if (eligibleAdmins.length !== 1) return null;
		reviewerUserId = eligibleAdmins[0]?.id;
		reviewerName = eligibleAdmins[0]?.name ?? null;
	}
	if (!reviewerUserId) return null;
	if (env.TELEGRAM_REVIEWER_USER_ID) {
		const [reviewer] = await db
			.select({ name: users.name })
			.from(users)
			.where(eq(users.id, reviewerUserId))
			.limit(1);
		reviewerName = reviewer?.name ?? null;
	}
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
		reviewerName,
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

export async function sendNextCandidate(
	client: TelegramBotClient,
	config: ReviewBotConfig,
	scope: TelegramReviewScope,
	afterInstitutionId?: number,
	dependencies: ReviewBotDependencies = defaultDependencies,
) {
	const candidate = await dependencies.getNextCandidate(
		scope,
		afterInstitutionId,
	);
	if (!candidate) {
		await client.sendMessage({
			chatId: config.chatId,
			text: `✅ No more pending ${scope === "imports" ? "bulk imports" : scope === "community" ? "community submissions" : "institutions"} in this review run.`,
			replyMarkup: TELEGRAM_REVIEW_MENU,
		});
		return;
	}
	await sendCandidate(client, config, candidate, scope);
	await dependencies.saveSession({
		telegramChatId: config.chatId,
		scope,
		cursorInstitutionId: candidate.id,
	});
}

export async function resumeReview(
	client: TelegramBotClient,
	config: ReviewBotConfig,
	dependencies: ReviewBotDependencies = defaultDependencies,
) {
	const session = await dependencies.getSession(config.chatId);
	if (!session?.cursorInstitutionId) {
		await client.sendMessage({
			chatId: config.chatId,
			text: "There is no saved review session yet. Choose a queue to begin.",
			replyMarkup: TELEGRAM_REVIEW_MENU,
		});
		return;
	}
	const current = await dependencies.getCandidate(
		session.cursorInstitutionId,
		session.scope,
	);
	if (current) {
		await sendCandidate(client, config, current, session.scope);
		return;
	}
	await sendNextCandidate(
		client,
		config,
		session.scope,
		session.cursorInstitutionId,
		dependencies,
	);
}

async function markReviewMessage(input: {
	client: TelegramBotClient;
	config: ReviewBotConfig;
	chatId: number;
	messageId: number;
	institutionId: number;
	decision: "approved" | "rejected";
	knownPhotoMessage: boolean | null;
}) {
	const status = buildReviewedCardStatus({
		institutionId: input.institutionId,
		decision: input.decision,
		reviewerName: input.config.reviewerName,
	});
	if (input.knownPhotoMessage === true) {
		await input.client.editMessageCaption({
			chatId: input.chatId,
			messageId: input.messageId,
			caption: status,
		});
		return;
	}
	if (input.knownPhotoMessage === false) {
		await input.client.editMessageText({
			chatId: input.chatId,
			messageId: input.messageId,
			text: status,
		});
		return;
	}
	try {
		await input.client.editMessageCaption({
			chatId: input.chatId,
			messageId: input.messageId,
			caption: status,
		});
	} catch {
		await input.client.editMessageText({
			chatId: input.chatId,
			messageId: input.messageId,
			text: status,
		});
	}
}

async function restoreReviewButtons(
	client: TelegramBotClient,
	config: ReviewBotConfig,
	chatId: number,
	messageId: number,
	institutionId: number,
	scope: TelegramReviewScope,
	dependencies: ReviewBotDependencies,
) {
	const candidate = await dependencies.getCandidate(institutionId, scope);
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
	dependencies: ReviewBotDependencies = defaultDependencies,
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
			text: "Institution review is ready. Community submissions are the default; bulk imports stay in a separate queue.",
			replyMarkup: TELEGRAM_REVIEW_MENU,
		});
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.reviewNext) {
		await sendNextCandidate(
			client,
			config,
			"community",
			undefined,
			dependencies,
		);
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.community) {
		await sendNextCandidate(
			client,
			config,
			"community",
			undefined,
			dependencies,
		);
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.imports) {
		await sendNextCandidate(client, config, "imports", undefined, dependencies);
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.queue) {
		const counts = await dependencies.getQueueCounts();
		await client.sendMessage({
			chatId: config.chatId,
			text: [
				"<b>Pending review</b>",
				`Community submissions: <b>${counts.community}</b>`,
				`Bulk imports: <b>${counts.imports}</b>`,
				`Ready in Telegram: <b>${counts.all}</b>`,
				`Needs QR extraction: <b>${counts.needsExtraction}</b>`,
				`Total pending: <b>${counts.totalPending}</b>`,
			].join("\n"),
			parseMode: "HTML",
			replyMarkup: TELEGRAM_REVIEW_MENU,
		});
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.resume) {
		await resumeReview(client, config, dependencies);
		return;
	}
	if (text === TELEGRAM_MENU_BUTTONS.all) {
		await sendNextCandidate(client, config, "all", undefined, dependencies);
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

export async function handleReviewCallback(
	client: TelegramBotClient,
	config: ReviewBotConfig,
	callback: TelegramCallbackQuery,
	dependencies: ReviewBotDependencies = defaultDependencies,
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
		const candidate = await dependencies.getCandidate(
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

	if (parsed.action === "reject-custom-edit") {
		const reviewMessageId = parsed.reviewMessageId ?? message.message_id;
		await client.sendMessage({
			chatId,
			text: buildCustomReasonPrompt(
				parsed.institutionId,
				parsed.scope,
				reviewMessageId,
			),
			replyMarkup: {
				force_reply: true,
				selective: true,
				input_field_placeholder: "Edit the rejection reason",
			},
			replyToMessageId: reviewMessageId,
		});
		await client.editMessageReplyMarkup({
			chatId,
			messageId: message.message_id,
		});
		await client.answerCallbackQuery({
			callbackQueryId: callback.id,
			text: "Reply with the edited reason",
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
			dependencies,
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
		await sendNextCandidate(
			client,
			config,
			parsed.scope,
			parsed.institutionId,
			dependencies,
		);
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
		const candidate = await dependencies.getCandidate(
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
		await dependencies.reviewInstitution({
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
	try {
		await markReviewMessage({
			client,
			config,
			chatId,
			messageId: reviewMessageId,
			institutionId: parsed.institutionId,
			decision,
			knownPhotoMessage:
				message.message_id === reviewMessageId
					? Boolean(message.photo?.length)
					: null,
		});
	} catch (error) {
		console.error("[telegram review] could not mark review card", error);
		await client.editMessageReplyMarkup({ chatId, messageId: reviewMessageId });
	}
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
	await sendNextCandidate(
		client,
		config,
		parsed.scope,
		parsed.institutionId,
		dependencies,
	);
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
