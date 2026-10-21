"use server";

import {
	and,
	asc,
	count,
	eq,
	ilike,
	inArray,
	isNotNull,
	or,
	sql,
} from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { normalizeInstitutionCategory } from "@/lib/institution-categories";
import type {
	PublicInstitution,
	PublicInstitutionDetails,
} from "@/lib/queries/public-institution";
import {
	toPublicInstitution,
	toPublicInstitutionDetails,
} from "@/lib/queries/public-institution";

const INSTITUTIONS_CACHE_VERSION = "v4";
const PUBLIC_INSTITUTIONS_CACHE_VERSION = "v3";

type Category = PublicInstitution["category"];
type State = PublicInstitution["state"];

export type PublicInstitutionsParams = {
	search?: string;
	category?: string;
	state?: string;
	page?: number;
	limit?: number;
};

export type { PublicInstitution, PublicInstitutionDetails };

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
			institutions: institutionsResult.map((institution) =>
				toPublicInstitution({
					...institution,
					category: normalizeInstitutionCategory(institution.category),
				}),
			),
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
		});
		const conditions = buildPublicInstitutionConditions(params);

		const results = await db
			.select(publicInstitutionSelect)
			.from(institutions)
			.where(and(...conditions, isNotNull(institutions.coords)))
			.orderBy(
				asc(sql`lower(btrim(${institutions.name}))`),
				asc(institutions.id),
			);

		return results.map((institution) =>
			toPublicInstitution({
				...institution,
				category: normalizeInstitutionCategory(institution.category),
			}),
		);
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
				...publicInstitutionSelect,
				updatedAt: institutions.updatedAt,
			})
			.from(institutions)
			.where(eq(institutions.status, "approved"))
			.orderBy(
				asc(sql`lower(btrim(${institutions.name}))`),
				asc(institutions.id),
			);

		return results.map((institution) => ({
			...toPublicInstitution({
				...institution,
				category: normalizeInstitutionCategory(institution.category),
			}),
			updatedAt: institution.updatedAt,
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
				...publicInstitutionSelect,
				address: institutions.address,
				socialMedia: institutions.socialMedia,
				isVerified: institutions.isVerified,
			})
			.from(institutions)
			.where(
				and(eq(institutions.slug, slug), eq(institutions.status, "approved")),
			)
			.limit(1);

		return institution
			? toPublicInstitutionDetails({
					...institution,
					category: normalizeInstitutionCategory(institution.category),
				})
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
