"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { claimRequests, institutions, users } from "@/db/schema";
import { logInstitutionClaim } from "@/lib/telegram";
import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { claimRequestSchema } from "./validations";

export async function submitClaimRequest(formData: FormData) {
	try {
		// Check authentication
		const session = await auth.api.getSession({ headers: headers() });
		if (!session?.user) {
			redirect("/auth");
		}

		// Parse and validate form data
		const rawData = {
			institutionId: Number(formData.get("institutionId")),
			sourceUrl: formData.get("sourceUrl") as string,
			description: formData.get("description") as string,
		};

		const validatedData = claimRequestSchema.parse(rawData);

		// Wrap all database operations in a transaction for atomicity
		const inst = await db.transaction(async (tx) => {
			// Check if institution exists and get contributor info
			const institutionWithContributor = await tx
				.select({
					id: institutions.id,
					name: institutions.name,
					category: institutions.category,
					state: institutions.state,
					city: institutions.city,
					contributorId: institutions.contributorId,
					contributorEmail: users.email,
				})
				.from(institutions)
				.leftJoin(users, eq(institutions.contributorId, users.id))
				.where(eq(institutions.id, validatedData.institutionId))
				.limit(1);

			if (!institutionWithContributor.length) {
				throw new Error("Institusi tidak dijumpai");
			}

			const inst = institutionWithContributor[0];

			// Check if user can claim this institution
			// 1. User must be logged in (already checked above)
			// 2. Institution's contributorId must be null, OR
			// 3. Institution's contributor email must be khairin13chan@gmail.com
			const canClaim =
				inst.contributorId === null ||
				inst.contributorEmail === "khairin13chan@gmail.com";

			if (!canClaim) {
				throw new Error("Anda tidak boleh menuntut institusi ini");
			}

			// Check if user already has a pending claim for this institution
			const existingClaim = await tx
				.select()
				.from(claimRequests)
				.where(
					and(
						eq(claimRequests.institutionId, validatedData.institutionId),
						eq(claimRequests.userId, session.user.id),
						eq(claimRequests.status, "pending"),
					),
				)
				.limit(1);

			if (existingClaim.length > 0) {
				throw new Error(
					"Anda sudah mempunyai permohonan tuntutan yang belum selesai untuk institusi ini",
				);
			}

			// Create claim request
			await tx.insert(claimRequests).values({
				institutionId: validatedData.institutionId,
				userId: session.user.id,
				sourceUrl: validatedData.sourceUrl || null,
				description: validatedData.description || null,
				status: "pending",
			});

			return inst;
		});

		// Log to Telegram
		try {
			await logInstitutionClaim({
				institutionId: inst.id.toString(),
				institutionName: inst.name,
				category: inst.category,
				state: inst.state,
				city: inst.city,
				claimerName: session.user.name || "Unknown",
				claimerEmail: session.user.email,
				sourceUrl: validatedData.sourceUrl || undefined,
				description: validatedData.description || undefined,
			});
		} catch (telegramError) {
			console.error(
				"Failed to log institution claim to Telegram:",
				telegramError,
			);
		}

		// Revalidate cache to update counts immediately
		revalidateTag("claim-requests");
		revalidateTag("claim-requests-count");
		revalidateTag("claim-requests-data");

		return {
			success: true,
			message: "Permohonan tuntutan telah dihantar untuk semakan admin",
		};
	} catch (error) {
		console.error("Error submitting claim request:", error);

		if (error instanceof Error) {
			return { success: false, error: error.message };
		}

		return { success: false, error: "Gagal menghantar permohonan tuntutan" };
	}
}
