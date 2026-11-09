import type { categories, states } from "@/lib/institution-constants";
import { normalizeMalaysianState } from "@/lib/integrations/geocode";
import { toTitleCase } from "@/lib/utils";

export type DuitNowPrefill = {
	name?: string;
	category?: (typeof categories)[number];
	state?: (typeof states)[number];
};

// DuitNow QRs follow EMVCo: a chain of [2-digit tag][2-digit length][value],
// where length counts bytes. Tag 59 is the recipient name registered with the
// bank (max 25 chars, so long names come out cut off). Tag 60 is meant to be
// the city but is often "MY" or a state, so it is only used as a state.
// This is a typing shortcut, not proof the account belongs to the institution.
export function readDuitNowPrefill(payload: string): DuitNowPrefill | null {
	const bytes = new TextEncoder().encode(payload);
	const decoder = new TextDecoder();
	const fields = new Map<string, string>();
	let offset = 0;
	while (offset < bytes.length) {
		const header = decoder.decode(bytes.subarray(offset, offset + 4));
		if (!/^\d{4}$/.test(header)) return null;
		const length = Number(header.slice(2));
		offset += 4;
		if (!length || offset + length > bytes.length) return null;
		fields.set(
			header.slice(0, 2),
			decoder.decode(bytes.subarray(offset, offset + length)),
		);
		offset += length;
	}

	const recipient = fields.get("59")?.trim() ?? "";
	const category = /\b(masjid|msjd|mjd|mosque)\b/i.test(recipient)
		? "masjid"
		: /\b(surau|musolla|musalla)\b/i.test(recipient)
			? "surau"
			: /\b(tahfiz|maahad|madrasah|pondok)\b/i.test(recipient)
				? "tahfiz"
				: undefined;
	// Personal or generic account names ("AHMAD BIN ALI") would be wrong as an
	// institution name, so only names with an institution word are used.
	const looksInstitutional =
		category !== undefined ||
		/\b(pusat|yayasan|persatuan|maktab|kompleks|rumah|sekolah)\b/i.test(
			recipient,
		);
	const state = normalizeMalaysianState(fields.get("60")) ?? undefined;

	const prefill: DuitNowPrefill = {
		name: looksInstitutional ? toTitleCase(recipient) : undefined,
		category,
		state,
	};
	return prefill.name || prefill.category || prefill.state ? prefill : null;
}
