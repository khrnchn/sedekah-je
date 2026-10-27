import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { REJECTION_TEMPLATES } from "@/lib/admin-templates";
import {
	reviewPendingInstitution,
	undoInstitutionReview,
} from "@/lib/features/institution-review/review";
import {
	type EvidenceRecord,
	inspectDuitNow,
	operationVersion,
	reviewVersion,
	telegramApprovalBlockers,
} from "@/lib/features/institution-review/telegram-evidence";
import { states } from "@/lib/institution-constants";
import { geocodeMalaysiaInstitutionByName } from "@/lib/integrations/geocode";
import { r2Storage } from "@/lib/integrations/r2-client";
import { recoverQrFromBuffer } from "@/lib/qr-decode";
import type {
	TelegramBotClient,
	TelegramCallbackQuery,
	TelegramMessage,
} from "./bot-api";
import { scheduleReviewAnalysis } from "./review-analysis";
import { formatAssessmentReport } from "./review-assessment-copy";
import { fetchReviewImage, validateReviewImage } from "./review-media";
import {
	applyReviewOperation,
	consumeReviewOperation,
	createReviewOperation,
	findReviewDuplicates,
	getReplyOperation,
} from "./review-operations";
import { sendReviewText } from "./review-text";
import {
	decodeReviewCallback,
	type TelegramReviewCandidate,
	type TelegramReviewScope,
} from "./review-ui";

const locationSchema = z
	.object({
		address: z.string().trim().min(1).max(2000).optional(),
		city: z.string().trim().min(1).max(100).optional(),
		state: z.enum(states).optional(),
		coords: z
			.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)])
			.optional(),
	})
	.strict()
	.refine((v) => Object.keys(v).length > 0);
export function parseLocationEdit(
	message: Pick<TelegramMessage, "text" | "location">,
) {
	if (message.location)
		return locationSchema.parse({
			coords: [message.location.latitude, message.location.longitude],
		});
	// Address-only replies preserve existing city/state/pin; JSON permits explicit corrections.
	const text = message.text?.trim() ?? "";
	return locationSchema.parse(
		text.startsWith("{") ? JSON.parse(text) : { address: text },
	);
}
export function parseEvidence(
	text: string,
	row: Pick<EvidenceRecord, "category">,
) {
	if (text.trim().toLowerCase() === "physical")
		return { physicalDisplay: true };
	if (!["kebajikan", "tahfiz"].includes(row.category))
		throw new Error("Masjid/surau require physical-display confirmation");
	const url = new URL(text.trim());
	if (
		url.protocol !== "https:" ||
		url.username ||
		url.password ||
		!url.hostname.includes(".") ||
		url.hostname === "localhost"
	)
		throw new Error("Provide an official HTTPS source URL you have verified");
	return { officialSource: url.toString() };
}
export const reviewToolServices = {
	async consumePrompt(binding: {
		id: string;
		chatId: string;
		promptMessageId: number;
	}) {
		await db.transaction(async (tx) => {
			await consumeReviewOperation(tx, binding);
		});
	},
	async getRecord(id: number) {
		const [row] = await db
			.select()
			.from(institutions)
			.where(and(eq(institutions.id, id), eq(institutions.status, "pending")))
			.limit(1);
		return row ?? null;
	},
	createOperation: createReviewOperation,
	getReplyOperation,
	applyOperation: applyReviewOperation,
	duplicates: findReviewDuplicates,
	geocode: geocodeMalaysiaInstitutionByName,
	fetchImage: fetchReviewImage,
	recoverQr: recoverQrFromBuffer,
	upload: (bytes: Buffer, ext: string) =>
		r2Storage.uploadFile(bytes, `telegram-review.${ext}`),
	analyse: scheduleReviewAnalysis,
	review: reviewPendingInstitution,
	undo: undoInstitutionReview,
};
export type ReviewToolServices = typeof reviewToolServices;
type Config = { chatId: string; reviewerUserId: string };

