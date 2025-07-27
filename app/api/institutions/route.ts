import { db } from "@/db";
import { institutions } from "@/db/schema";
import type {
	categories as categoryOptions,
	states as stateOptions,
} from "@/lib/institution-constants";
import { and, count, eq, ilike, inArray, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

type Category = (typeof categoryOptions)[number];
type State = (typeof stateOptions)[number];

type SearchParams = {
	search: string;
	category: string;
	state: string;
	page: number;
	limit: number;
};

const getInstitutionsWithFiltersInternal = unstable_cache(
	async (params: SearchParams) => {
		const { search, category, state, page, limit } = params;
		const offset = (page - 1) * limit;

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
					inArray(institutions.category, categories as Category[]),
				);
			}
		}

		// State filter
		if (state) {
			// Type assertion needed for Drizzle's strict typing
			conditions.push(eq(institutions.state, state as State));
		}

		// Get total count for pagination
		const totalQuery = db
			.select({ count: count() })
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

		const total = totalResult[0]?.count ?? 0;
		const hasMore = offset + limit < total;

		return {
			institutions: institutionsResult,
			pagination: {
				page,
				limit,
				total,
				hasMore,
				totalPages: Math.ceil(total / limit),
			},
		};
	},
	["institutions-api"],
	{
		revalidate: 300, // 5 minutes for API responses
		tags: ["institutions"],
	},
);

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const search = searchParams.get("search") || "";
	const category = searchParams.get("category") || "";
	const state = searchParams.get("state") || "";
	const page = Number.parseInt(searchParams.get("page") || "1");
	const limit = Number.parseInt(searchParams.get("limit") || "15");

	try {
		const result = await getInstitutionsWithFiltersInternal({
			search,
			category,
			state,
			page,
			limit,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching institutions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch institutions" },
			{ status: 500 },
		);
	}
}
