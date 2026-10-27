import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { env } from "@/env";
import { REJECTION_TEMPLATES } from "@/lib/admin-templates";
import {
	reviewPendingInstitution,
	undoInstitutionReview,
} from "@/lib/features/institution-review/review";
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
	searchTelegramReviewCandidates,
} from "@/lib/integrations/telegram/review-repository";
import { isAuthorizedTelegramActor } from "@/lib/integrations/telegram/review-security";
import {
	buildRejectionMenu,
	buildReviewCard,
	buildTemplateRejectionConfirmation,
	decodeReviewCallback,
	escapeTelegramHtml,
	type RejectionTemplateKey,
	TELEGRAM_MENU_BUTTONS,
	TELEGRAM_REVIEW_MENU,
	type TelegramReviewCandidate,
	type TelegramReviewScope,
} from "@/lib/integrations/telegram/review-ui";
import {
	scheduleReviewAnalysis,
	shouldAutoAnalyseSubmission,
} from "./review-analysis";
import {
	handleToolCallback,
	handleToolReply,
	type ReviewToolServices,
	reviewToolServices,
} from "./review-tools";

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
	tools?: ReviewToolServices;
	getCandidate: typeof getTelegramReviewCandidate;
	getNextCandidate: typeof getNextTelegramReviewCandidate;
	getQueueCounts: typeof getTelegramQueueCounts;
	getSession: typeof getTelegramReviewSession;
	saveSession: typeof saveTelegramReviewSession;
	searchCandidates: typeof searchTelegramReviewCandidates;
	undoReview: typeof undoInstitutionReview;
	reviewInstitution: (input: {
		institutionId: number;
		reviewerId: string;
		decision: "approved" | "rejected";
		adminNotes?: string;
	}) => Promise<unknown>;
};

const defaultDependencies: ReviewBotDependencies = {
	tools: reviewToolServices,
	getCandidate: getTelegramReviewCandidate,
	getNextCandidate: getNextTelegramReviewCandidate,
	getQueueCounts: getTelegramQueueCounts,
	getSession: getTelegramReviewSession,
	saveSession: saveTelegramReviewSession,
	searchCandidates: searchTelegramReviewCandidates,
	undoReview: undoInstitutionReview,
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
	if (candidate.reviewMetadata?.analysis) {
		await scheduleReviewAnalysis(candidate.id).catch(() =>
			console.error("[review analysis] recovery scheduling failed"),
		);
		const refreshed = await getTelegramReviewCandidate(candidate.id, "all");
		if (refreshed) candidate = refreshed;
	}
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

export async function handleMenuMessage(
	client: TelegramBotClient,
	config: ReviewBotConfig,
	message: TelegramMessage,
	dependencies: ReviewBotDependencies = defaultDependencies,
): Promise<void> {
	if (
		await handleToolReply(
			client,
			config,
			message,
			dependencies.tools ?? reviewToolServices,
		)
	)
		return;
	const text = message.text?.trim();
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
	if (text === TELEGRAM_MENU_BUTTONS.held) {
		await sendNextCandidate(client, config, "held", undefined, dependencies);
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
				`Held: <b>${counts.held ?? 0}</b>`,
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

	const findMatch = text?.match(/^\/find\s+(.+)$/i);
	if (findMatch) {
		const query = findMatch[1].trim();
		const openCandidate = async (candidate: TelegramReviewCandidate) => {
			await sendCandidate(client, config, candidate, "all");
			await dependencies.saveSession({
				telegramChatId: config.chatId,
				scope: "all",
				cursorInstitutionId: candidate.id,
			});
		};

		if (/^\d+$/.test(query)) {
			const candidate = await dependencies.getCandidate(Number(query), "all");
			if (!candidate) {
				await client.sendMessage({
					chatId: config.chatId,
					text: `No Telegram-reviewable pending institution #${query}. It may be already reviewed or nonexistent.`,
					replyMarkup: TELEGRAM_REVIEW_MENU,
				});
				return;
			}
			await openCandidate(candidate);
			return;
		}

		const matches = await dependencies.searchCandidates(query);
		if (matches.length === 0) {
			await client.sendMessage({
				chatId: config.chatId,
				text: `No pending institutions match "${escapeTelegramHtml(query)}".`,
				replyMarkup: TELEGRAM_REVIEW_MENU,
			});
			return;
		}
		if (matches.length === 1) {
			const candidate = await dependencies.getCandidate(matches[0].id, "all");
			if (candidate) {
				await openCandidate(candidate);
				return;
			}
		}
		await client.sendMessage({
			chatId: config.chatId,
			text: [
				`<b>Matches for "${escapeTelegramHtml(query)}"</b>`,
				...matches.map((m) => `#${m.id} — ${escapeTelegramHtml(m.name)}`),
				"",
				"Reply with /find &lt;id&gt; to open one.",
			].join("\n"),
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
	if (
		await handleToolCallback(
			client,
			config,
			callback,
			dependencies.tools ?? reviewToolServices,
			(scope, id) => sendNextCandidate(client, config, scope, id, dependencies),
		)
	)
		return;
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
	// Persist queued analysis even if Telegram notifications are not configured.
	const [submission] = await db
		.select({ sourceUrl: institutions.sourceUrl })
		.from(institutions)
		.where(eq(institutions.id, institutionId))
		.limit(1);
	if (submission && shouldAutoAnalyseSubmission(submission.sourceUrl)) {
		await scheduleReviewAnalysis(institutionId).catch(() =>
			console.error("[review analysis] scheduling failed"),
		);
	}
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
