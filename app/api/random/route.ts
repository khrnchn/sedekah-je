import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { institutions } from "@/db/schema";

// by default, Next.js caches route handlers for better performance.
// 'force-dynamic' tells Next.js to skip static optimization and always run the code dynamically.
// this ensures we get a new random institution on every request instead of serving a cached response.
export const dynamic = "force-dynamic";

// setting revalidate to 0 disables incremental static regeneration (ISR)
// and prevents Next.js from caching the response
export const revalidate = 0;

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: corsHeaders,
	});
}

export async function GET() {
	try {
		const [randomInstitution] = await db
			.select({
				id: institutions.id,
				name: institutions.name,
				category: institutions.category,
				state: institutions.state,
				city: institutions.city,
				qrImage: institutions.qrImage,
				qrContent: institutions.qrContent,
				supportedPayment: institutions.supportedPayment,
				coords: institutions.coords,
			})
			.from(institutions)
			.where(eq(institutions.status, "approved"))
			.orderBy(sql`RANDOM()`)
			.limit(1);

		if (!randomInstitution) {
			return NextResponse.json(
				{ message: "No institutions found" },
				{ status: 404, headers: corsHeaders },
			);
		}

		return NextResponse.json(randomInstitution, {
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
				...corsHeaders,
			},
		});
	} catch (error) {
		console.error("Error fetching random institution:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500, headers: corsHeaders },
		);
	}
}
