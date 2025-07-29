"use server";

import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { slugify } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

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

		return results;
	},
	["all-institutions"],
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

		return institution || null;
	},
	["institution-by-slug"],
	{
		revalidate: 86400, // 1 day for individual institution pages
		tags: ["institutions"],
	},
);

export async function getInstitutionBySlug(slug: string) {
	return getInstitutionBySlugInternal(slug);
}
