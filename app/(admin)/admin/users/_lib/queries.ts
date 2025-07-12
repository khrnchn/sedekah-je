"use server";

import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { count, desc, eq, inArray } from "drizzle-orm";
import { getAuthClient } from "./client";

export async function getUsers(searchParams: {
	[key: string]: string | string[] | undefined;
}) {
	const { q, page, limit, sortBy, sortDirection } = searchParams;
	const pageNumber = Number(page) || 1;
	const pageLimit = Number(limit) || 10;
	const offset = (pageNumber - 1) * pageLimit;

	const authClient = getAuthClient();

	try {
		const result = await authClient.admin.listUsers({
			query: {
				limit: pageLimit,
				offset,
				...(q && {
					searchValue: q as string,
					searchField: "email",
					searchOperator: "contains",
				}),
				...(sortBy && { sortBy: sortBy as string }),
				...(sortDirection && {
					sortDirection: sortDirection as "asc" | "desc",
				}),
			},
		});

		if (result.error) {
			throw result.error;
		}

		if (!result.data) {
			throw new Error("No data returned from listUsers");
		}

		const userIds = result.data.users.map((u) => u.id);

		if (userIds.length === 0) {
			return {
				users: [],
				total: result.data.total,
				limit: pageLimit,
				offset,
			};
		}

		const allContributions = await db
			.select({
				contributorId: institutions.contributorId,
				id: institutions.id,
				name: institutions.name,
				status: institutions.status,
				category: institutions.category,
				createdAt: institutions.createdAt,
			})
			.from(institutions)
			.where(inArray(institutions.contributorId, userIds));

		const contributionsByUser = allContributions.reduce(
			(acc, contribution) => {
				if (!contribution.contributorId) return acc;
				if (!acc[contribution.contributorId]) {
					acc[contribution.contributorId] = [];
				}
				acc[contribution.contributorId].push(contribution);
				return acc;
			},
			{} as Record<string, (typeof allContributions)[0][]>,
		);

		// Enhance users with contribution data
		const usersWithContributions = result.data.users.map((user) => {
			const userContributions = contributionsByUser[user.id] || [];
			userContributions.sort(
				(a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
			);

			const contributionStats = {
				total: userContributions.length,
				approved: userContributions.filter((i) => i.status === "approved")
					.length,
				pending: userContributions.filter((i) => i.status === "pending").length,
				rejected: userContributions.filter((i) => i.status === "rejected")
					.length,
			};

			return {
				...user,
				createdAt: user.createdAt.toISOString(),
				contributionStats,
				institutions: userContributions.map((inst) => ({
					id: inst.id,
					name: inst.name,
					status: inst.status as "pending" | "approved" | "rejected",
					category: inst.category,
					createdAt: inst.createdAt?.toISOString() ?? "",
				})),
			};
		});

		return {
			users: usersWithContributions,
			total: result.data.total,
			limit: pageLimit,
			offset,
		};
	} catch (error) {
		console.error("Failed to fetch users:", error);
		// In a real app, you'd want to handle this error more gracefully
		return {
			users: [],
			total: 0,
			limit: pageLimit,
			offset,
		};
	}
}
