"use server";

import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { institutions, questMosques } from "@/db/schema";
import type { QuestMosqueWithStatus, QuestStats } from "./types";

export const getQuestMosques = unstable_cache(
	async (): Promise<QuestMosqueWithStatus[]> => {
		const rows = await db
			.select({
				id: questMosques.id,
				name: questMosques.name,
				address: questMosques.address,
				district: questMosques.district,
				jaisId: questMosques.jaisId,
				coords: questMosques.coords,
				institutionId: questMosques.institutionId,
				createdAt: questMosques.createdAt,
				updatedAt: questMosques.updatedAt,
				institutionSlug: institutions.slug,
				institutionCategory: institutions.category,
				qrContent: institutions.qrContent,
				supportedPayment: institutions.supportedPayment,
			})
			.from(questMosques)
			.leftJoin(institutions, eq(questMosques.institutionId, institutions.id))
			.orderBy(questMosques.name);

		return rows.map((r) => ({
			id: r.id,
			name: r.name,
			address: r.address,
			district: r.district,
			jaisId: r.jaisId,
			coords: r.coords,
			institutionId: r.institutionId,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
			isUnlocked: r.institutionSlug !== null,
			institutionSlug: r.institutionSlug,
			institutionCategory: r.institutionCategory,
			qrContent: r.qrContent,
			supportedPayment: r.supportedPayment,
		}));
	},
	["quest-mosques"],
	{ revalidate: 300, tags: ["quest-mosques"] },
);

export const getQuestStats = unstable_cache(
	async (): Promise<QuestStats> => {
		const rows = await db
			.select({
				institutionId: questMosques.institutionId,
			})
			.from(questMosques);

		return {
			total: rows.length,
			unlocked: rows.filter((r) => r.institutionId !== null).length,
		};
	},
	["quest-stats"],
	{ revalidate: 300, tags: ["quest-mosques"] },
);
