"use server";

import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { slugify } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function getInstitutions() {
	const results = await db
		.select({
			id: institutions.id,
			name: institutions.name,
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
}

export async function getInstitutionBySlug(slug: string) {
	const results = await db
		.select({
			id: institutions.id,
			name: institutions.name,
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

	// Find by slug match using the same slugify function
	const institution = results.find((inst) => slugify(inst.name) === slug);

	return institution || null;
}
