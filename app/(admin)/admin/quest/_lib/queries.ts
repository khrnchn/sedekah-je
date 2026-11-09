import { and, asc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { institutions, questAttempts, questMosques, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";

export async function getPendingExistingQuestAttempts() {
	await requireAdminSession();
	const linkedMosques = alias(questMosques, "linked_mosques");

	return db
		.select({
			id: questAttempts.id,
			createdAt: questAttempts.createdAt,
			mosqueName: questMosques.name,
			mosqueAddress: questMosques.address,
			mosqueDistrict: questMosques.district,
			listingName: institutions.name,
			listingCategory: institutions.category,
			listingSlug: institutions.slug,
			listingAddress: institutions.address,
			listingCity: institutions.city,
			hunterName: users.name,
			linkedMosqueName: linkedMosques.name,
		})
		.from(questAttempts)
		.innerJoin(questMosques, eq(questMosques.id, questAttempts.questMosqueId))
		.innerJoin(institutions, eq(institutions.id, questAttempts.institutionId))
		.leftJoin(users, eq(users.id, questAttempts.userId))
		.leftJoin(
			linkedMosques,
			and(
				eq(linkedMosques.institutionId, questAttempts.institutionId),
				ne(linkedMosques.id, questAttempts.questMosqueId),
			),
		)
		.where(
			and(
				eq(questAttempts.kind, "existing"),
				eq(questAttempts.status, "pending"),
			),
		)
		.orderBy(asc(questAttempts.createdAt), asc(questAttempts.id));
}
