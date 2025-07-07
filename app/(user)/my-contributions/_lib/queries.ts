"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

export interface MyContributionsStats {
	totalContributions: number;
	approvedContributions: number;
	pendingContributions: number;
	rejectedContributions: number;
}

export interface ContributionItem {
	id: number;
	name: string;
	status: "pending" | "approved" | "rejected";
	date: string; // ISO string
	type: string;
}

export interface MyContributionsResponse {
	stats: MyContributionsStats;
	contributions: ContributionItem[];
}

export async function getMyContributions(): Promise<MyContributionsResponse | null> {
	const hdrs = headers();
	const session = await auth.api.getSession({ headers: hdrs });

	if (!session) {
		return null;
	}

	const userId = session.user.id;

	const results = await db
		.select()
		.from(institutions)
		.where(eq(institutions.contributorId, userId))
		.orderBy(desc(institutions.createdAt));

	const stats: MyContributionsStats = {
		totalContributions: results.length,
		approvedContributions: results.filter((i) => i.status === "approved")
			.length,
		pendingContributions: results.filter((i) => i.status === "pending").length,
		rejectedContributions: results.filter((i) => i.status === "rejected")
			.length,
	};

	const contributions: ContributionItem[] = results.map((inst) => ({
		id: inst.id,
		name: inst.name,
		status: inst.status as ContributionItem["status"],
		date: inst.createdAt?.toISOString() ?? "",
		type: "institution",
	}));

	return { stats, contributions };
}
