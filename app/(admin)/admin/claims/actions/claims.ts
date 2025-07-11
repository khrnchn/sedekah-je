"use server";

import { db } from "@/db";
import { institutionClaims, institutions, users } from "@/db/schema";
import type { InstitutionClaim } from "@/db/schema";
import { getAuthenticatedUser, verifyAdminAccess } from "@/lib/auth-utils";
import { unstable_cache } from "@/lib/unstable-cache";
import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export type ClaimResult = {
	success: boolean;
	error?: string;
	claim?: InstitutionClaim;
};

export type ClaimStatusResult = {
	success: boolean;
	error?: string;
	hasPendingClaim?: boolean;
	claim?: InstitutionClaim;
};

/**
 * Submit a claim for an institution
 */
export async function submitClaim(
	institutionId: number,
	claimReason?: string,
): Promise<ClaimResult> {
	try {
		const { session, user } = await getAuthenticatedUser();

		if (!institutionId) {
			return { success: false, error: "Institution ID is required" };
		}

		// Check if institution exists and has no contributor
		const institution = await db
			.select({
				id: institutions.id,
				contributorId: institutions.contributorId,
				contributor: {
					email: users.email,
				},
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(eq(institutions.id, institutionId))
			.limit(1);

		if (!institution.length) {
			return { success: false, error: "Institution not found" };
		}

		// Allow claiming if institution has no contributor OR if contributor is superadmin
		const isSuperadmin =
			institution[0].contributor?.email === "khairin13chan@gmail.com";
		if (institution[0].contributorId && !isSuperadmin) {
			return {
				success: false,
				error: "Institution already has a contributor",
			};
		}

		// Check if user already has a pending claim for this institution
		const existingClaim = await db
			.select()
			.from(institutionClaims)
			.where(
				and(
					eq(institutionClaims.institutionId, institutionId),
					eq(institutionClaims.claimantId, user.id),
					eq(institutionClaims.status, "pending"),
				),
			)
			.limit(1);

		if (existingClaim.length > 0) {
			return {
				success: false,
				error: "You already have a pending claim for this institution",
			};
		}

		// Create the claim
		const newClaim = await db
			.insert(institutionClaims)
			.values({
				institutionId: institutionId,
				claimantId: user.id,
				claimReason: claimReason || null,
				status: "pending",
			})
			.returning();

		// Revalidate relevant paths
		revalidatePath("/admin/claims");
		revalidatePath(`/institution/${institutionId}`);

		// Revalidate cached claims data
		revalidateTag("claims-data");
		revalidateTag("pending-claims");

		return { success: true, claim: newClaim[0] };
	} catch (error) {
		console.error("Error submitting claim:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Internal server error",
		};
	}
}

/**
 * Check if user has pending claim for an institution
 */
export async function checkClaimStatus(
	institutionId: number,
): Promise<ClaimStatusResult> {
	try {
		const { user } = await getAuthenticatedUser();

		if (!institutionId) {
			return { success: false, error: "Institution ID is required" };
		}

		// Check if user has a pending claim for this institution
		const existingClaim = await db
			.select()
			.from(institutionClaims)
			.where(
				and(
					eq(institutionClaims.institutionId, institutionId),
					eq(institutionClaims.claimantId, user.id),
					eq(institutionClaims.status, "pending"),
				),
			)
			.limit(1);

		return {
			success: true,
			hasPendingClaim: existingClaim.length > 0,
			claim: existingClaim[0] || null,
		};
	} catch (error) {
		console.error("Error checking claim status:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Internal server error",
		};
	}
}

/**
 * Get all claims (admin only)
 */
export async function getClaims(status = "pending") {
	try {
		await verifyAdminAccess();

		// Get claims with institution and claimant details
		const claims = await db
			.select({
				id: institutionClaims.id,
				institutionId: institutionClaims.institutionId,
				claimantId: institutionClaims.claimantId,
				claimReason: institutionClaims.claimReason,
				status: institutionClaims.status,
				reviewedBy: institutionClaims.reviewedBy,
				reviewedAt: institutionClaims.reviewedAt,
				adminNotes: institutionClaims.adminNotes,
				createdAt: institutionClaims.createdAt,
				updatedAt: institutionClaims.updatedAt,
				institution: {
					id: institutions.id,
					name: institutions.name,
					category: institutions.category,
					state: institutions.state,
					city: institutions.city,
					contributorId: institutions.contributorId,
				},
				claimant: {
					id: users.id,
					name: users.name,
					email: users.email,
					username: users.username,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(institutionClaims)
			.leftJoin(
				institutions,
				eq(institutionClaims.institutionId, institutions.id),
			)
			.leftJoin(users, eq(institutionClaims.claimantId, users.id))
			.where(
				eq(
					institutionClaims.status,
					status as "pending" | "approved" | "rejected",
				),
			)
			.orderBy(institutionClaims.createdAt);

		return { success: true, claims };
	} catch (error) {
		console.error("Error fetching claims:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Internal server error",
		};
	}
}

/**
 * Get pending claims (cached for server-side rendering)
 * Note: Authentication check must be done outside this function
 */
const getPendingClaimsInternal = unstable_cache(
	async () => {
		return await db
			.select({
				id: institutionClaims.id,
				institutionId: institutionClaims.institutionId,
				claimantId: institutionClaims.claimantId,
				claimReason: institutionClaims.claimReason,
				status: institutionClaims.status,
				reviewedBy: institutionClaims.reviewedBy,
				reviewedAt: institutionClaims.reviewedAt,
				adminNotes: institutionClaims.adminNotes,
				createdAt: institutionClaims.createdAt,
				updatedAt: institutionClaims.updatedAt,
				institution: {
					id: institutions.id,
					name: institutions.name,
					category: institutions.category,
					state: institutions.state,
					city: institutions.city,
					contributorId: institutions.contributorId,
				},
				claimant: {
					id: users.id,
					name: users.name,
					email: users.email,
					username: users.username,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(institutionClaims)
			.leftJoin(
				institutions,
				eq(institutionClaims.institutionId, institutions.id),
			)
			.leftJoin(users, eq(institutionClaims.claimantId, users.id))
			.where(eq(institutionClaims.status, "pending"))
			.orderBy(institutionClaims.createdAt);
	},
	["pending-claims-list"],
	{
		tags: ["claims-data", "pending-claims"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getPendingClaims() {
	await verifyAdminAccess(); // Check auth outside cached function
	return await getPendingClaimsInternal();
}

/**
 * Get approved claims (cached for server-side rendering)
 * Note: Authentication check must be done outside this function
 */
const getApprovedClaimsInternal = unstable_cache(
	async () => {
		return await db
			.select({
				id: institutionClaims.id,
				institutionId: institutionClaims.institutionId,
				claimantId: institutionClaims.claimantId,
				claimReason: institutionClaims.claimReason,
				status: institutionClaims.status,
				reviewedBy: institutionClaims.reviewedBy,
				reviewedAt: institutionClaims.reviewedAt,
				adminNotes: institutionClaims.adminNotes,
				createdAt: institutionClaims.createdAt,
				updatedAt: institutionClaims.updatedAt,
				institution: {
					id: institutions.id,
					name: institutions.name,
					category: institutions.category,
					state: institutions.state,
					city: institutions.city,
					contributorId: institutions.contributorId,
				},
				claimant: {
					id: users.id,
					name: users.name,
					email: users.email,
					username: users.username,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(institutionClaims)
			.leftJoin(
				institutions,
				eq(institutionClaims.institutionId, institutions.id),
			)
			.leftJoin(users, eq(institutionClaims.claimantId, users.id))
			.where(eq(institutionClaims.status, "approved"))
			.orderBy(institutionClaims.createdAt);
	},
	["approved-claims-list"],
	{
		tags: ["claims-data", "approved-claims"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getApprovedClaims() {
	await verifyAdminAccess(); // Check auth outside cached function
	return await getApprovedClaimsInternal();
}

/**
 * Get rejected claims (cached for server-side rendering)
 * Note: Authentication check must be done outside this function
 */
const getRejectedClaimsInternal = unstable_cache(
	async () => {
		return await db
			.select({
				id: institutionClaims.id,
				institutionId: institutionClaims.institutionId,
				claimantId: institutionClaims.claimantId,
				claimReason: institutionClaims.claimReason,
				status: institutionClaims.status,
				reviewedBy: institutionClaims.reviewedBy,
				reviewedAt: institutionClaims.reviewedAt,
				adminNotes: institutionClaims.adminNotes,
				createdAt: institutionClaims.createdAt,
				updatedAt: institutionClaims.updatedAt,
				institution: {
					id: institutions.id,
					name: institutions.name,
					category: institutions.category,
					state: institutions.state,
					city: institutions.city,
					contributorId: institutions.contributorId,
				},
				claimant: {
					id: users.id,
					name: users.name,
					email: users.email,
					username: users.username,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(institutionClaims)
			.leftJoin(
				institutions,
				eq(institutionClaims.institutionId, institutions.id),
			)
			.leftJoin(users, eq(institutionClaims.claimantId, users.id))
			.where(eq(institutionClaims.status, "rejected"))
			.orderBy(institutionClaims.createdAt);
	},
	["rejected-claims-list"],
	{
		tags: ["claims-data", "rejected-claims"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getRejectedClaims() {
	await verifyAdminAccess(); // Check auth outside cached function
	return await getRejectedClaimsInternal();
}

/**
 * Process a claim (approve/reject) - admin only
 */
export async function processClaim(
	claimId: string,
	status: "approved" | "rejected",
	adminNotes?: string,
): Promise<ClaimResult> {
	try {
		const { user } = await verifyAdminAccess();

		if (!["approved", "rejected"].includes(status)) {
			return {
				success: false,
				error: "Invalid status. Must be 'approved' or 'rejected'",
			};
		}

		// Get the claim details
		const claim = await db
			.select()
			.from(institutionClaims)
			.where(eq(institutionClaims.id, Number.parseInt(claimId)))
			.limit(1);

		if (!claim.length) {
			return { success: false, error: "Claim not found" };
		}

		if (claim[0].status !== "pending") {
			return { success: false, error: "Claim has already been processed" };
		}

		// Start a transaction
		await db.transaction(async (tx) => {
			// Update the claim status
			await tx
				.update(institutionClaims)
				.set({
					status,
					reviewedBy: user.id,
					reviewedAt: new Date(),
					adminNotes: adminNotes || null,
				})
				.where(eq(institutionClaims.id, Number.parseInt(claimId)));

			// If approved, update the institution's contributor
			if (status === "approved") {
				await tx
					.update(institutions)
					.set({
						contributorId: claim[0].claimantId,
					})
					.where(eq(institutions.id, claim[0].institutionId));
			}
		});

		// Revalidate relevant paths
		revalidatePath("/admin/claims");
		revalidatePath(`/institution/${claim[0].institutionId}`);

		// Revalidate cached claims data
		revalidateTag("claims-data");
		revalidateTag("pending-claims");
		revalidateTag("approved-claims");
		revalidateTag("rejected-claims");

		return { success: true };
	} catch (error) {
		console.error("Error processing claim:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Internal server error",
		};
	}
}
