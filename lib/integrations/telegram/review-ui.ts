export type TelegramReviewScope = "community" | "imports" | "all";

export type RejectionTemplateKey = "unclear" | "individual" | "duplicate";

export type ReviewCallback = {
	action:
		| "approve"
		| "approve-confirm"
		| "reject"
		| "reject-template"
		| "reject-template-confirm"
		| "reject-custom"
		| "reject-custom-confirm"
		| "reject-custom-edit"
		| "cancel"
		| "next";
	scope: TelegramReviewScope;
	institutionId: number;
	template?: RejectionTemplateKey;
	reviewMessageId?: number;
};

export type TelegramInlineButton = {
	text: string;
	callback_data?: string;
	url?: string;
};

export type TelegramInlineKeyboard = {
	inline_keyboard: TelegramInlineButton[][];
};

export type TelegramReviewCandidate = {
	id: number;
	name: string;
	category: string;
	state: string;
	city: string;
	address: string | null;
	qrImage: string | null;
	qrContent: string | null;
	supportedPayment: string[] | null;
	coords: [number, number] | null;
	contributorName: string | null;
	sourceUrl: string | null;
	createdAt: Date;
	duplicateInstitutionId: number | null;
	position: number;
	total: number;
};

const CALLBACK_ACTION_CODES = {
	approve: "a",
	"approve-confirm": "A",
	reject: "r",
	"reject-template": "t",
	"reject-template-confirm": "T",
	"reject-custom": "c",
	"reject-custom-confirm": "C",
	"reject-custom-edit": "e",
	cancel: "x",
	next: "n",
} as const satisfies Record<ReviewCallback["action"], string>;

const ACTIONS_BY_CODE = Object.fromEntries(
	Object.entries(CALLBACK_ACTION_CODES).map(([action, code]) => [code, action]),
) as Record<string, ReviewCallback["action"]>;

const SCOPE_CODES = {
	community: "h",
	imports: "i",
	all: "a",
} as const satisfies Record<TelegramReviewScope, string>;

const SCOPES_BY_CODE = Object.fromEntries(
	Object.entries(SCOPE_CODES).map(([scope, code]) => [code, scope]),
) as Record<string, TelegramReviewScope>;

const TEMPLATE_KEYS = new Set<RejectionTemplateKey>([
	"unclear",
	"individual",
	"duplicate",
]);

const MAX_PHOTO_CAPTION_LENGTH = 1024;

export const TELEGRAM_MENU_BUTTONS = {
	reviewNext: "▶️ Review next",
	queue: "📊 Queue",
	resume: "↩️ Resume review",
	all: "📥 All pending",
	community: "👤 Community submissions",
	imports: "🤖 Bulk imports",
	openAdmin: "🌐 Open web admin",
} as const;

export const TELEGRAM_REVIEW_MENU = {
	keyboard: [
		[TELEGRAM_MENU_BUTTONS.reviewNext, TELEGRAM_MENU_BUTTONS.queue],
		[TELEGRAM_MENU_BUTTONS.resume, TELEGRAM_MENU_BUTTONS.all],
		[TELEGRAM_MENU_BUTTONS.community, TELEGRAM_MENU_BUTTONS.imports],
		[TELEGRAM_MENU_BUTTONS.openAdmin],
	],
	resize_keyboard: true,
	is_persistent: true,
	input_field_placeholder: "Choose a review action",
} as const;

export const REJECTION_TEMPLATE_KEYS = [
	"unclear",
	"individual",
	"duplicate",
] as const satisfies readonly RejectionTemplateKey[];

export const REJECTION_TEMPLATE_LABELS: Record<RejectionTemplateKey, string> = {
	unclear: "📷 Tidak jelas",
	individual: "👤 Individu",
	duplicate: "♻️ Duplicate",
};

