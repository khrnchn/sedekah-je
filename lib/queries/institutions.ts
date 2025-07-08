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
