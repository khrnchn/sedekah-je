import { auth } from "@/auth";
import { db } from "@/db";
import { institutionClaims, institutions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session || session.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { status, adminNotes } = await request.json();

		if (!["approved", "rejected"].includes(status)) {
			return NextResponse.json(
				{ error: "Invalid status. Must be 'approved' or 'rejected'" },
				{ status: 400 },
			);
		}

		// Get the claim details
		const claim = await db
			.select()
			.from(institutionClaims)
			.where(eq(institutionClaims.id, Number.parseInt(params.id)))
			.limit(1);

		if (!claim.length) {
			return NextResponse.json({ error: "Claim not found" }, { status: 404 });
		}

		if (claim[0].status !== "pending") {
			return NextResponse.json(
				{ error: "Claim has already been processed" },
				{ status: 400 },
			);
		}

		// Start a transaction
		await db.transaction(async (tx) => {
			// Update the claim status
			await tx
				.update(institutionClaims)
				.set({
					status,
					reviewedBy: session.user.id,
					reviewedAt: new Date(),
					adminNotes: adminNotes || null,
				})
				.where(eq(institutionClaims.id, Number.parseInt(params.id)));

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

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error processing claim:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
