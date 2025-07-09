"use server";

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

		return {
			users: result.data.users,
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
