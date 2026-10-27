import { randomUUID } from "node:crypto";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { institutions, telegramReviewOperations, users } from "@/db/schema";
import { assertActiveAdminReviewer } from "@/lib/features/institution-review/review-core";
import {
	type DuplicateCandidate,
	type EvidenceRecord,
	metres,
	operationVersion,
	type ReviewMetadata,
	reviewVersion,
	similarInstitutionNames,
} from "@/lib/features/institution-review/telegram-evidence";

export type OperationBinding = {
	id: string;
	chatId: string;
	promptMessageId: number;
};
export async function findReviewDuplicates(
	row: Pick<EvidenceRecord, "name" | "state" | "coords" | "qrContent"> & {
		id: number;
	},
	store: Pick<typeof db, "select"> = db,
): Promise<DuplicateCandidate[]> {
	const candidates = await store
		.select()
		.from(institutions)
		.where(
			and(
				sql`${institutions.id} <> ${row.id} AND ${institutions.status} <> 'rejected'`,
				or(
					sql`${institutions.state} = ${row.state}`,
					row.qrContent
						? eq(institutions.qrContent, row.qrContent)
						: sql`false`,
					row.coords
						? sql`${institutions.status} = 'approved' and ${institutions.coords} is not null and abs((${institutions.coords}->>0)::float - ${row.coords[0]}) < 0.003 and abs((${institutions.coords}->>1)::float - ${row.coords[1]}) < 0.004`
						: sql`false`,
				),
			),
		);
	return candidates.flatMap((other) => {
		const reason =
			row.qrContent?.trim() && row.qrContent === other.qrContent
				? "exact_payload"
				: row.state === other.state &&
						similarInstitutionNames(row.name, other.name)
					? "similar_name"
					: row.coords &&
							other.coords &&
							other.status === "approved" &&
							metres(row.coords, other.coords) <= 300
						? "nearby"
						: null;
		return reason
			? [
					{
						id: other.id,
						version: reviewVersion(other),
						name: other.name,
						city: other.city,
						state: other.state,
						address: other.address,
						coords: other.coords,
						qrImage: other.qrImage,
						qrContent: other.qrContent,
						status: other.status,
						reason,
					},
				]
			: [];
	});
}
export async function createReviewOperation(input: {
	chatId: string;
	institutionId: number;
	promptMessageId: number;
	version: string;
	kind: string;
	payload?: Record<string, unknown>;
}) {
	const id = randomUUID().replaceAll("-", "");
	await db.insert(telegramReviewOperations).values({
		...input,
		id,
		payload: input.payload ?? {},
		expiresAt: new Date(Date.now() + 15 * 60_000),
	});
	return id;
}
export async function getReplyOperation(
	chatId: string,
	promptMessageId: number,
): Promise<typeof telegramReviewOperations.$inferSelect | undefined> {
	const [op] = await db
		.select()
		.from(telegramReviewOperations)
		.where(
			and(
				eq(telegramReviewOperations.chatId, chatId),
				eq(telegramReviewOperations.promptMessageId, promptMessageId),
				isNull(telegramReviewOperations.consumedAt),
				sql`${telegramReviewOperations.expiresAt} > now()`,
			),
		)
		.limit(1);
	return op;
}
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function consumeReviewOperation(
	tx: Tx,
	binding: OperationBinding,
	institutionId?: number,
) {
	const [op] = await tx
		.select()
		.from(telegramReviewOperations)
		.where(
			and(
				eq(telegramReviewOperations.id, binding.id),
				eq(telegramReviewOperations.chatId, binding.chatId),
				eq(telegramReviewOperations.promptMessageId, binding.promptMessageId),
				isNull(telegramReviewOperations.consumedAt),
				sql`${telegramReviewOperations.expiresAt} > now()`,
			),
		)
		.for("update");
	if (
		!op ||
		(institutionId !== undefined && op.institutionId !== institutionId)
	)
		throw new Error("Operation expired or already used");
	const [row] = await tx
		.select()
		.from(institutions)
		.where(eq(institutions.id, op.institutionId))
		.for("update");
	if (
		!row ||
		(op.kind === "undo"
			? row.status === "pending"
			: row.status !== "pending") ||
		operationVersion(row) !== op.version
	)
		throw new Error("Record changed; reopen its review card");
	await tx
		.update(telegramReviewOperations)
		.set({ consumedAt: new Date() })
		.where(eq(telegramReviewOperations.id, op.id));
	return { op, row };
}
export function appendReviewHistory(
	meta: ReviewMetadata | null,
	actor: string,
	action: string,
	before?: unknown,
	after?: unknown,
): ReviewMetadata {
	return {
		...meta,
		history: [
			...(meta?.history ?? []),
			{ at: new Date().toISOString(), actor, action, before, after },
		],
	};
}
export async function applyReviewOperation(
	binding: OperationBinding,
	actor: string,
	expectedKind?: string,
) {
	const result = await db.transaction(async (tx) => {
		const [reviewer] = await tx
			.select({
				role: users.role,
				isActive: users.isActive,
				banned: users.banned,
			})
			.from(users)
			.where(eq(users.id, actor));
		assertActiveAdminReviewer(reviewer ?? null);
		const { op, row } = await consumeReviewOperation(tx, binding);
		if (expectedKind && op.kind !== expectedKind)
			throw new Error("Wrong operation type");
		let meta = appendReviewHistory(
			row.reviewMetadata,
			actor,
			op.kind,
			{
				address: row.address,
				city: row.city,
				state: row.state,
				coords: row.coords,
				qrImage: row.qrImage,
				qrContent: row.qrContent,
			},
			op.payload,
		);
		let changes: Partial<typeof institutions.$inferInsert> = {};
		if (op.kind === "location" || op.kind === "qr") {
			changes = op.payload as typeof changes;
			// Payload is produced only by validated server-side preview builders.
			meta = {
				...meta,
				evidence: undefined,
				differentInstitutions: undefined,
				analysis: undefined,
			};
		} else if (op.kind === "evidence") {
			meta.evidence = {
				version: reviewVersion(row),
				recipientInstitution: true,
				...(typeof op.payload.imageHash === "string"
					? { imageHash: op.payload.imageHash }
					: {}),
				...(op.payload.physicalDisplay
					? { physicalDisplay: true as const }
					: {}),
				...(typeof op.payload.officialSource === "string"
					? { officialSource: op.payload.officialSource }
					: {}),
			};
		} else if (op.kind === "different") {
			const duplicates = await findReviewDuplicates(row, tx);
			const versions =
				typeof op.payload.versions === "object" && op.payload.versions !== null
					? (op.payload.versions as Record<string, unknown>)
					: {};
			const confirmed = duplicates.filter(
				(d) =>
					d.reason !== "exact_payload" &&
					Array.isArray(op.payload.ids) &&
					op.payload.ids.includes(d.id) &&
					d.version &&
					versions[String(d.id)] === d.version,
			);
			meta.differentInstitutions = {
				version: reviewVersion(row),
				ids: confirmed.map((d) => d.id),
				versions: Object.fromEntries(
					confirmed.map((d) => [String(d.id), d.version ?? ""]),
				),
			};
		} else if (op.kind === "hold" || op.kind === "resume")
			meta.held = op.kind === "hold";
		else if (op.kind !== "analysis-request")
			throw new Error("Unsupported operation");
		const [updated] = await tx
			.update(institutions)
			.set({ ...changes, reviewMetadata: meta, updatedAt: new Date() })
			.where(eq(institutions.id, row.id))
			.returning();
		return updated;
	});
	try {
		revalidateTag("pending-institutions", "max");
		revalidateTag("dashboard-data", "max");
	} catch {
		/* Long-polling dev mode has no Next.js cache context. */
	}
	return result;
}
