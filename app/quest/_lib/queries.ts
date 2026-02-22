"use server";

import { asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { institutions, questMosques, users } from "@/db/schema";
import type {
	QuestLeaderboardEntry,
	QuestMosqueWithStatus,
	QuestStats,
} from "./types";

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
		const [stats] = await db
			.select({
				total: count(),
				unlocked: count(questMosques.institutionId),
			})
			.from(questMosques);

		return {
			total: Number(stats?.total ?? 0),
			unlocked: Number(stats?.unlocked ?? 0),
		};
	},
	["quest-stats"],
	{ revalidate: 300, tags: ["quest-mosques"] },
);

export const getQuestLeaderboard = unstable_cache(
	async (): Promise<QuestLeaderboardEntry[]> => {
		const contributionsCount = count(questMosques.id);
		const rows = await db
			.select({
				userId: users.id,
				name: users.name,
				image: sql<string | null>`coalesce(${users.image}, ${users.avatarUrl})`,
				count: contributionsCount,
			})
			.from(questMosques)
			.innerJoin(institutions, eq(questMosques.institutionId, institutions.id))
			.innerJoin(users, eq(institutions.contributorId, users.id))
			.where(isNotNull(institutions.contributorId))
			.groupBy(users.id, users.name, users.image, users.avatarUrl)
			.orderBy(desc(contributionsCount), asc(users.name), asc(users.id))
			.limit(10);

		return rows.map((row, index) => ({
			rank: index + 1,
			userId: row.userId,
			name: row.name,
			image: row.image,
			count: Number(row.count),
		}));
	},
	["quest-leaderboard"],
	{ revalidate: 300, tags: ["quest-mosques"] },
);
