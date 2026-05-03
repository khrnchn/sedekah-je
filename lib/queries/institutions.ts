"use server";

import { and, asc, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { normalizeInstitutionCategory } from "@/lib/institution-categories";
import type {
	categories as categoryOptions,
	states as stateOptions,
	supportedPayments,
} from "@/lib/institution-constants";

const INSTITUTIONS_CACHE_VERSION = "v3";
const PUBLIC_INSTITUTIONS_CACHE_VERSION = "v1";

type Category = (typeof categoryOptions)[number];
type State = (typeof stateOptions)[number];
type SupportedPayment = (typeof supportedPayments)[number];

export type PublicInstitutionsParams = {
	search?: string;
	category?: string;
	state?: string;
	page?: number;
	limit?: number;
};

export type PublicInstitution = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	category: Category;
	state: State;
	city: string;
	qrImage: string | null;
	qrContent: string | null;
	supportedPayment: SupportedPayment[] | null;
	coords: [number, number] | null;
	contributorId: string | null;
	claimable: boolean;
};

function normalizePublicInstitutionParams(params: PublicInstitutionsParams) {
	const page =
		typeof params.page === "number" && Number.isFinite(params.page)
			? params.page
			: 1;
	const limit =
		typeof params.limit === "number" && Number.isFinite(params.limit)
			? params.limit
			: 15;

	return {
		search: params.search?.trim() ?? "",
		category: params.category ?? "",
		state: params.state ?? "",
		page: Math.max(page, 1),
		limit: Math.min(Math.max(limit, 1), 100),
	};
}

function buildPublicInstitutionConditions(params: {
	search: string;
	category: string;
	state: string;
}) {
	const conditions = [eq(institutions.status, "approved")];

	if (params.search) {
		const searchCondition = or(
			ilike(institutions.name, `%${params.search}%`),
			ilike(institutions.description, `%${params.search}%`),
			ilike(institutions.city, `%${params.search}%`),
		);
		if (searchCondition) conditions.push(searchCondition);
	}

	if (params.category) {
		const categories = params.category
			.split(",")
			.filter(Boolean)
			.map((value) => normalizeInstitutionCategory(value));

		if (categories.length > 0) {
			conditions.push(inArray(institutions.category, categories as Category[]));
		}
	}

	if (params.state) {
		conditions.push(eq(institutions.state, params.state as State));
	}

	return conditions;
}

function buildPublicInstitutionFacetConditions(params: {
	search: string;
	state: string;
}) {
	return buildPublicInstitutionConditions({
		search: params.search,
		category: "",
		state: params.state,
	});
}

const publicInstitutionSelect = {
	id: institutions.id,
	name: institutions.name,
	slug: institutions.slug,
	description: institutions.description,
	category: institutions.category,
	state: institutions.state,
	city: institutions.city,
	qrImage: institutions.qrImage,
	qrContent: institutions.qrContent,
	supportedPayment: institutions.supportedPayment,
	coords: institutions.coords,
	contributorId: institutions.contributorId,
	claimable: sql<boolean>`(${institutions.contributorId} is null)`,
};

const getPublicInstitutionsPageInternal = unstable_cache(
	async (rawParams: PublicInstitutionsParams) => {
		const params = normalizePublicInstitutionParams(rawParams);
		const offset = (params.page - 1) * params.limit;
		const conditions = buildPublicInstitutionConditions(params);
		const facetConditions = buildPublicInstitutionFacetConditions(params);

		const institutionsQuery = db
			.select(publicInstitutionSelect)
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(and(...conditions))
			.orderBy(
				asc(sql`lower(btrim(${institutions.name}))`),
				asc(institutions.id),
			)
			.limit(params.limit)
			.offset(offset);

		const totalQuery = db
			.select({ count: count() })
			.from(institutions)
			.where(and(...conditions));

		const categoryCountQuery = db
			.select({
				category: institutions.category,
				count: count(),
			})
			.from(institutions)
			.where(and(...facetConditions))
			.groupBy(institutions.category);

		const [institutionsResult, totalResult, categoryCountResult] =
			await Promise.all([institutionsQuery, totalQuery, categoryCountQuery]);

		const total = totalResult[0]?.count ?? 0;
		const categoryCounts = Object.fromEntries(
			categoryCountResult.map((row) => [
				normalizeInstitutionCategory(row.category),
				row.count,
			]),
		);

		return {
			institutions: institutionsResult.map((institution) => ({
				...institution,
				category: normalizeInstitutionCategory(institution.category),
			})),
			pagination: {
				page: params.page,
				limit: params.limit,
				total,
				hasMore: offset + params.limit < total,
				totalPages: Math.ceil(total / params.limit),
			},
			facets: {
				categoryCounts,
			},
		};
	},
	["public-institutions-page", PUBLIC_INSTITUTIONS_CACHE_VERSION],
	{
		revalidate: 86400,
		tags: ["institutions"],
	},
);

