import { auth } from "@/auth";
import { db } from "@/db";
import { institutionClaims, institutions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session || session.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status") || "pending";

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
			.where(eq(institutionClaims.status, status))
			.orderBy(institutionClaims.createdAt);

		return NextResponse.json({ claims });
	} catch (error) {
		console.error("Error fetching claims:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