export function encodeReviewCallback(callback: ReviewCallback): string {
	const parts = [
		"rv",
		CALLBACK_ACTION_CODES[callback.action],
		SCOPE_CODES[callback.scope],
		String(callback.institutionId),
	];
	if (callback.template) parts.push(callback.template);
	if (callback.reviewMessageId) {
		if (!callback.template) parts.push("-");
		parts.push(String(callback.reviewMessageId));
	}
	return parts.join(":");
}

export function decodeReviewCallback(value: string): ReviewCallback | null {
	const [
		prefix,
		actionCode,
		scopeCode,
		rawId,
		rawTemplate,
		rawReviewMessageId,
		...rest
	] = value.split(":");
	if (prefix !== "rv" || rest.length > 0) return null;

	const action = ACTIONS_BY_CODE[actionCode ?? ""];
	const scope = SCOPES_BY_CODE[scopeCode ?? ""];
	const institutionId = Number(rawId);
	if (
		!action ||
		!scope ||
		!Number.isInteger(institutionId) ||
		institutionId < 1
	) {
		return null;
	}

	const template =
		rawTemplate && rawTemplate !== "-"
			? (rawTemplate as RejectionTemplateKey)
			: undefined;
	const reviewMessageId = rawReviewMessageId
		? Number(rawReviewMessageId)
		: undefined;
	if (template && !TEMPLATE_KEYS.has(template)) return null;
	if (
		reviewMessageId !== undefined &&
		(!Number.isInteger(reviewMessageId) || reviewMessageId < 1)
	) {
		return null;
	}
	if (
		reviewMessageId &&
		action !== "reject-custom-confirm" &&
		action !== "reject-custom-edit" &&
		action !== "cancel"
	) {
		return null;
	}
	if (
		(action === "reject-template" || action === "reject-template-confirm") &&
		!template
	) {
		return null;
	}
	if (
		template &&
		action !== "reject-template" &&
		action !== "reject-template-confirm"
	) {
		return null;
	}

	return {
		action,
		scope,
		institutionId,
		...(template ? { template } : {}),
		...(reviewMessageId ? { reviewMessageId } : {}),
	};
}

export function escapeTelegramHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

export function buildReviewedCardStatus(input: {
	institutionId: number;
	decision: "approved" | "rejected";
	reviewerName: string | null;
}): string {
	const approved = input.decision === "approved";
	return [
		`${approved ? "✅" : "❌"} <b>${approved ? "APPROVED" : "REJECTED"} · #${input.institutionId}</b>`,
		`Reviewed by ${escapeTelegramHtml(input.reviewerName || "configured admin")}`,
	].join("\n");
}

export function getReviewBlockers(
	candidate: Pick<
		TelegramReviewCandidate,
		"qrImage" | "qrContent" | "address" | "coords" | "duplicateInstitutionId"
	>,
): string[] {
	const blockers: string[] = [];
	if (!candidate.qrImage?.trim()) blockers.push("QR image is missing");
	if (!candidate.qrContent?.trim()) blockers.push("QR content is missing");
	if (!candidate.address?.trim()) blockers.push("address is missing");
	if (!candidate.coords) blockers.push("coordinates are missing");
	if (candidate.duplicateInstitutionId) {
		blockers.push(
			`QR content duplicates institution #${candidate.duplicateInstitutionId}`,
		);
	}
	return blockers;
}

function buildAdminUrl(baseUrl: string | null, institutionId: number) {
	if (!baseUrl) return null;
	try {
		return new URL(
			`/admin/institutions/pending/${institutionId}`,
			baseUrl,
		).toString();
	} catch {
		return null;
	}
}

function callbackButton(
	text: string,
	action: ReviewCallback["action"],
	scope: TelegramReviewScope,
	institutionId: number,
): TelegramInlineButton {
	return {
		text,
		callback_data: encodeReviewCallback({ action, scope, institutionId }),
	};
}

