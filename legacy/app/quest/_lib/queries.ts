"use server";

import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
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
				institutionStatus: institutions.status,
			})
			.from(questMosques)
			.leftJoin(institutions, eq(questMosques.institutionId, institutions.id))
			.orderBy(questMosques.name);

		return rows.map((r) => {
			const status = r.institutionStatus as
				| "approved"
				| "pending"
				| "rejected"
				| null;
			const isUnlocked = status === "approved";
			const isPending = status === "pending";
			return {
				id: r.id,
				name: r.name,
				address: r.address,
				district: r.district,
				jaisId: r.jaisId,
				coords: r.coords,
				institutionId: r.institutionId,
				createdAt: r.createdAt,
				updatedAt: r.updatedAt,
				isUnlocked,
				isPending,
				institutionStatus: status,
				institutionSlug: r.institutionSlug,
				institutionCategory: r.institutionCategory,
				qrContent: r.qrContent,
				supportedPayment: r.supportedPayment,
			};
		});
	},
	["quest-mosques"],
	{ revalidate: 300, tags: ["quest-mosques"] },
);

export const getQuestStats = unstable_cache(
	async (): Promise<QuestStats> => {
		const [stats] = await db
			.select({
				total: count(),
			})
			.from(questMosques);

		const [unlockedCount] = await db
			.select({ count: count() })
			.from(questMosques)
			.innerJoin(institutions, eq(questMosques.institutionId, institutions.id))
			.where(eq(institutions.status, "approved"));

		return {
			total: Number(stats?.total ?? 0),
			unlocked: Number(unlockedCount?.count ?? 0),
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
			.where(
				and(
					isNotNull(institutions.contributorId),
					eq(institutions.status, "approved"),
				),
			)
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
