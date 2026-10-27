import { createHash } from "node:crypto";
import { z } from "zod";

export const assessmentSchema = z
	.object({
		imageType: z.enum([
			"physical_photo",
			"digital_artwork",
			"screenshot",
			"unclear",
		]),
		visibleInstitution: z.string().max(500),
		visibleLocation: z.string().max(500),
		recipientRelationship: z.enum(["institution", "individual", "unclear"]),
		conflicts: z.array(z.string().max(300)).max(8),
		explanation: z.string().max(800),
	})
	.strict();
export type Assessment = z.infer<typeof assessmentSchema>;
export type ReviewMetadata = {
	held?: boolean;
	evidence?: {
		version: string;
		recipientInstitution: true;
		imageHash?: string;
		physicalDisplay?: true;
		officialSource?: string;
	};
	differentInstitutions?: {
		version: string;
		ids: number[];
		versions?: Record<string, string>;
	};
	analysis?: {
		version: string;
		key?: string;
		state: "queued" | "processing" | "complete" | "unavailable";
		model: string;
		promptVersion?: string;
		attempts: number;
		leaseUntil?: number;
		claim?: string;
		result?: Assessment;
		error?: string;
	};
	history?: Array<{
		at: string;
		actor: string;
		action: string;
		before?: unknown;
		after?: unknown;
	}>;
};
export type EvidenceRecord = {
	name: string;
	category: string;
	city: string;
	state: string;
	address: string | null;
	coords: [number, number] | null;
	qrImage: string | null;
	qrContent: string | null;
	supportedPayment: string[] | null;
	reviewMetadata?: ReviewMetadata | null;
	status?: string;
	reviewedAt?: Date | null;
	updatedAt?: Date | null;
};
export function reviewVersion(row: EvidenceRecord): string {
	return createHash("sha256")
		.update(
			JSON.stringify([
				row.name,
				row.category,
				row.city,
				row.state,
				row.address,
				row.coords,
				row.qrImage,
				row.qrContent,
				row.supportedPayment,
			]),
		)
		.digest("hex");
}
export function operationVersion(row: EvidenceRecord): string {
	return createHash("sha256")
		.update(
			JSON.stringify([
				reviewVersion(row),
				row.reviewMetadata?.held,
				row.reviewMetadata?.evidence,
				row.reviewMetadata?.differentInstitutions,
				row.reviewMetadata?.history?.length,
				row.status,
				row.reviewedAt,
				row.updatedAt,
			]),
		)
		.digest("hex");
}
export function crc16(value: string): string {
	let crc = 0xffff;
	for (const byte of Buffer.from(value, "utf8")) {
		crc ^= byte << 8;
		for (let bit = 0; bit < 8; bit++)
			crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
	}
	return crc.toString(16).toUpperCase().padStart(4, "0");
}
function parseTlv(bytes: Buffer): Map<string, string> | null {
	const fields = new Map<string, string>();
	let offset = 0;
	while (offset < bytes.length) {
		const header = bytes.subarray(offset, offset + 4).toString("ascii");
		if (!/^\d{4}$/.test(header)) return null;
		const id = header.slice(0, 2),
			length = Number(header.slice(2));
		offset += 4;
		if (!length || offset + length > bytes.length || fields.has(id))
			return null;
		fields.set(id, bytes.subarray(offset, offset + length).toString("utf8"));
		offset += length;
	}
	return fields;
}
export function inspectDuitNow(payload: string | null) {
	const invalid = {
		valid: false,
		recipient: null as string | null,
		checksum: "invalid",
		format: "unsupported",
	};
	if (!payload) return { ...invalid, checksum: "missing" };
	const fields = parseTlv(Buffer.from(payload));
	if (!fields) return invalid;
	const recipient = fields.get("59") ?? null;
	const duitnow = [...fields].some(
		([tag, value]) =>
			Number(tag) >= 26 &&
			Number(tag) <= 51 &&
			parseTlv(Buffer.from(value))?.get("00") === "A0000006150001",
	);
	const checksum =
		/6304[0-9a-f]{4}$/i.test(payload) &&
		crc16(payload.slice(0, -4)) === payload.slice(-4).toUpperCase();
	const valid =
		duitnow &&
		// PayNet DuitNow QR uses payload format indicator 02 (EMV tag 00).
		fields.get("00") === "02" &&
		fields.get("53") === "458" &&
		fields.get("58") === "MY" &&
		!!recipient &&
		/^\d{4}$/.test(fields.get("52") ?? "") &&
		fields.has("60") &&
		checksum;
	return {
		valid,
		recipient,
		checksum: checksum ? "valid" : "invalid",
		format: duitnow ? "DuitNow" : "unsupported",
	};
}
function words(name: string) {
	const aliases: Record<string, string> = {
		mjd: "masjid",
		msjd: "masjid",
		kg: "kampung",
		jln: "jalan",
		s: "surau",
	};
	return name
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim()
		.split(/\s+/)
		.map((w) => aliases[w] ?? w);
}
export function compareRecipient(name: string, recipient: string | null) {
	if (!recipient) return "unavailable";
	const a = words(name),
		b = words(recipient);
	if (
		b.length < 2 ||
		b.every((w) =>
			["masjid", "surau", "tabung", "derma", "tahfiz", "ngo"].includes(w),
		)
	)
		return "manual confirmation required";
	return a.join(" ") === b.join(" ")
		? "name matches; confirm ownership"
		: "different or truncated name; confirm manually";
}
export type DuplicateCandidate = {
	id: number;
	name: string;
	city: string;
	state: string;
	address: string | null;
	coords: [number, number] | null;
	qrImage: string | null;
	qrContent: string | null;
	status: string;
	reason: "exact_payload" | "similar_name" | "nearby";
	version?: string;
};
export function metres(a: [number, number], b: [number, number]) {
	const rad = Math.PI / 180;
	const h =
		Math.sin(((a[0] - b[0]) * rad) / 2) ** 2 +
		Math.cos(a[0] * rad) *
			Math.cos(b[0] * rad) *
			Math.sin(((a[1] - b[1]) * rad) / 2) ** 2;
	return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function similarInstitutionNames(a: string, b: string) {
	const x = words(a),
		y = words(b);
	const common = x.filter((w) => y.includes(w)).length;
	return common / Math.max(x.length, y.length) >= 0.7;
}
export function telegramApprovalBlockers(
	row: EvidenceRecord,
	duplicates: DuplicateCandidate[],
): string[] {
	const qr = inspectDuitNow(row.qrContent),
		meta = row.reviewMetadata;
	const evidence =
		meta?.evidence?.version === reviewVersion(row) ? meta.evidence : undefined;
	const blockers: string[] = [];
	if (!row.qrImage || !qr.valid)
		blockers.push(
			"A valid DuitNow QR image and checksum are required; other formats need web review",
		);
	if (!row.address?.trim() || !row.coords)
		blockers.push("Complete address and coordinates are required");
	if (meta?.held) blockers.push("Resume this held submission first");
	if (!evidence?.recipientInstitution)
		blockers.push(
			"Confirm recipient belongs to this institution and is not an individual",
		);
	if (
		!evidence?.physicalDisplay &&
		!(
			["kebajikan", "tahfiz"].includes(row.category) && evidence?.officialSource
		)
	)
		blockers.push(
			"Confirm physical display, or verify an official source URL for NGO/tahfiz artwork",
		);
	if (duplicates.some((d) => d.reason === "exact_payload"))
		blockers.push("Exact payload duplicate blocks quick approval");
	const decided =
		meta?.differentInstitutions?.version === reviewVersion(row)
			? meta.differentInstitutions.ids
			: [];
	if (
		duplicates.some(
			(d) =>
				d.reason !== "exact_payload" &&
				(!decided.includes(d.id) ||
					!d.version ||
					meta?.differentInstitutions?.versions?.[String(d.id)] !== d.version),
		)
	)
		blockers.push("Compare suspected duplicates and explicitly decide");
	return blockers;
}
