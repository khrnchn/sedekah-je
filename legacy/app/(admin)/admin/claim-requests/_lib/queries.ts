import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { claimRequests, institutions, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { unstable_cache } from "@/lib/unstable-cache";

function normalizeParam(v: string | string[] | undefined): string {
	if (v === undefined || v === null) return "";
	if (Array.isArray(v)) return (v[0] ?? "").trim();
	return String(v).trim();
}

/** Escape %, _, and \ for safe use in SQL LIKE patterns (PostgreSQL default escape: \). */
function escapeLike(term: string): string {
	return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const STATUS_VALUES = ["pending", "approved", "rejected"] as const;

const getPendingClaimRequestsCountInternal = unstable_cache(
	async () => {
		const result = await db
			.select({ count: count() })
			.from(claimRequests)
			.where(eq(claimRequests.status, "pending"));

		return result[0]?.count || 0;
	},
	["pending-claim-requests-count"],
	{
		revalidate: 60, // 1 minute
		tags: ["claim-requests", "claim-requests-count"],
	},
);

export async function getPendingClaimRequestsCount() {
	await requireAdminSession();
	return getPendingClaimRequestsCountInternal();
}

/**
 * Fetch claim requests with server-side search, status filter, and pagination.
 */
export async function getClaimRequestsPaginated(searchParams: {
	[key: string]: string | string[] | undefined;
}) {
	await requireAdminSession();

	const qNorm = normalizeParam(searchParams.q);
	const rawPage = Number.parseInt(normalizeParam(searchParams.page), 10);
	const rawLimit = Number.parseInt(normalizeParam(searchParams.limit), 10);
	const pageNumber = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
	const pageLimit = Number.isFinite(rawLimit)
		? Math.min(100, Math.max(1, rawLimit))
		: 10;
	const pageNorm = String(pageNumber);
	const limitNorm = String(pageLimit);
	const statusNorm = normalizeParam(searchParams.status);

	return unstable_cache(
		async () => {
			const offset = (pageNumber - 1) * pageLimit;

			const conditions = [];
			if (qNorm) {
				const escaped = escapeLike(qNorm);
				const searchCond = or(
					ilike(institutions.name, `%${escaped}%`),
					ilike(users.name, `%${escaped}%`),
				);
				if (searchCond) conditions.push(searchCond);
			}
			if (
				statusNorm &&
				statusNorm !== "all" &&
				STATUS_VALUES.includes(statusNorm as (typeof STATUS_VALUES)[number])
			) {
				conditions.push(
					eq(
						claimRequests.status,
						statusNorm as (typeof STATUS_VALUES)[number],
					),
				);
			}
			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			const [dataQuery, countQuery] = await Promise.all([
				db
					.select({
						id: claimRequests.id,
						institutionId: claimRequests.institutionId,
						institutionName: institutions.name,
						institutionCategory: institutions.category,
						userId: claimRequests.userId,
						userName: users.name,
						userEmail: users.email,
						sourceUrl: claimRequests.sourceUrl,
						description: claimRequests.description,
						status: claimRequests.status,
						adminNotes: claimRequests.adminNotes,
						reviewedBy: claimRequests.reviewedBy,
						reviewedAt: claimRequests.reviewedAt,
						createdAt: claimRequests.createdAt,
						reviewerName: sql<string | null>`(
							select ${users.name}
							from ${users}
							where ${users.id} = ${claimRequests.reviewedBy}
							limit 1
						)`,
					})
					.from(claimRequests)
					.innerJoin(
						institutions,
						eq(claimRequests.institutionId, institutions.id),
					)
					.innerJoin(users, eq(claimRequests.userId, users.id))
					.where(whereClause)
					.orderBy(desc(claimRequests.createdAt), desc(claimRequests.id))
					.offset(offset)
					.limit(pageLimit),
				db
					.select({ count: count() })
					.from(claimRequests)
					.innerJoin(
						institutions,
						eq(claimRequests.institutionId, institutions.id),
					)
					.innerJoin(users, eq(claimRequests.userId, users.id))
					.where(whereClause),
			]);

			const total = countQuery[0]?.count ?? 0;

			return {
				claimRequests: dataQuery,
				total,
				limit: pageLimit,
				offset,
			};
		},
		["claim-requests-paginated", qNorm, pageNorm, limitNorm, statusNorm],
		{
			tags: ["claim-requests", "claim-requests-data"],
			revalidate: 60,
		},
	)();
}

const getPendingClaimRequestsInternal = unstable_cache(
	async () => {
		return await db
			.select({
				id: claimRequests.id,
				institutionId: claimRequests.institutionId,
				institutionName: institutions.name,
				institutionCategory: institutions.category,
				userId: claimRequests.userId,
				userName: users.name,
				userEmail: users.email,
				sourceUrl: claimRequests.sourceUrl,
				description: claimRequests.description,
				status: claimRequests.status,
				createdAt: claimRequests.createdAt,
			})
			.from(claimRequests)
			.innerJoin(institutions, eq(claimRequests.institutionId, institutions.id))
			.innerJoin(users, eq(claimRequests.userId, users.id))
			.where(eq(claimRequests.status, "pending"))
			.orderBy(desc(claimRequests.createdAt));
	},
	["pending-claim-requests"],
	{
		revalidate: 60, // 1 minute
		tags: ["claim-requests", "claim-requests-data"],
	},
);

export async function getPendingClaimRequests() {
	await requireAdminSession();
	return getPendingClaimRequestsInternal();
}

export async function getClaimRequestById(id: number) {
	await requireAdminSession();

	const result = await db
		.select({
			id: claimRequests.id,
			institutionId: claimRequests.institutionId,
			institutionName: institutions.name,
			institutionCategory: institutions.category,
			institutionState: institutions.state,
			institutionCity: institutions.city,
			institutionContributorId: institutions.contributorId,
			userId: claimRequests.userId,
			userName: users.name,
			userEmail: users.email,
			sourceUrl: claimRequests.sourceUrl,
			description: claimRequests.description,
			status: claimRequests.status,
			adminNotes: claimRequests.adminNotes,
			reviewedBy: claimRequests.reviewedBy,
			reviewedAt: claimRequests.reviewedAt,
			createdAt: claimRequests.createdAt,
		})
		.from(claimRequests)
		.innerJoin(institutions, eq(claimRequests.institutionId, institutions.id))
		.innerJoin(users, eq(claimRequests.userId, users.id))
		.where(eq(claimRequests.id, id))
		.limit(1);

	return result[0] || null;
}
