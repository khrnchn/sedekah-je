"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { claimRequests, institutions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function approveClaimRequest(formData: FormData) {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: headers() });
		if (!session?.user) {
			redirect("/auth");
		}

		// TODO: Add admin role check
		// const user = await getAdminUser(session.user.id);
		// if (!user || user.role !== "admin") {
		//   throw new Error("Unauthorized");
		// }

		const claimId = Number(formData.get("claimId"));
		const adminNotes = formData.get("adminNotes") as string;

		if (!claimId) {
			throw new Error("ID tuntutan diperlukan");
		}

		// Get the claim request details
		const claimRequest = await db
			.select()
			.from(claimRequests)
			.where(eq(claimRequests.id, claimId))
			.limit(1);

		if (!claimRequest.length) {
			throw new Error("Tuntutan tidak dijumpai");
		}

		const claim = claimRequest[0];

		if (claim.status !== "pending") {
			throw new Error("Tuntutan ini sudah diproses");
		}

		// Update the institution's contributorId
		await db
			.update(institutions)
			.set({
				contributorId: claim.userId,
				updatedAt: new Date(),
			})
			.where(eq(institutions.id, claim.institutionId));

		// Update the claim request status
		await db
			.update(claimRequests)
			.set({
				status: "approved",
				adminNotes: adminNotes || null,
				reviewedBy: session.user.id,
				reviewedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(claimRequests.id, claimId));

		// Revalidate cache
		revalidateTag("claim-requests");
		revalidateTag("institutions");

		return {
			success: true,
			message:
				"Tuntutan telah diluluskan dan institusi telah diberikan kepada pengguna",
		};
	} catch (error) {
		console.error("Error approving claim request:", error);

		if (error instanceof Error) {
			return { success: false, error: error.message };
		}

		return { success: false, error: "Gagal meluluskan tuntutan" };
	}
}

export async function rejectClaimRequest(formData: FormData) {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: headers() });
		if (!session?.user) {
			redirect("/auth");
		}

		const claimId = Number(formData.get("claimId"));
		const adminNotes = formData.get("adminNotes") as string;

		if (!claimId) {
			throw new Error("ID tuntutan diperlukan");
		}

		if (!adminNotes?.trim()) {
			throw new Error("Nota admin diperlukan untuk menolak tuntutan");
		}

		// Get the claim request details
		const claimRequest = await db
			.select()
			.from(claimRequests)
			.where(eq(claimRequests.id, claimId))
			.limit(1);

		if (!claimRequest.length) {
			throw new Error("Tuntutan tidak dijumpai");
		}

		const claim = claimRequest[0];

		if (claim.status !== "pending") {
			throw new Error("Tuntutan ini sudah diproses");
		}

		// Update the claim request status
		await db
			.update(claimRequests)
			.set({
				status: "rejected",
				adminNotes,
				reviewedBy: session.user.id,
				reviewedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(claimRequests.id, claimId));

		// Revalidate cache
		revalidateTag("claim-requests");

		return {
			success: true,
			message: "Tuntutan telah ditolak",
		};
	} catch (error) {
		console.error("Error rejecting claim request:", error);

		if (error instanceof Error) {
			return { success: false, error: error.message };
		}

		return { success: false, error: "Gagal menolak tuntutan" };
	}
}