async function preview(
	client: TelegramBotClient,
	config: Config,
	row: TelegramReviewCandidate,
	kind: string,
	payload: Record<string, unknown>,
	description: string,
	tools: ReviewToolServices,
) {
	const sent = await sendReviewText(client, {
		chatId: config.chatId,
		text: `Review change for #${row.id}\n${description}\nSource: ${kind === "location" ? String(payload._source ?? "admin reply") : "admin review"}\nConfirm only after verifying all details.`,
	});
	const { _source, ...cleanPayload } = payload;
	const id = await tools.createOperation({
		chatId: config.chatId,
		institutionId: row.id,
		promptMessageId: sent.message_id,
		version: operationVersion(row),
		kind,
		payload:
			kind === "approve" || kind === "reject"
				? {
						...cleanPayload,
						_queue: row.reviewMetadata?.held
							? "held"
							: row.sourceUrl && !/^https?:/i.test(row.sourceUrl)
								? "imports"
								: "community",
					}
				: cleanPayload,
	});
	await client.editMessageReplyMarkup({
		chatId: config.chatId,
		messageId: sent.message_id,
		replyMarkup: {
			inline_keyboard: [
				[
					{
						text:
							kind === "different"
								? "Different institution"
								: kind === "approve"
									? "Confirm approval"
									: kind === "reject"
										? "Confirm rejection"
										: "Confirm",
						callback_data: `ro:${id}`,
					},
				],
			],
		},
	});
}
async function prompt(
	client: TelegramBotClient,
	config: Config,
	row: TelegramReviewCandidate,
	kind: string,
	text: string,
	tools: ReviewToolServices,
) {
	const sent = await client.sendMessage({
		chatId: config.chatId,
		text: `#${row.id}: ${text}`,
		replyMarkup: { force_reply: true, selective: true },
	});
	await tools.createOperation({
		chatId: config.chatId,
		institutionId: row.id,
		promptMessageId: sent.message_id,
		version: operationVersion(row),
		kind: `prompt-${kind}`,
	});
}
const isAuthorized = (
	config: Config,
	message: TelegramMessage,
	from?: number,
) =>
	String(message.chat.id) === config.chatId &&
	String(from ?? message.from?.id) === config.chatId;

export async function handleToolReply(
	client: TelegramBotClient,
	config: Config,
	message: TelegramMessage,
	tools = reviewToolServices,
): Promise<boolean> {
	if (!isAuthorized(config, message) || !message.reply_to_message) return false;
	const op = await tools.getReplyOperation(
		config.chatId,
		message.reply_to_message.message_id,
	);
	if (!op?.kind.startsWith("prompt-")) return false;
	const row = await tools.getRecord(op.institutionId);
	try {
		if (!row || op.version !== operationVersion(row))
			throw new Error("Record changed; reopen its review card");
		let promptConsumed = false;
		let kind: string, payload: Record<string, unknown>, description: string;
		if (op.kind === "prompt-location") {
			kind = "location";
			payload = parseLocationEdit(message);
			description = `Before: ${JSON.stringify({ address: row.address, city: row.city, state: row.state, coords: row.coords })}\nAfter: ${JSON.stringify({ address: row.address, city: row.city, state: row.state, coords: row.coords, ...payload })}\nA pin changes coordinates only; it does not geocode the address.`;
		} else if (op.kind === "prompt-evidence") {
			kind = "evidence";
			payload = parseEvidence(message.text ?? "", row);
			if (!row.qrImage)
				throw new Error("Upload a QR image before confirming evidence");
			payload.imageHash = createHash("sha256")
				.update(await tools.fetchImage(row.qrImage))
				.digest("hex");
			description = `I confirm the recipient ${inspectDuitNow(row.qrContent).recipient ?? "(unknown)"} belongs to ${row.name}, is not an individual, and I verified ${payload.physicalDisplay ? "the QR is displayed physically at this institution" : `the official source: ${payload.officialSource}`}.`;
		} else if (op.kind === "prompt-reject") {
			kind = "reject";
			payload = {
				notes: z.string().trim().min(1).max(2000).parse(message.text),
			};
			description = `Rejection reason: ${payload.notes}`;
		} else if (op.kind === "prompt-qr") {
			const file = message.photo?.at(-1) ?? message.document;
			if (!file?.file_id || (file.file_size ?? 0) > 10 * 1024 * 1024)
				throw new Error("Reply with a JPEG, PNG or WebP image under 10 MB");
			const bytes = await client.downloadPhoto(file.file_id);
			const ext = await validateReviewImage(bytes);
			const qrContent = await tools.recoverQr(bytes);
			if (!qrContent)
				throw new Error("No QR decoded; try a closer, clearer photo");
			// Stage under a unique immutable key. The database reference changes only on confirmation.
			await consumePrompt(op.id, config.chatId, op.promptMessageId, tools);
			promptConsumed = true;
			const qrImage = await tools.upload(bytes, ext);
			kind = "qr";
			payload = { qrImage, qrContent };
			description = `Old recipient: ${inspectDuitNow(row.qrContent).recipient ?? "unknown"}\nNew recipient: ${inspectDuitNow(qrContent).recipient ?? "unknown"}\nChecksum: ${inspectDuitNow(qrContent).checksum}\nNew image: ${qrImage}\nPrior image and payload will remain in audit history.`;
		} else return false;
		// Consume reply prompt atomically before creating the confirmation, preventing replayed replies.
		if (!promptConsumed)
			await consumePrompt(op.id, config.chatId, op.promptMessageId, tools);
		await preview(
			client,
			config,
			{
				...row,
				duplicateInstitutionId: null,
				position: 1,
				total: 1,
				contributorName: null,
				partnerName: null,
			},
			kind,
			payload,
			description,
			tools,
		);
	} catch (error) {
		await client.sendMessage({
			chatId: config.chatId,
			text: error instanceof Error ? error.message : "Could not prepare change",
		});
	}
	return true;
}

