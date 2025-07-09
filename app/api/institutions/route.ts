import { db } from "@/db";
import { institutions } from "@/db/schema";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	
	const search = searchParams.get("search") || "";
	const category = searchParams.get("category") || "";
	const state = searchParams.get("state") || "";
	const page = parseInt(searchParams.get("page") || "1");
	const limit = parseInt(searchParams.get("limit") || "15");
	
	const offset = (page - 1) * limit;
	
	try {
		// Build where conditions
		const conditions = [eq(institutions.status, "approved")];
		
		// Search filter
		if (search.trim()) {
			conditions.push(
				or(
					ilike(institutions.name, `%${search}%`),
					ilike(institutions.description, `%${search}%`),
					ilike(institutions.city, `%${search}%`)
				)!
			);
		}
		
		// Category filter
		if (category) {
			const categories = category.split(",").filter(Boolean);
			if (categories.length > 0) {
				conditions.push(inArray(institutions.category, categories as any));
			}
		}
		
		// State filter
		if (state) {
			conditions.push(eq(institutions.state, state as any));
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
			totalQuery
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
				totalPages: Math.ceil(total / limit)
			}
		});
		
	} catch (error) {
		console.error("Error fetching institutions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch institutions" },
			{ status: 500 }
		);
	}
}