export function buildReviewCard(
	candidate: TelegramReviewCandidate,
	scope: TelegramReviewScope,
	options: { adminBaseUrl: string | null },
): {
	caption: string;
	qrFollowUpText: string | null;
	replyMarkup: TelegramInlineKeyboard;
} {
	const blockers = getReviewBlockers(candidate);
	const isImport =
		Boolean(candidate.sourceUrl) && !candidate.sourceUrl?.startsWith("http");
	const label = isImport ? "BULK IMPORT" : "COMMUNITY SUBMISSION";
	const submittedAt = candidate.createdAt.toLocaleString("en-MY", {
		timeZone: "Asia/Kuala_Lumpur",
		dateStyle: "medium",
		timeStyle: "short",
	});
	const payments = candidate.supportedPayment?.length
		? candidate.supportedPayment.join(", ")
		: "Not specified";
	const baseLines = [
		`<b>${label} · #${candidate.id}</b>`,
		`<b>${escapeTelegramHtml(candidate.name)}</b>`,
		"",
		`${escapeTelegramHtml(candidate.category)} · ${escapeTelegramHtml(candidate.city)}, ${escapeTelegramHtml(candidate.state)}`,
		`Address: ${escapeTelegramHtml(candidate.address || "Not provided")}`,
		`Payment: ${escapeTelegramHtml(payments)}`,
		`Submitted: ${escapeTelegramHtml(submittedAt)}`,
		`Contributor: ${escapeTelegramHtml(candidate.contributorName || (isImport ? "Automated import" : "Unknown"))}`,
		"",
		blockers.length === 0
			? "✅ <b>Ready for quick review</b>"
			: `⚠️ <b>Needs web review</b>\n${blockers.map((blocker) => `• ${escapeTelegramHtml(blocker)}`).join("\n")}`,
		`Queue: ${candidate.position} of ${candidate.total}`,
	];

	const escapedQr = candidate.qrContent
		? escapeTelegramHtml(candidate.qrContent)
		: null;
	const captionWithQr = escapedQr
		? [...baseLines, "", "<b>QR payload</b>", `<code>${escapedQr}</code>`].join(
				"\n",
			)
		: baseLines.join("\n");
	const qrFollowUpText =
		captionWithQr.length <= MAX_PHOTO_CAPTION_LENGTH || !escapedQr
			? null
			: `<b>QR payload · #${candidate.id}</b>\n<code>${escapedQr}</code>`;
	const caption =
		captionWithQr.length <= MAX_PHOTO_CAPTION_LENGTH
			? captionWithQr
			: [...baseLines, "", "QR payload is in the message below."].join("\n");

	const firstRow: TelegramInlineButton[] = [];
	if (blockers.length === 0) {
		firstRow.push(callbackButton("✅ Approve", "approve", scope, candidate.id));
	}
	firstRow.push(callbackButton("❌ Reject", "reject", scope, candidate.id));

	const secondRow = [callbackButton("⏭ Skip", "next", scope, candidate.id)];
	const adminUrl = buildAdminUrl(options.adminBaseUrl, candidate.id);
	if (adminUrl) secondRow.push({ text: "✏️ Edit in admin", url: adminUrl });

	return {
		caption,
		qrFollowUpText,
		replyMarkup: { inline_keyboard: [firstRow, secondRow] },
	};
}

function templateButton(
	key: RejectionTemplateKey,
	institutionId: number,
	scope: TelegramReviewScope,
): TelegramInlineButton {
	return {
		text: REJECTION_TEMPLATE_LABELS[key],
		callback_data: encodeReviewCallback({
			action: "reject-template",
			scope,
			institutionId,
			template: key,
		}),
	};
}

export function buildRejectionMenu(
	institutionId: number,
	scope: TelegramReviewScope,
): TelegramInlineKeyboard {
	return {
		inline_keyboard: [
			[
				templateButton("unclear", institutionId, scope),
				templateButton("individual", institutionId, scope),
			],
			[templateButton("duplicate", institutionId, scope)],
			[
				callbackButton(
					"✍️ Custom reason",
					"reject-custom",
					scope,
					institutionId,
				),
			],
			[callbackButton("↩️ Cancel", "cancel", scope, institutionId)],
		],
	};
}

