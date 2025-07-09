import { db } from "@/db";
import { institutions } from "@/db/schema";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const search = searchParams.get("search") || "";
	const category = searchParams.get("category") || "";
	const state = searchParams.get("state") || "";
	const page = Number.parseInt(searchParams.get("page") || "1");
	const limit = Number.parseInt(searchParams.get("limit") || "15");

	const offset = (page - 1) * limit;

	try {
		// Build where conditions
		const conditions = [eq(institutions.status, "approved")];

		// Search filter
		if (search.trim()) {
			const searchCondition = or(
				ilike(institutions.name, `%${search}%`),
				ilike(institutions.description, `%${search}%`),
				ilike(institutions.city, `%${search}%`),
			);
			if (searchCondition) {
				conditions.push(searchCondition);
			}
		}

		// Category filter
		if (category) {
			const categories = category.split(",").filter(Boolean);
			if (categories.length > 0) {
				// Type assertion needed for Drizzle's strict typing
				conditions.push(
					inArray(
						institutions.category,
						categories as (
							| "mosque"
							| "surau"
							| "tahfiz"
							| "kebajikan"
							| "others"
						)[],
					),
				);
			}
		}

		// State filter
		if (state) {
			// Type assertion needed for Drizzle's strict typing
			conditions.push(
				eq(
					institutions.state,
					state as
						| "Johor"
						| "Kedah"
						| "Kelantan"
						| "Melaka"
						| "Negeri Sembilan"
						| "Pahang"
						| "Perak"
						| "Perlis"
						| "Pulau Pinang"
						| "Sabah"
						| "Sarawak"
						| "Selangor"
						| "Terengganu"
						| "W.P. Kuala Lumpur"
						| "W.P. Labuan"
						| "W.P. Putrajaya",
				),
			);
		}

		// Get total count for pagination
		const totalQuery = db
			.select({ count: institutions.id })
			.from(institutions)
			.where(and(...conditions));

		// Get filtered institutions
		const institutionsQuery = db
			.select()
			.from(institutions)
			.where(and(...conditions))
			.orderBy(institutions.name)
			.limit(limit)
			.offset(offset);

		const [institutionsResult, totalResult] = await Promise.all([
			institutionsQuery,
			totalQuery,
		]);

		const total = totalResult.length;
		const hasMore = offset + limit < total;

		return NextResponse.json({
			institutions: institutionsResult,
			pagination: {
				page,
				limit,
				total,
				hasMore,
				totalPages: Math.ceil(total / limit),
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