export async function getPublicInstitutionsPage(
	params: PublicInstitutionsParams = {},
) {
	return getPublicInstitutionsPageInternal(params);
}

const getPublicInstitutionMarkersInternal = unstable_cache(
	async (rawParams: Omit<PublicInstitutionsParams, "page" | "limit">) => {
		const params = normalizePublicInstitutionParams({
			...rawParams,
			page: 1,
			limit: 50,
		});
		const conditions = buildPublicInstitutionConditions(params);

		const results = await db
			.select(publicInstitutionSelect)
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(and(...conditions))
			.orderBy(
				asc(sql`lower(btrim(${institutions.name}))`),
				asc(institutions.id),
			)
			.limit(params.limit);

		return results
			.filter((institution) => institution.coords)
			.map((institution) => ({
				...institution,
				category: normalizeInstitutionCategory(institution.category),
			}));
	},
	["public-institution-markers", PUBLIC_INSTITUTIONS_CACHE_VERSION],
	{
		revalidate: 86400,
		tags: ["institutions"],
	},
);

export async function getPublicInstitutionMarkers(
	params: Omit<PublicInstitutionsParams, "page" | "limit"> = {},
) {
	return getPublicInstitutionMarkersInternal(params);
}

const getInstitutionsInternal = unstable_cache(
	async () => {
		const results = await db
			.select({
				id: institutions.id,
				name: institutions.name,
				slug: institutions.slug,
				description: institutions.description,
				category: institutions.category,
				state: institutions.state,
				city: institutions.city,
				address: institutions.address,
				qrImage: institutions.qrImage,
				qrContent: institutions.qrContent,
				supportedPayment: institutions.supportedPayment,
				coords: institutions.coords,
				socialMedia: institutions.socialMedia,
				status: institutions.status,
				contributorId: institutions.contributorId,
				contributorRemarks: institutions.contributorRemarks,
				sourceUrl: institutions.sourceUrl,
				reviewedBy: institutions.reviewedBy,
				reviewedAt: institutions.reviewedAt,
				adminNotes: institutions.adminNotes,
				contributorEmail: users.email,
				isVerified: institutions.isVerified,
				isActive: institutions.isActive,
				createdAt: institutions.createdAt,
				updatedAt: institutions.updatedAt,
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(eq(institutions.status, "approved"))
			.orderBy(
				asc(sql`lower(btrim(${institutions.name}))`),
				asc(institutions.id),
			);

		return results.map((institution) => ({
			...institution,
			category: normalizeInstitutionCategory(institution.category),
		}));
	},
	["all-institutions", INSTITUTIONS_CACHE_VERSION],
	{
		revalidate: 86400, // 1 day for stable homepage data
		tags: ["institutions"],
	},
);

export async function getInstitutions() {
	return getInstitutionsInternal();
}

const getInstitutionBySlugInternal = unstable_cache(
	async (slug: string) => {
		const [institution] = await db
			.select({
				id: institutions.id,
				name: institutions.name,
				slug: institutions.slug,
				description: institutions.description,
				category: institutions.category,
				state: institutions.state,
				city: institutions.city,
				address: institutions.address,
				qrImage: institutions.qrImage,
				qrContent: institutions.qrContent,
				supportedPayment: institutions.supportedPayment,
				coords: institutions.coords,
				socialMedia: institutions.socialMedia,
				status: institutions.status,
				contributorId: institutions.contributorId,
				contributorRemarks: institutions.contributorRemarks,
				sourceUrl: institutions.sourceUrl,
				reviewedBy: institutions.reviewedBy,
				reviewedAt: institutions.reviewedAt,
				adminNotes: institutions.adminNotes,
				contributorEmail: users.email,
				isVerified: institutions.isVerified,
				isActive: institutions.isActive,
				createdAt: institutions.createdAt,
				updatedAt: institutions.updatedAt,
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(
				and(eq(institutions.slug, slug), eq(institutions.status, "approved")),
			)
			.limit(1);

		return institution
			? {
					...institution,
					category: normalizeInstitutionCategory(institution.category),
				}
			: null;
	},
	["institution-by-slug", INSTITUTIONS_CACHE_VERSION],
	{
		revalidate: 86400, // 1 day for individual institution pages
		tags: ["institutions"],
	},
);

export async function getInstitutionBySlug(slug: string) {
	return getInstitutionBySlugInternal(slug);
}