// Separate from edit application: a prompt reply can only create a preview, never mutate the institution.

async function consumePrompt(
	id: string,
	chatId: string,
	promptMessageId: number,
	tools: ReviewToolServices,
) {
	await tools.consumePrompt({ id, chatId, promptMessageId });
}

export async function handleToolCallback(
	client: TelegramBotClient,
	config: Config,
	callback: TelegramCallbackQuery,
	tools = reviewToolServices,
	onReviewed?: (
		scope: TelegramReviewScope,
		institutionId: number,
	) => Promise<void>,
): Promise<boolean> {
	const message = callback.message;
	if (!message || !isAuthorized(config, message, callback.from.id))
		return false;
	const operation = callback.data?.match(/^ro:([a-f0-9]{32})$/);
	const action = callback.data ? decodeReviewCallback(callback.data) : null;
	if (
		!operation &&
		(!action ||
			![
				"approve",
				"approve-confirm",
				"undo",
				"payload",
				"location",
				"find-address",
				"qr",
				"compare",
				"hold",
				"resume-held",
				"analysis",
				"analysis-details",
				"evidence",
				"reject-custom",
				"reject-custom-edit",
				"reject-custom-confirm",
				"reject-template-confirm",
			].includes(action.action))
	)
		return false;
	await client.answerCallbackQuery({ callbackQueryId: callback.id });
	try {
		if (operation) {
			const op = await tools.getReplyOperation(
				config.chatId,
				message.message_id,
			);
			if (!op || op.id !== operation[1])
				throw new Error("This operation expired or was already used");
			const binding = {
				id: op.id,
				chatId: config.chatId,
				promptMessageId: message.message_id,
			};
			if (op.kind === "approve" || op.kind === "reject") {
				if (op.kind === "approve") {
					const latest = await tools.getRecord(op.institutionId);
					if (!latest?.qrImage) throw new Error("QR image is unavailable");
					const imageHash = createHash("sha256")
						.update(await tools.fetchImage(latest.qrImage))
						.digest("hex");
					if (
						imageHash !== op.payload.imageHash ||
						imageHash !== latest.reviewMetadata?.evidence?.imageHash
					)
						throw new Error(
							"Image evidence changed; confirm the recipient and display again",
						);
				}
				const reviewed = await tools.review({
					institutionId: op.institutionId,
					reviewerId: config.reviewerUserId,
					decision: op.kind === "approve" ? "approved" : "rejected",
					adminNotes:
						typeof op.payload.notes === "string" ? op.payload.notes : undefined,
					telegramOperation: binding,
				});
				const sent = await client.sendMessage({
					chatId: config.chatId,
					text: `#${op.institutionId} ${op.kind === "approve" ? "approved" : "rejected"}.`,
				});
				const undoId = await tools.createOperation({
					chatId: config.chatId,
					institutionId: op.institutionId,
					promptMessageId: sent.message_id,
					version: operationVersion(reviewed),
					kind: "undo",
				});
				await client.editMessageReplyMarkup({
					chatId: config.chatId,
					messageId: sent.message_id,
					replyMarkup: {
						inline_keyboard: [
							[{ text: "Undo", callback_data: `ro:${undoId}` }],
						],
					},
				});
			} else if (op.kind === "undo") {
				await tools.undo({
					institutionId: op.institutionId,
					reviewerId: config.reviewerUserId,
					telegramOperation: binding,
				});
			} else {
				await tools.applyOperation(binding, config.reviewerUserId);
				if (op.kind === "analysis-request")
					await tools.analyse(op.institutionId, true);
			}
			await client.editMessageReplyMarkup({
				chatId: config.chatId,
				messageId: message.message_id,
			});
			if (op.kind === "analysis-request") {
				await client.editMessageText({
					chatId: config.chatId,
					messageId: message.message_id,
					text: "Analysis requested. Results will appear on the review card. You can keep reviewing while it runs.",
				});
			} else
				await client.sendMessage({
					chatId: config.chatId,
					text: `Saved. /find ${op.institutionId} to reopen.`,
				});
			if ((op.kind === "approve" || op.kind === "reject") && onReviewed) {
				const scope =
					op.payload._queue === "imports"
						? "imports"
						: op.payload._queue === "held"
							? "held"
							: "community";
				await onReviewed(scope, op.institutionId);
			}
			return true;
		}
		if (!action) return false;
		const row = await tools.getRecord(action.institutionId);
		if (!row) throw new Error("This institution is no longer pending");
		const candidate: TelegramReviewCandidate = {
			...row,
			duplicateInstitutionId: null,
			position: 1,
			total: 1,
			contributorName: null,
			partnerName: null,
		};
		if (action.action === "undo")
			throw new Error(
				"This older undo button expired. Use the undo button attached to the latest saved review.",
			);
		if (action.action === "analysis-details") {
			const analysis = row.reviewMetadata?.analysis;
			if (
				analysis?.state !== "complete" ||
				analysis.version !== reviewVersion(row) ||
				!analysis.result
			)
				throw new Error("No current photo assessment. Choose Retry analysis.");
			await sendReviewText(client, {
				chatId: config.chatId,
				replyToMessageId: message.message_id,
				text: formatAssessmentReport({ ...row, assessment: analysis.result }),
			});
		} else if (action.action === "payload") {
			const payload = row.qrContent || "No QR payload — use Retry/replace QR";
			for (let offset = 0; offset < payload.length; offset += 2000)
				await client.sendMessage({
					chatId: config.chatId,
					text: payload.slice(offset, offset + 2000),
				});
		} else if (action.action === "location") {
			await prompt(
				client,
				config,
				candidate,
				"location",
				'Reply with address text, a location pin, or JSON for city/state corrections, e.g. {"city":"Petaling Jaya","state":"Selangor"}. Existing fields are preserved unless explicitly changed. A preview follows.',
				tools,
			);
		} else if (action.action === "evidence") {
			await prompt(
				client,
				config,
				candidate,
				"evidence",
				"First verify the recipient belongs to the institution and is not an individual. Reply PHYSICAL to attest the photo shows its physical QR display. NGO/tahfiz artwork: reply with an official HTTPS source URL you have opened and verified. A confirmation follows.",
				tools,
			);
		} else if (
			action.action === "reject-custom" ||
			action.action === "reject-custom-edit"
		) {
			await prompt(
				client,
				config,
				candidate,
				"reject",
				"Reply with the rejection reason.",
				tools,
			);
		} else if (
			action.action === "reject-custom-confirm" ||
			action.action === "approve-confirm"
		)
			throw new Error(
				"This older confirmation expired. Reopen the record to confirm again.",
			);
		else if (action.action === "reject-template-confirm") {
			const notes =
				action.template === "individual"
					? REJECTION_TEMPLATES[1].value
					: action.template === "duplicate"
						? REJECTION_TEMPLATES[2].value
						: REJECTION_TEMPLATES[0].value;
			await preview(
				client,
				config,
				candidate,
				"reject",
				{ notes },
				notes,
				tools,
			);
		} else if (action.action === "find-address") {
			const geo = await tools.geocode(`${row.name}, ${row.city}, ${row.state}`);
			if (!geo)
				throw new Error(
					"Address lookup unavailable. Use Edit location to enter an address or pin manually.",
				);
			await preview(
				client,
				config,
				candidate,
				"location",
				{
					...(geo.address ? { address: geo.address } : {}),
					coords: geo.coords,
					_source: `${geo.provider === "google" ? "Google" : "Nominatim / OpenStreetMap"} name + city + state lookup`,
				},
				`Verify possible location conflict.\nBefore: ${JSON.stringify({ address: row.address, city: row.city, state: row.state, coords: row.coords })}\nProposed address: ${geo.address ?? row.address}\nProposed pin: ${geo.coords.join(", ")}\nCity/state stay unchanged. Verify the result against both.`,
				tools,
			);
		} else if (action.action === "qr") {
			await prompt(
				client,
				config,
				candidate,
				"qr",
				"Reply with a replacement photo or image document (JPEG/PNG/WebP under 10 MB).",
				tools,
			);
			if (row.qrImage) {
				const bytes = await tools.fetchImage(row.qrImage);
				const qrContent = await tools.recoverQr(bytes);
				if (qrContent && qrContent !== row.qrContent)
					await preview(
						client,
						config,
						candidate,
						"qr",
						{ qrImage: row.qrImage, qrContent },
						`Recovered QR. Old recipient: ${inspectDuitNow(row.qrContent).recipient ?? "unknown"}\nNew recipient: ${inspectDuitNow(qrContent).recipient ?? "unknown"}\nChecksum: ${inspectDuitNow(qrContent).checksum}`,
						tools,
					);
				else
					await client.sendMessage({
						chatId: config.chatId,
						text: "Retry found no different payload. Reply to the replacement prompt with a clearer image.",
					});
			}
		} else if (action.action === "compare") {
			const duplicates = await tools.duplicates(row);
			if (!duplicates.length)
				await client.sendMessage({
					chatId: config.chatId,
					text: "No duplicate candidates found.",
				});
			for (const d of duplicates) {
				await client.sendMessage({
					chatId: config.chatId,
					text: `#${d.id}: ${d.name}\n${d.reason} (${d.status})\n${d.address ?? "No address"}, ${d.city}, ${d.state}\nPin: ${d.coords?.join(", ") ?? "missing"}\nRecipient: ${inspectDuitNow(d.qrContent).recipient ?? "unknown"}\nImage: ${d.qrImage ?? "missing"}\n${d.reason === "nearby" ? "Nearby is a suggestion, not a confirmed duplicate." : ""}\nAlternate QR payload is preserved.`,
				});
				await preview(
					client,
					config,
					candidate,
					"reject",
					{
						notes: `Duplicate of #${d.id}; alternate QR retained in original record`,
					},
					`Reject duplicate of #${d.id}: ${d.name}`,
					tools,
				);
			}
			if (duplicates.some((d) => d.reason !== "exact_payload"))
				await preview(
					client,
					config,
					candidate,
					"different",
					{
						versions: Object.fromEntries(
							duplicates.map((d) => [String(d.id), d.version]),
						),
						ids: duplicates
							.filter((d) => d.reason !== "exact_payload")
							.map((d) => d.id),
					},
					"Different institution: I compared the suspected duplicates and verified they are separate institutions. Exact payload matches still block approval.",
					tools,
				);
		} else if (action.action === "approve") {
			const blockers = telegramApprovalBlockers(
				row,
				await tools.duplicates(row),
			);
			if (blockers.length === 0 && row.qrImage) {
				const bytes = await tools.fetchImage(row.qrImage);
				const imageHash = createHash("sha256").update(bytes).digest("hex");
				if (imageHash !== row.reviewMetadata?.evidence?.imageHash)
					blockers.push(
						"Confirm image evidence again; image bytes changed or no image confirmation is saved",
					);
				const decoded = await tools.recoverQr(bytes);
				if (decoded !== row.qrContent)
					blockers.push(
						"Image QR differs from the saved payload or cannot be decoded. Use Retry/replace QR.",
					);
			}
			if (blockers.length)
				await client.sendMessage({
					chatId: config.chatId,
					text: `Approval needs attention:\n${blockers.map((b) => `• ${b}`).join("\n")}`,
				});
			else
				await preview(
					client,
					config,
					candidate,
					"approve",
					{ imageHash: row.reviewMetadata?.evidence?.imageHash },
					`Approve ${row.name}? Recipient ownership and image evidence were confirmed. Current data and duplicates will be checked again.`,
					tools,
				);
		} else if (action.action === "analysis") {
			await preview(
				client,
				config,
				candidate,
				"analysis-request",
				{},
				"Check this photo again? The result will update the review card. You still make the approval decision.",
				tools,
			);
		} else
			await preview(
				client,
				config,
				candidate,
				action.action === "hold" ? "hold" : "resume",
				{},
				action.action === "hold"
					? "Hold this pending submission and remove it from ordinary navigation?"
					: "Resume this pending submission in its original queue?",
				tools,
			);
	} catch (error) {
		await client.sendMessage({
			chatId: config.chatId,
			text:
				error instanceof Error
					? error.message
					: "Could not complete review action",
		});
	}
	return true;
}
