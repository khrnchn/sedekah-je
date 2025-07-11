"use server";

import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getInstitutions() {
	const results = await db
		.select({
			id: institutions.id,
			name: institutions.name,
			description: institutions.description,
			state: institutions.state,
			city: institutions.city,
			address: institutions.address,
			category: institutions.category,
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
			isVerified: institutions.isVerified,
			isActive: institutions.isActive,
			createdAt: institutions.createdAt,
			updatedAt: institutions.updatedAt,
			contributor: {
				email: users.email,
			},
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
			state: institutions.state,
			city: institutions.city,
			address: institutions.address,
			category: institutions.category,
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
			isVerified: institutions.isVerified,
			isActive: institutions.isActive,
			createdAt: institutions.createdAt,
			updatedAt: institutions.updatedAt,
			contributor: {
				email: users.email,
			},
		})
		.from(institutions)
		.leftJoin(users, eq(institutions.contributorId, users.id))
		.where(eq(institutions.status, "approved"))
		.orderBy(institutions.name);

	// Find by slug match (name converted to slug)
	const institution = results.find((inst) => {
		const instSlug = inst.name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.trim();
		return instSlug === slug;
	});

	return institution || null;
}
