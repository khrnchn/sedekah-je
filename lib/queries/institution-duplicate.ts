import { eq } from "drizzle-orm";
import { db } from "@/db";
import { institutions } from "@/db/institutions";
import { normalizeInstitutionCategory } from "@/lib/institution-categories";

export type ExistingInstitution =
	| { id: number; status: "approved"; name: string; url: string }
	| { id: number; status: "pending" };

// Callers must supply an authenticated principal, never submitted attribution.
type DuplicateCaller = { kind: "partner" | "session"; id: string };

export async function findDuplicateQr(
	qrContent: string,
	caller: DuplicateCaller,
): Promise<{ existingInstitution?: ExistingInstitution } | null> {
	const matches = await db
		.select({
			id: institutions.id,
			name: institutions.name,
			slug: institutions.slug,
			category: institutions.category,
			status: institutions.status,
			partnerId: institutions.partnerId,
			contributorId: institutions.contributorId,
		})
		.from(institutions)
		.where(eq(institutions.qrContent, qrContent));

	function isOwnedPending(match: (typeof matches)[number]) {
		return (
			match.status === "pending" &&
			(caller.kind === "partner"
				? match.partnerId === caller.id
				: match.contributorId === caller.id)
		);
	}
	function priority(match: (typeof matches)[number]) {
		if (match.status === "approved") return 0;
		return isOwnedPending(match) ? 1 : 2;
	}
	const [existing] = matches.sort(
		(a, b) => priority(a) - priority(b) || a.id - b.id,
	);
	if (!existing) return null;
	if (existing.status === "approved") {
		return {
			existingInstitution: {
				id: existing.id,
				name: existing.name,
				status: "approved",
				url: `https://sedekah.je/${normalizeInstitutionCategory(existing.category)}/${existing.slug}`,
			},
		};
	}
	if (isOwnedPending(existing)) {
		return { existingInstitution: { id: existing.id, status: "pending" } };
	}
	// A duplicate exists, but no private record details may be disclosed.
	return {};
}
