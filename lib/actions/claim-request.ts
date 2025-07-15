"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { claimRequests, institutions } from "@/db/schema";
import { claimRequestSchema } from "@/lib/validations/claim-request";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

		// Check if institution exists and can be claimed
		const institution = await db
			.select()
			.from(institutions)
			.where(eq(institutions.id, validatedData.institutionId))
			.limit(1);

		if (!institution.length) {
			throw new Error("Institusi tidak dijumpai");
		}

		const inst = institution[0];

		// Check if user can claim this institution
		const canClaim =
			inst.contributorId === null ||
			(inst.contributorId && session.user.email === "khairin13chan@gmail.com");

		if (!canClaim) {
			throw new Error("Anda tidak boleh menuntut institusi ini");
		}

		// Check if user already has a pending claim for this institution
		const existingClaim = await db
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
		await db.insert(claimRequests).values({
			institutionId: validatedData.institutionId,
			userId: session.user.id,
			sourceUrl: validatedData.sourceUrl || null,
			description: validatedData.description || null,
			status: "pending",
		});

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
