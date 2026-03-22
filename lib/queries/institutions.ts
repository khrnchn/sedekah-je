"use server";

import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { normalizeInstitutionCategory } from "@/lib/institution-categories";
import { slugify } from "@/lib/utils";

const INSTITUTIONS_CACHE_VERSION = "v2";

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
			.orderBy(institutions.name);

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
