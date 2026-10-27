import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import {
	type ReviewMetadata,
	reviewVersion,
} from "@/lib/features/institution-review/telegram-evidence";
import type { TelegramBotClient } from "./bot-api";
import { getTelegramReviewCandidate } from "./review-repository";
import { buildReviewCard, type TelegramReviewCandidate } from "./review-ui";

type CardTarget = NonNullable<ReviewMetadata["telegramCard"]>;
type Card = ReturnType<typeof buildReviewCard>;
export function reviewCardDigest(card: Card): string {
	return createHash("sha256")
		.update(JSON.stringify([card.caption, card.replyMarkup]))
		.digest("hex");
}

/** Edit only the bound card for the same record version and authorised chat. */
export async function editBoundReviewCard(
	client: Pick<TelegramBotClient, "editMessageCaption" | "editMessageText">,
	config: { chatId: string; adminBaseUrl: string | null },
	candidate: TelegramReviewCandidate,
	target: CardTarget,
): Promise<CardTarget> {
	if (
		target.chatId !== config.chatId ||
		target.version !== reviewVersion(candidate)
	)
		return target;
	const card = buildReviewCard(candidate, target.scope, config);
	const digest = reviewCardDigest(card);
	if (digest === target.digest) return target;
	const common = {
		chatId: target.chatId,
		messageId: target.messageId,
		replyMarkup: card.replyMarkup,
	};
	try {
		if (target.kind === "photo")
			await client.editMessageCaption({ ...common, caption: card.caption });
		else await client.editMessageText({ ...common, text: card.caption });
	} catch (error) {
		// Telegram may already have accepted an edit before a connection interruption.
		if (
			!(error instanceof Error) ||
			!error.message.includes("message is not modified")
		)
			throw error;
	}
	return { ...target, digest };
}

export async function syncReviewCard(
	client: TelegramBotClient,
	config: { chatId: string; adminBaseUrl: string | null },
	institutionId: number,
	binding?: CardTarget,
): Promise<void> {
	await db.transaction(async (tx) => {
		// Keep approval and an asynchronous card refresh in order. Once reviewed,
		// a late analysis must never restore approval buttons.
		const [row] = await tx
			.select()
			.from(institutions)
			.where(eq(institutions.id, institutionId))
			.for("update");
		if (!row || row.status !== "pending") return;
		const target = binding ?? row.reviewMetadata?.telegramCard;
		if (
			!target ||
			target.chatId !== config.chatId ||
			target.version !== reviewVersion(row)
		)
			return;
		const candidate = await getTelegramReviewCandidate(
			institutionId,
			"all",
			tx,
		);
		if (!candidate) return;
		const updated = await editBoundReviewCard(
			client,
			config,
			candidate,
			target,
		);
		await tx
			.update(institutions)
			.set({
				updatedAt: row.updatedAt,
				reviewMetadata: { ...row.reviewMetadata, telegramCard: updated },
			})
			.where(eq(institutions.id, institutionId));
	});
}
