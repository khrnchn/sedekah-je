"use server";

import { db } from "@/db";
import { institutions } from "@/db/schema";
import type { User } from "better-auth";
import { inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { getAuthClientFromCookie } from "./client";

function normalizeParam(v: string | string[] | undefined): string {
	if (v === undefined || v === null) return "";
	if (Array.isArray(v)) return (v[0] ?? "").trim();
	return String(v).trim();
}

export async function getUsers(searchParams: {
	[key: string]: string | string[] | undefined;
}) {
	const headersList = await headers();
	const cookie = headersList.get("cookie") ?? "";
	const forwardedProto = headersList.get("x-forwarded-proto");
	const forwardedHost = headersList.get("x-forwarded-host");
	const host = headersList.get("host");
	const baseHost = forwardedHost ?? host ?? "";
	const baseURL = baseHost
		? `${forwardedProto ?? (baseHost.includes("localhost") ? "http" : "https")}://${baseHost}`
		: undefined;
	const qNorm = normalizeParam(searchParams.q);
	const pageNorm = String(Number(searchParams.page) || 1);
	const limitNorm = String(Number(searchParams.limit) || 10);
	const sortByNorm = normalizeParam(searchParams.sortBy);
	const sortDirNorm = normalizeParam(searchParams.sortDirection);

	return unstable_cache(
		async () => {
			const authClient = getAuthClientFromCookie(cookie, baseURL);
			const pageNumber = Number(pageNorm) || 1;
			const pageLimit = Number(limitNorm) || 10;
			const offset = (pageNumber - 1) * pageLimit;

			try {
				const result = await authClient.admin.listUsers({
					query: {
						limit: pageLimit,
						offset,
						...(qNorm && {
							searchValue: qNorm,
							searchField: "email",
							searchOperator: "contains",
						}),
						...(sortByNorm && { sortBy: sortByNorm }),
						...(sortDirNorm && {
							sortDirection: sortDirNorm as "asc" | "desc",
						}),
					},
				});

				if (result.error) {
					throw result.error;
				}

				if (!result.data) {
					throw new Error("No data returned from listUsers");
				}

				const userIds = result.data.users.map((u: User) => u.id);

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
				const usersWithContributions = result.data.users.map((user: User) => {
					const userContributions = contributionsByUser[user.id] || [];
					userContributions.sort(
						(a, b) =>
							(b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
					);

					const contributionStats = {
						total: userContributions.length,
						approved: userContributions.filter((i) => i.status === "approved")
							.length,
						pending: userContributions.filter((i) => i.status === "pending")
							.length,
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
		},
		["users-list", qNorm, pageNorm, limitNorm, sortByNorm, sortDirNorm],
		{
			tags: ["users-data"],
			revalidate: 60, // 1 minute
		},
	)();
}
