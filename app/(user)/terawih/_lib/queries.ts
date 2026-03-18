import "server-only";

import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { institutions, ramadhanCampaigns, terawihSessions } from "@/db/schema";
import { INSTITUTION_STATUSES } from "@/lib/institution-constants";
import {
	buildWrappedSummary,
	getTodayDateStringInTimezone,
} from "@/lib/terawih";

export type TerawihInstitutionOption = {
	id: number;
	name: string;
	slug: string;
	category: string;
	state: string;
};

export type TerawihSessionListItem = {
	id: number;
	sessionDate: string;
	startTime: string;
	endTime: string;
	durationMinutes: number;
	rakaat: number;
	averageMpr: number;
	mosqueName: string;
	shareSlug: string;
};

export type TerawihSessionDetail = TerawihSessionListItem & {
	notes: string | null;
	institutionId: number | null;
	pendingInstitutionName: string | null;
	ramadanStartDate: string | null;
};

export type TerawihDashboardStats = {
	totalNights: number;
	totalMinutes: number;
	totalRakaat: number;
	averageMpr: number;
};

export type TerawihWrappedData = {
	year: number;
	startDate: string;
	endDate: string;
	summary: ReturnType<typeof buildWrappedSummary>;
};

async function requireUserSession() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}

export async function getTerawihInstitutions(): Promise<
	TerawihInstitutionOption[]
> {
	return unstable_cache(
		async () => {
			return db
				.select({
					id: institutions.id,
					name: institutions.name,
					slug: institutions.slug,
					category: institutions.category,
					state: institutions.state,
				})
				.from(institutions)
				.where(eq(institutions.status, INSTITUTION_STATUSES.APPROVED))
				.orderBy(asc(institutions.name));
		},
		["terawih-institutions"],
		{ revalidate: 900, tags: ["institutions", "terawih-institutions"] },
	)();
}

export async function getTerawihDashboardData(): Promise<{
	stats: TerawihDashboardStats;
	sessions: TerawihSessionListItem[];
}> {
	const session = await requireUserSession();
	const userId = session.user.id;

	const rows = await db
		.select({
			id: terawihSessions.id,
			sessionDate: terawihSessions.sessionDate,
			startTime: terawihSessions.startTime,
			endTime: terawihSessions.endTime,
			durationMinutes: terawihSessions.durationMinutes,
			rakaat: terawihSessions.rakaat,
			averageMpr: terawihSessions.averageMpr,
			pendingInstitutionName: terawihSessions.pendingInstitutionName,
			shareSlug: terawihSessions.shareSlug,
			institutionName: institutions.name,
		})
		.from(terawihSessions)
		.leftJoin(institutions, eq(terawihSessions.institutionId, institutions.id))
		.where(eq(terawihSessions.userId, userId))
		.orderBy(
			desc(terawihSessions.sessionDate),
			desc(terawihSessions.createdAt),
		);

	const sessions = rows.map((row) => ({
		id: row.id,
		sessionDate: row.sessionDate,
		startTime: row.startTime,
		endTime: row.endTime,
		durationMinutes: row.durationMinutes,
		rakaat: row.rakaat,
		averageMpr: row.averageMpr,
		mosqueName: row.institutionName ?? row.pendingInstitutionName ?? "Masjid",
		shareSlug: row.shareSlug,
	}));

	const totalMinutes = sessions.reduce(
		(total, item) => total + item.durationMinutes,
		0,
	);
	const totalRakaat = sessions.reduce((total, item) => total + item.rakaat, 0);

	return {
		stats: {
			totalNights: sessions.length,
			totalMinutes,
			totalRakaat,
			averageMpr:
				totalRakaat > 0 ? Number((totalMinutes / totalRakaat).toFixed(2)) : 0,
		},
		sessions,
	};
}

