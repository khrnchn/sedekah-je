"use server";

import { db } from "@/db";
import { institutions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getInstitutions() {
	const results = await db
		.select()
		.from(institutions)
		.where(eq(institutions.status, "approved"))
		.orderBy(institutions.name);

	return results;
}

export async function getInstitutionBySlug(slug: string) {
	const results = await db
		.select()
		.from(institutions)
		.where(eq(institutions.status, "approved"))
		.orderBy(institutions.name);

	// Find by slug match (name converted to slug)
	const institution = results.find(inst => {
		const instSlug = inst.name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim();
		return instSlug === slug;
	});

	return institution || null;
}
