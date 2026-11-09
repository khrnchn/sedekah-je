"use server";

import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { institutions, questAttempts, questMosques, users } from "@/db/schema";
import { deriveQuestStatus } from "@/lib/features/quest/rules";
import type { QuestLeaderboardEntry, QuestMosqueView } from "./types";

export const getQuestMosques = unstable_cache(
	async (): Promise<QuestMosqueView[]> => {
		const pending = db
			.select({
				questMosqueId: questAttempts.questMosqueId,
				pendingCount: count().as("pending_count"),
			})
			.from(questAttempts)
			.where(eq(questAttempts.status, "pending"))
			.groupBy(questAttempts.questMosqueId)
			.as("pending");

		const rows = await db
			.select({
				id: questMosques.id,
				name: questMosques.name,
				address: questMosques.address,
				coords: questMosques.coords,
				pendingAttempts: sql<number>`coalesce(${pending.pendingCount}, 0)`,
				institutionSlug: institutions.slug,
				institutionCategory: institutions.category,
				qrContent: institutions.qrContent,
				supportedPayment: institutions.supportedPayment,
				institutionStatus: institutions.status,
				contributorName: users.name,
			})
			.from(questMosques)
			.leftJoin(institutions, eq(questMosques.institutionId, institutions.id))
			.leftJoin(pending, eq(pending.questMosqueId, questMosques.id))
			.leftJoin(
				questAttempts,
				and(
					eq(questAttempts.questMosqueId, questMosques.id),
					eq(questAttempts.institutionId, questMosques.institutionId),
					eq(questAttempts.status, "approved"),
				),
			)
			.leftJoin(users, eq(questAttempts.userId, users.id))
			.orderBy(questMosques.name);

		return rows.map((r) => {
			const pendingAttempts = Number(r.pendingAttempts);
			const status = deriveQuestStatus({
				linkedInstitutionStatus: r.institutionStatus as
					| "approved"
					| "pending"
					| "rejected"
					| null,
				pendingAttempts,
			});
			const hasQr = status === "has_qr";
			return {
				id: r.id,
				name: r.name,
				address: r.address,
				coords: r.coords,
				status,
				pendingAttempts,
				institutionSlug: hasQr ? r.institutionSlug : null,
				institutionCategory: hasQr ? r.institutionCategory : null,
				qrContent: hasQr ? r.qrContent : null,
				supportedPayment: hasQr ? r.supportedPayment : null,
				contributorName: hasQr ? r.contributorName : null,
			};
		});
	},
	["quest-mosques"],
	{ revalidate: 300, tags: ["quest-mosques"] },
);

export const getQuestLeaderboard = unstable_cache(
	async (): Promise<QuestLeaderboardEntry[]> => {
		const contributionsCount = count(questAttempts.id);
		const rows = await db
			.select({
				userId: users.id,
				name: users.name,
				image: sql<string | null>`coalesce(${users.image}, ${users.avatarUrl})`,
				count: contributionsCount,
			})
			.from(questAttempts)
			.innerJoin(
				questMosques,
				and(
					eq(questAttempts.questMosqueId, questMosques.id),
					eq(questAttempts.institutionId, questMosques.institutionId),
				),
			)
			.innerJoin(users, eq(questAttempts.userId, users.id))
			.where(
				and(
					isNotNull(questAttempts.userId),
					eq(questAttempts.status, "approved"),
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
