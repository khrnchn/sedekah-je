"use server";

import { and, asc, count, desc, eq, gt, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";

/**
 * Get the next pending institution ID in canonical order (createdAt DESC, id DESC).
 * Used for Save & Next flow. Returns null if no next pending exists.
 */
export async function getNextPendingInstitutionId(
	currentId: number,
): Promise<number | null> {
	await requireAdminSession();

	const [current] = await db
		.select({ id: institutions.id, createdAt: institutions.createdAt })
		.from(institutions)
		.where(
			and(eq(institutions.id, currentId), eq(institutions.status, "pending")),
		)
		.limit(1);

	// Next row: createdAt < curr OR (createdAt = curr AND id < curr), ordered DESC
	const nextCondition = current
		? or(
				lt(institutions.createdAt, current.createdAt),
				and(
					eq(institutions.createdAt, current.createdAt),
					lt(institutions.id, current.id),
				),
			)
		: sql`true`; // Fallback: current not pending, take first pending

	const [next] = await db
		.select({ id: institutions.id })
		.from(institutions)
		.where(
			and(
				eq(institutions.status, "pending"),
				ne(institutions.id, currentId),
				nextCondition,
			),
		)
		.orderBy(desc(institutions.createdAt), desc(institutions.id))
		.limit(1);

	return next?.id ?? null;
}

/**
 * Get the previous pending institution ID in canonical order (createdAt DESC, id DESC).
 * Returns null if no previous pending exists.
 */
export async function getPrevPendingInstitutionId(
	currentId: number,
): Promise<number | null> {
	await requireAdminSession();

	const [current] = await db
		.select({ id: institutions.id, createdAt: institutions.createdAt })
		.from(institutions)
		.where(
			and(eq(institutions.id, currentId), eq(institutions.status, "pending")),
		)
		.limit(1);

	// Prev row: createdAt > curr OR (createdAt = curr AND id > curr), ordered ASC
	const prevCondition = current
		? or(
				gt(institutions.createdAt, current.createdAt),
				and(
					eq(institutions.createdAt, current.createdAt),
					gt(institutions.id, current.id),
				),
			)
		: sql`false`;

	const [prev] = await db
		.select({ id: institutions.id })
		.from(institutions)
		.where(
			and(
				eq(institutions.status, "pending"),
				ne(institutions.id, currentId),
				prevCondition,
			),
		)
		.orderBy(asc(institutions.createdAt), asc(institutions.id))
		.limit(1);

	return prev?.id ?? null;
}

/**
 * Get the next pending institution to review after approving the given ID.
 * Used when approving the last item (nextId was null) - returns the "previous"
 * in display order using fresh DB state.
 */
export async function getNextToReviewAfterApproving(
	approvedId: number,
): Promise<number | null> {
	await requireAdminSession();

	const [approved] = await db
		.select({ createdAt: institutions.createdAt, id: institutions.id })
		.from(institutions)
		.where(eq(institutions.id, approvedId))
		.limit(1);

	if (!approved) return null;

	// Prev in display order (createdAt DESC): larger createdAt or same + larger id
	const prevCondition = or(
		gt(institutions.createdAt, approved.createdAt),
		and(
			eq(institutions.createdAt, approved.createdAt),
			gt(institutions.id, approved.id),
		),
	);

	const [prev] = await db
		.select({ id: institutions.id })
		.from(institutions)
		.where(and(eq(institutions.status, "pending"), prevCondition))
		.orderBy(asc(institutions.createdAt), asc(institutions.id))
		.limit(1);

	return prev?.id ?? null;
}

/**
 * Get the position and total count of pending institutions in canonical order.
 */
export async function getPendingInstitutionPosition(
	currentId: number,
): Promise<{
	position: number;
	total: number;
}> {
	await requireAdminSession();

	const [current] = await db
		.select({ id: institutions.id, createdAt: institutions.createdAt })
		.from(institutions)
		.where(
			and(eq(institutions.id, currentId), eq(institutions.status, "pending")),
		)
		.limit(1);

	const prevCondition = current
		? or(
				gt(institutions.createdAt, current.createdAt),
				and(
					eq(institutions.createdAt, current.createdAt),
					gt(institutions.id, current.id),
				),
			)
		: sql`false`;

	const [countBeforeResult, totalResult] = await Promise.all([
		db
			.select({ count: count() })
			.from(institutions)
			.where(
				and(
					eq(institutions.status, "pending"),
					ne(institutions.id, currentId),
					prevCondition,
				),
			),
		db
			.select({ count: count() })
			.from(institutions)
			.where(eq(institutions.status, "pending")),
	]);

	const countBefore = countBeforeResult[0]?.count ?? 0;
	const total = totalResult[0]?.count ?? 0;
	const position = current ? countBefore + 1 : 0;

	return { position, total };
}
