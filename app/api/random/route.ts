import { institutions } from "@/app/data/institutions";
import { NextResponse } from "next/server";

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
		if (institutions.length === 0) {
			return NextResponse.json(
				{ message: "No institutions found" },
				{ status: 404, headers: corsHeaders },
			);
		}

		const randomIndex = Math.floor(Math.random() * institutions.length);
		const randomInstitution = institutions[randomIndex];

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
