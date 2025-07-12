"use server";

import { db } from "@/db";
import { institutions } from "@/db/schema";
import { slugify } from "@/lib/utils";
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

	// Find by slug match using the same slugify function
	const institution = results.find((inst) => slugify(inst.name) === slug);

	return institution || null;
}
