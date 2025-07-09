import { auth } from "@/auth";
import { db } from "@/db";
import { institutionClaims, institutions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { institutionId, claimReason } = await request.json();

		if (!institutionId) {
			return NextResponse.json(
				{ error: "Institution ID is required" },
				{ status: 400 },
			);
		}

		// Check if institution exists and has no contributor
		const institution = await db
			.select()
			.from(institutions)
			.where(eq(institutions.id, institutionId))
			.limit(1);

		if (!institution.length) {
			return NextResponse.json(
				{ error: "Institution not found" },
				{ status: 404 },
			);
		}

		if (institution[0].contributorId) {
			return NextResponse.json(
				{ error: "Institution already has a contributor" },
				{ status: 400 },
			);
		}

		// Check if user already has a pending claim for this institution
		const existingClaim = await db
			.select()
			.from(institutionClaims)
			.where(
				eq(institutionClaims.institutionId, institutionId) &&
					eq(institutionClaims.claimantId, session.user.id) &&
					eq(institutionClaims.status, "pending"),
			)
			.limit(1);

		if (existingClaim.length > 0) {
			return NextResponse.json(
				{ error: "You already have a pending claim for this institution" },
				{ status: 400 },
			);
		}

		// Create the claim
		const newClaim = await db
			.insert(institutionClaims)
			.values({
				institutionId,
				claimantId: session.user.id,
				claimReason: claimReason || null,
				status: "pending",
			})
			.returning();

		return NextResponse.json({ success: true, claim: newClaim[0] });
	} catch (error) {
		console.error("Error submitting claim:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const institutionId = searchParams.get("institutionId");

		if (!institutionId) {
			return NextResponse.json(
				{ error: "Institution ID is required" },
				{ status: 400 },
			);
		}

		// Check if user has a pending claim for this institution
		const existingClaim = await db
			.select()
			.from(institutionClaims)
			.where(
				eq(institutionClaims.institutionId, institutionId) &&
					eq(institutionClaims.claimantId, session.user.id) &&
					eq(institutionClaims.status, "pending"),
			)
			.limit(1);

		return NextResponse.json({
			hasPendingClaim: existingClaim.length > 0,
			claim: existingClaim[0] || null,
		});
	} catch (error) {
		console.error("Error checking claim status:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