export async function getTerawihSessionById(
	id: number,
): Promise<TerawihSessionDetail | null> {
	const session = await requireUserSession();

	const [row] = await db
		.select({
			id: terawihSessions.id,
			sessionDate: terawihSessions.sessionDate,
			startTime: terawihSessions.startTime,
			endTime: terawihSessions.endTime,
			durationMinutes: terawihSessions.durationMinutes,
			rakaat: terawihSessions.rakaat,
			averageMpr: terawihSessions.averageMpr,
			notes: terawihSessions.notes,
			institutionId: terawihSessions.institutionId,
			pendingInstitutionName: terawihSessions.pendingInstitutionName,
			shareSlug: terawihSessions.shareSlug,
			institutionName: institutions.name,
		})
		.from(terawihSessions)
		.leftJoin(institutions, eq(terawihSessions.institutionId, institutions.id))
		.where(
			and(
				eq(terawihSessions.id, id),
				eq(terawihSessions.userId, session.user.id),
			),
		)
		.limit(1);

	if (!row) return null;

	const ramadanStartDate = await getRamadanCampaignStart(
		Number(row.sessionDate.slice(0, 4)),
	);

	return {
		id: row.id,
		sessionDate: row.sessionDate,
		startTime: row.startTime,
		endTime: row.endTime,
		durationMinutes: row.durationMinutes,
		rakaat: row.rakaat,
		averageMpr: row.averageMpr,
		mosqueName: row.institutionName ?? row.pendingInstitutionName ?? "Masjid",
		notes: row.notes,
		institutionId: row.institutionId,
		pendingInstitutionName: row.pendingInstitutionName,
		shareSlug: row.shareSlug,
		ramadanStartDate,
	};
}

export async function getTerawihWrappedData(
	year = new Date().getFullYear(),
): Promise<TerawihWrappedData | null> {
	const session = await requireUserSession();
	const startDate = await getRamadanCampaignStart(year);

	if (!startDate) {
		return null;
	}

	const start = new Date(`${startDate}T00:00:00`);
	const end = new Date(start);
	end.setDate(end.getDate() + 29);
	const endDate = end.toISOString().slice(0, 10);

	const rows = await db
		.select({
			sessionDate: terawihSessions.sessionDate,
			durationMinutes: terawihSessions.durationMinutes,
			rakaat: terawihSessions.rakaat,
			averageMpr: terawihSessions.averageMpr,
			pendingInstitutionName: terawihSessions.pendingInstitutionName,
			institutionName: institutions.name,
		})
		.from(terawihSessions)
		.leftJoin(institutions, eq(terawihSessions.institutionId, institutions.id))
		.where(
			and(
				eq(terawihSessions.userId, session.user.id),
				gte(terawihSessions.sessionDate, startDate),
				lte(terawihSessions.sessionDate, endDate),
			),
		)
		.orderBy(asc(terawihSessions.sessionDate));

	return {
		year,
		startDate,
		endDate,
		summary: buildWrappedSummary(
			rows.map((row) => ({
				sessionDate: row.sessionDate,
				durationMinutes: row.durationMinutes,
				rakaat: row.rakaat,
				averageMpr: row.averageMpr,
				mosqueName:
					row.institutionName ??
					row.pendingInstitutionName ??
					"Masjid tidak diketahui",
			})),
		),
	};
}

export function getDefaultTerawihDate(): string {
	return getTodayDateStringInTimezone("Asia/Kuala_Lumpur");
}

async function getRamadanCampaignStart(year: number): Promise<string | null> {
	const [row] = await db
		.select({ featuredDate: ramadhanCampaigns.featuredDate })
		.from(ramadhanCampaigns)
		.where(
			and(eq(ramadhanCampaigns.year, year), eq(ramadhanCampaigns.dayNumber, 1)),
		)
		.limit(1);

	if (!row) return null;
	return typeof row.featuredDate === "string"
		? row.featuredDate
		: row.featuredDate.toISOString().slice(0, 10);
}
