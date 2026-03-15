"use server";

import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { categories, states } from "@/lib/institution-constants";

function normalizeParam(v: string | string[] | undefined): string {
	if (v === undefined || v === null) return "";
	if (Array.isArray(v)) return (v[0] ?? "").trim();
	return String(v).trim();
}

/** Escape %, _, and \ for safe use in SQL LIKE patterns (PostgreSQL default escape: \). */
function escapeLike(term: string): string {
	return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Fetch all institutions that are currently pending approval.
 * Joins contributor information when available for display purposes.
 * Uses larger limit for better client-side pagination performance.
 */
const getPendingInstitutionsInternal = unstable_cache(
	async () => {
		return await db
			.select({
				id: institutions.id,
				name: institutions.name,
				category: institutions.category,
				state: institutions.state,
				city: institutions.city,
				contributorName: users.name,
				contributorId: users.id,
				createdAt: institutions.createdAt,
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(eq(institutions.status, "pending"))
			.orderBy(desc(institutions.createdAt))
			.limit(1000); // Fetch up to 1000 records for client-side pagination
	},
	["pending-institutions-list"],
	{
		tags: ["institutions-data", "pending-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getPendingInstitutions() {
	await requireAdminSession();
	return getPendingInstitutionsInternal();
}

/**
 * Fetch all institutions that have been rejected.
 * Joins contributor information when available for display purposes.
 * Uses larger limit for better client-side pagination performance.
 */
const getRejectedInstitutionsInternal = unstable_cache(
	async () => {
		return await db
			.select({
				id: institutions.id,
				name: institutions.name,
				category: institutions.category,
				state: institutions.state,
				city: institutions.city,
				contributorName: users.name,
				contributorId: users.id,
				createdAt: institutions.createdAt,
				reviewedAt: institutions.reviewedAt,
				reviewedBy: institutions.reviewedBy,
				adminNotes: institutions.adminNotes,
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(eq(institutions.status, "rejected"))
			.orderBy(desc(institutions.createdAt))
			.limit(1000); // Fetch up to 1000 records for client-side pagination
	},
	["rejected-institutions-list"],
	{
		tags: ["institutions-data", "rejected-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getRejectedInstitutions() {
	await requireAdminSession();
	return getRejectedInstitutionsInternal();
}

/**
 * Fetch all institutions that have been approved.
 * Joins contributor information when available for display purposes.
 * Uses larger limit for better client-side pagination performance.
 */
const getApprovedInstitutionsInternal = unstable_cache(
	async () => {
		return await db
			.select({
				id: institutions.id,
				name: institutions.name,
				category: institutions.category,
				state: institutions.state,
				city: institutions.city,
				contributorName: users.name,
				contributorId: users.id,
				createdAt: institutions.createdAt,
				reviewedAt: institutions.reviewedAt,
				reviewedBy: institutions.reviewedBy,
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(eq(institutions.status, "approved"))
			.orderBy(desc(institutions.createdAt))
			.limit(1000); // Fetch up to 1000 records for client-side pagination
	},
	["approved-institutions-list"],
	{
		tags: ["institutions-data", "approved-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getApprovedInstitutions() {
	await requireAdminSession();
	return getApprovedInstitutionsInternal();
}

/**
 * Fetch approved institutions with server-side search, filtering, and pagination.
 * Queries across the entire database (no 1000-row limit).
 */
export async function getApprovedInstitutionsPaginated(searchParams: {
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
	const categoryNorm = normalizeParam(searchParams.category);
	const stateNorm = normalizeParam(searchParams.state);

	return unstable_cache(
		async () => {
			const offset = (pageNumber - 1) * pageLimit;

			const conditions = [eq(institutions.status, "approved")];
			if (qNorm) {
				const escaped = escapeLike(qNorm);
				conditions.push(ilike(institutions.name, `%${escaped}%`));
			}
			if (
				categoryNorm &&
				categoryNorm !== "all" &&
				(categories as readonly string[]).includes(categoryNorm)
			) {
				conditions.push(
					eq(
						institutions.category,
						categoryNorm as (typeof categories)[number],
					),
				);
			}
			if (
				stateNorm &&
				stateNorm !== "all" &&
				(states as readonly string[]).includes(stateNorm)
			) {
				conditions.push(
					eq(institutions.state, stateNorm as (typeof states)[number]),
				);
			}
			const whereClause = and(...conditions);

			const [dataQuery, countQuery] = await Promise.all([
				db
					.select({
						id: institutions.id,
						name: institutions.name,
						category: institutions.category,
						state: institutions.state,
						city: institutions.city,
						contributorName: users.name,
						contributorId: users.id,
						createdAt: institutions.createdAt,
						reviewedAt: institutions.reviewedAt,
						reviewedBy: institutions.reviewedBy,
						reviewerName: sql<string | null>`(
							select ${users.name}
							from ${users}
							where ${users.id} = ${institutions.reviewedBy}
							limit 1
						)`,
					})
					.from(institutions)
					.leftJoin(users, eq(institutions.contributorId, users.id))
					.where(whereClause)
					.orderBy(desc(institutions.createdAt), desc(institutions.id))
					.offset(offset)
					.limit(pageLimit),
				db.select({ count: count() }).from(institutions).where(whereClause),
			]);

			const total = countQuery[0]?.count ?? 0;

			return {
				institutions: dataQuery,
				total,
				limit: pageLimit,
				offset,
			};
		},
		[
			"approved-institutions-paginated",
			qNorm,
			pageNorm,
			limitNorm,
			categoryNorm,
			stateNorm,
		],
		{
			tags: ["institutions-data", "approved-institutions"],
			revalidate: 60,
		},
	)();
}

/**
 * Get the count of pending institutions for display in sidebar badges
 */
const getPendingInstitutionsCountInternal = unstable_cache(
	async () => {
		const [result] = await db
			.select({ count: count() })
			.from(institutions)
			.where(eq(institutions.status, "pending"));

		return result.count;
	},
	["pending-institutions-count"],
	{
		tags: ["institutions-count", "pending-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getPendingInstitutionsCount() {
	await requireAdminSession();
	return getPendingInstitutionsCountInternal();
}

/**
 * Get the count of approved institutions for display in sidebar badges
 */
const getApprovedInstitutionsCountInternal = unstable_cache(
	async () => {
		const [result] = await db
			.select({ count: count() })
			.from(institutions)
			.where(eq(institutions.status, "approved"));

		return result.count;
	},
	["approved-institutions-count"],
	{
		tags: ["institutions-count", "approved-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getApprovedInstitutionsCount() {
	await requireAdminSession();
	return getApprovedInstitutionsCountInternal();
}

/**
 * Get the count of rejected institutions for display in sidebar badges
 */
const getRejectedInstitutionsCountInternal = unstable_cache(
	async () => {
		const [result] = await db
			.select({ count: count() })
			.from(institutions)
			.where(eq(institutions.status, "rejected"));

		return result.count;
	},
	["rejected-institutions-count"],
	{
		tags: ["institutions-count", "rejected-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getRejectedInstitutionsCount() {
	await requireAdminSession();
	return getRejectedInstitutionsCountInternal();
}

/**
 * Search all institutions for admin global command (Cmd+K).
 * Returns id, name, city, state, status. No cache - on-demand when palette opens.
 */
export async function searchAllInstitutionsForAdmin() {
	await requireAdminSession();
	return db
		.select({
			id: institutions.id,
			name: institutions.name,
			city: institutions.city,
			state: institutions.state,
			status: institutions.status,
		})
		.from(institutions)
		.orderBy(institutions.name)
		.limit(2000);
}

/**
 * Search institutions by name for duplicate check during admin review.
 * Returns matching institutions with link-ready fields.
 */
export async function searchApprovedInstitutionsForDuplicateCheck(
	search: string,
	options?: { limit?: number },
) {
	await requireAdminSession();
	const limit = options?.limit ?? 15;
	const trimmed = search.trim();
	if (!trimmed) return [];

	return db
		.select({
			id: institutions.id,
			name: institutions.name,
			slug: institutions.slug,
			category: institutions.category,
			city: institutions.city,
			state: institutions.state,
		})
		.from(institutions)
		.where(
			and(
				eq(institutions.status, "approved"),
				ilike(institutions.name, `%${escapeLike(trimmed)}%`),
			),
		)
		.orderBy(institutions.name)
		.limit(limit);
}

/**
 * Fetch a single pending institution by ID. Includes contributor information.
 */
export async function getPendingInstitutionById(id: number) {
	await requireAdminSession();
	return await db
		.select({
			id: institutions.id,
			name: institutions.name,
			description: institutions.description,
			category: institutions.category,
			state: institutions.state,
			city: institutions.city,
			address: institutions.address,
			supportedPayment: institutions.supportedPayment,
			qrImage: institutions.qrImage,
			qrContent: institutions.qrContent,
			coords: institutions.coords,
			socialMedia: institutions.socialMedia,
			status: institutions.status,
			contributorName: users.name,
			contributorId: users.id,
			contributorEmail: users.email,
			contributorRemarks: institutions.contributorRemarks,
			sourceUrl: institutions.sourceUrl,
			createdAt: institutions.createdAt,
			reviewedBy: institutions.reviewedBy,
			reviewedAt: institutions.reviewedAt,
			adminNotes: institutions.adminNotes,
		})
		.from(institutions)
		.leftJoin(users, eq(institutions.contributorId, users.id))
		.where(and(eq(institutions.id, id), eq(institutions.status, "pending")))
		.limit(1);
}

/**
 * Fetch a single approved institution by ID. Includes contributor information.
 */
export async function getApprovedInstitutionById(id: number) {
	await requireAdminSession();
	return await db
		.select({
			id: institutions.id,
			name: institutions.name,
			description: institutions.description,
			category: institutions.category,
			state: institutions.state,
			city: institutions.city,
			address: institutions.address,
			supportedPayment: institutions.supportedPayment,
			qrImage: institutions.qrImage,
			qrContent: institutions.qrContent,
			coords: institutions.coords,
			socialMedia: institutions.socialMedia,
			status: institutions.status,
			contributorName: users.name,
			contributorId: users.id,
			contributorEmail: users.email,
			contributorRemarks: institutions.contributorRemarks,
			sourceUrl: institutions.sourceUrl,
			createdAt: institutions.createdAt,
			reviewedBy: institutions.reviewedBy,
			reviewedAt: institutions.reviewedAt,
			adminNotes: institutions.adminNotes,
			reviewerName: sql<string | null>`(
				select ${users.name}
				from ${users}
				where ${users.id} = ${institutions.reviewedBy}
				limit 1
			)`,
		})
		.from(institutions)
		.leftJoin(users, eq(institutions.contributorId, users.id))
		.where(and(eq(institutions.id, id), eq(institutions.status, "approved")))
		.limit(1);
}

/**
 * Get all users for contributor assignment dropdown
 */
const getAllUsersInternal = unstable_cache(
	async () => {
		return db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				username: users.username,
			})
			.from(users)
			.orderBy(desc(users.createdAt));
	},
	["all-users-list"],
	{
		tags: ["users-data"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getAllUsers() {
	await requireAdminSession();
	return getAllUsersInternal();
}
