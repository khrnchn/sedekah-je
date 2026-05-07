import { type NextRequest, NextResponse } from "next/server";
import {
	getPublicInstitutionMarkers,
	getPublicInstitutionsPage,
} from "@/lib/queries/institutions";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const search = searchParams.get("search") || "";
	const category = searchParams.get("category") || "";
	const state = searchParams.get("state") || "";
	const mode = searchParams.get("mode") || "page";
	const page = Number.parseInt(searchParams.get("page") || "1", 10);
	const limit = Number.parseInt(searchParams.get("limit") || "15", 10);

	try {
		const result =
			mode === "markers"
				? await getPublicInstitutionMarkers({ search, category, state })
				: await getPublicInstitutionsPage({
						search,
						category,
						state,
						page,
						limit,
					});

		return NextResponse.json(result, {
			headers: {
				"Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
			},
		});
	} catch (error) {
		console.error("Error fetching institutions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch institutions" },
			{ status: 500 },
		);
	}
}
