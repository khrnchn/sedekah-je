import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { verifications } from "@/db/schema";

export type MetaDeletionStatus =
	| "in_progress"
	| "complete"
	| "error"
	| "expired";

const META_DELETION_IDENTIFIER = "meta:data-deletion";

type MetaDeletionJobPayload = {
	userId: string;
	status: Exclude<MetaDeletionStatus, "expired">;
	error?: string;
	createdAt: string;
	updatedAt: string;
};

function toIdentifier(confirmationCode: string): string {
	return `${META_DELETION_IDENTIFIER}:${confirmationCode}`;
}

export async function createMetaDeletionJob(params: {
	confirmationCode: string;
	userId: string;
	status: Exclude<MetaDeletionStatus, "expired">;
	error?: string;
}): Promise<void> {
	const now = new Date();
	const expiresAt = new Date(now);
	expiresAt.setDate(expiresAt.getDate() + 30);

	const payload: MetaDeletionJobPayload = {
		userId: params.userId,
		status: params.status,
		error: params.error,
		createdAt: now.toISOString(),
		updatedAt: now.toISOString(),
	};

	await db.insert(verifications).values({
		id: params.confirmationCode,
		identifier: toIdentifier(params.confirmationCode),
		value: JSON.stringify(payload),
		expiresAt,
	});
}

export async function updateMetaDeletionJob(params: {
	confirmationCode: string;
	status: Exclude<MetaDeletionStatus, "expired">;
	error?: string;
}): Promise<void> {
	const rows = await db
		.select({
			value: verifications.value,
		})
		.from(verifications)
		.where(
			and(
				eq(verifications.id, params.confirmationCode),
				eq(verifications.identifier, toIdentifier(params.confirmationCode)),
			),
		)
		.limit(1);

	const existing = rows[0];
	if (!existing) return;

	let payload: MetaDeletionJobPayload;
	try {
		payload = JSON.parse(existing.value) as MetaDeletionJobPayload;
	} catch {
		payload = {
			userId: "unknown",
			status: "error",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
	}

	await db
		.update(verifications)
		.set({
			value: JSON.stringify({
				...payload,
				status: params.status,
				error: params.error,
				updatedAt: new Date().toISOString(),
			}),
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(verifications.id, params.confirmationCode),
				eq(verifications.identifier, toIdentifier(params.confirmationCode)),
			),
		);
}

export async function getMetaDeletionJobStatus(
	confirmationCode: string,
): Promise<{ confirmationCode: string; status: MetaDeletionStatus } | null> {
	const rows = await db
		.select({
			id: verifications.id,
			identifier: verifications.identifier,
			value: verifications.value,
			expiresAt: verifications.expiresAt,
		})
		.from(verifications)
		.where(
			and(
				eq(verifications.id, confirmationCode),
				eq(verifications.identifier, toIdentifier(confirmationCode)),
			),
		)
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	if (row.expiresAt.getTime() <= Date.now()) {
		return { confirmationCode, status: "expired" };
	}

	try {
		const payload = JSON.parse(row.value) as MetaDeletionJobPayload;
		if (payload.status === "in_progress" || payload.status === "complete") {
			return { confirmationCode, status: payload.status };
		}
		return { confirmationCode, status: "error" };
	} catch {
		return { confirmationCode, status: "error" };
	}
}
