export type ReviewBlockerCode =
	| "qr-image"
	| "qr-content"
	| "address"
	| "coords"
	| "duplicate";

export type ReviewBlocker = {
	code: ReviewBlockerCode;
	/** Only set when code is "duplicate". */
	duplicateInstitutionId?: number;
};

export type ReviewBlockerInput = {
	qrImage: string | null;
	qrContent: string | null;
	address: string | null;
	coords: [number, number] | null;
	duplicateInstitutionId: number | null;
};

/**
 * What stops a pending institution from being approved. Shared by the Telegram
 * bot's approval gate and the web admin queue, which render the same rule
 * differently, so keep this module free of imports and formatting.
 */
export function getReviewBlockerCodes(
	input: ReviewBlockerInput,
): ReviewBlocker[] {
	const blockers: ReviewBlocker[] = [];
	if (!input.qrImage?.trim()) blockers.push({ code: "qr-image" });
	if (!input.qrContent?.trim()) blockers.push({ code: "qr-content" });
	if (!input.address?.trim()) blockers.push({ code: "address" });
	if (!input.coords) blockers.push({ code: "coords" });
	if (input.duplicateInstitutionId) {
		blockers.push({
			code: "duplicate",
			duplicateInstitutionId: input.duplicateInstitutionId,
		});
	}
	return blockers;
}