export function buildApprovalConfirmation(
	institutionId: number,
	scope: TelegramReviewScope,
): TelegramInlineKeyboard {
	return {
		inline_keyboard: [
			[
				callbackButton(
					"✅ Confirm approval",
					"approve-confirm",
					scope,
					institutionId,
				),
				callbackButton("↩️ Cancel", "cancel", scope, institutionId),
			],
		],
	};
}

export function buildTemplateRejectionConfirmation(
	institutionId: number,
	scope: TelegramReviewScope,
	template: RejectionTemplateKey,
): TelegramInlineKeyboard {
	return {
		inline_keyboard: [
			[
				{
					text: "❌ Confirm rejection",
					callback_data: encodeReviewCallback({
						action: "reject-template-confirm",
						scope,
						institutionId,
						template,
					}),
				},
				callbackButton("↩️ Cancel", "cancel", scope, institutionId),
			],
		],
	};
}

export function buildCustomReasonPrompt(
	institutionId: number,
	scope: TelegramReviewScope,
	reviewMessageId: number,
): string {
	return `Reply with a custom rejection reason for #${institutionId} [${scope}:${reviewMessageId}].`;
}

export function parseCustomReasonPrompt(text: string): {
	institutionId: number;
	scope: TelegramReviewScope;
	reviewMessageId: number;
} | null {
	const match = text.match(
		/^Reply with a custom rejection reason for #(\d+) \[(community|imports|all):(\d+)\]\.$/,
	);
	if (!match) return null;
	const institutionId = Number(match[1]);
	const scope = match[2] as TelegramReviewScope;
	const reviewMessageId = Number(match[3]);
	return Number.isInteger(institutionId) &&
		institutionId > 0 &&
		Number.isInteger(reviewMessageId) &&
		reviewMessageId > 0
		? { institutionId, scope, reviewMessageId }
		: null;
}

const CUSTOM_REASON_PREFIX = "Custom rejection reason for";

export function buildCustomReasonConfirmation(
	institutionId: number,
	scope: TelegramReviewScope,
	reason: string,
	reviewMessageId?: number,
): {
	text: string;
	plainText: string;
	replyMarkup: TelegramInlineKeyboard;
} {
	const normalizedReason = reason.trim();
	const heading = `${CUSTOM_REASON_PREFIX} #${institutionId}:`;
	return {
		text: `<b>${heading}</b>\n\n${escapeTelegramHtml(normalizedReason)}`,
		plainText: `${heading}\n\n${normalizedReason}`,
		replyMarkup: {
			inline_keyboard: [
				[
					{
						text: "❌ Confirm rejection",
						callback_data: encodeReviewCallback({
							action: "reject-custom-confirm",
							scope,
							institutionId,
							...(reviewMessageId ? { reviewMessageId } : {}),
						}),
					},
					{
						text: "✏️ Edit reason",
						callback_data: encodeReviewCallback({
							action: "reject-custom-edit",
							scope,
							institutionId,
							...(reviewMessageId ? { reviewMessageId } : {}),
						}),
					},
				],
				[
					{
						text: "↩️ Cancel",
						callback_data: encodeReviewCallback({
							action: "cancel",
							scope,
							institutionId,
							...(reviewMessageId ? { reviewMessageId } : {}),
						}),
					},
				],
			],
		},
	};
}

export function extractCustomReason(
	messageText: string,
	institutionId: number,
): string | null {
	const prefix = `${CUSTOM_REASON_PREFIX} #${institutionId}:\n\n`;
	if (!messageText.startsWith(prefix)) return null;
	const reason = messageText.slice(prefix.length).trim();
	return reason || null;
}
