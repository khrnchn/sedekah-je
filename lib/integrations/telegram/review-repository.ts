import {
	and,
	asc,
	count,
	eq,
	gt,
	isNull,
	like,
	lte,
	ne,
	not,
	or,
	sql,
} from "drizzle-orm";
import { db } from "@/db";
import { institutions, telegramReviewSessions, users } from "@/db/schema";
import { reviewVersion } from "@/lib/features/institution-review/telegram-evidence";
import type {
	TelegramReviewCandidate,
	TelegramReviewScope,
} from "@/lib/integrations/telegram/review-ui";
import { findReviewDuplicates } from "./review-operations";

function getScopeCondition(scope: TelegramReviewScope) {
	if (scope === "held")
		return sql`coalesce(${institutions.reviewMetadata}->>'held', 'false') = 'true'`;
	if (scope === "all")
		return sql`coalesce(${institutions.reviewMetadata}->>'held', 'false') <> 'true'`;
	const automated = and(
		not(isNull(institutions.sourceUrl)),
		ne(institutions.sourceUrl, ""),
		not(like(institutions.sourceUrl, "http%")),
	);
	return and(
		sql`coalesce(${institutions.reviewMetadata}->>'held', 'false') <> 'true'`,
		scope === "imports"
			? automated
			: or(
					isNull(institutions.sourceUrl),
					eq(institutions.sourceUrl, ""),
					like(institutions.sourceUrl, "http%"),
				),
	);
}

async function hydrateCandidate(
	row: Omit<
		TelegramReviewCandidate,
		"duplicateInstitutionId" | "position" | "total"
	>,
	scope: TelegramReviewScope,
): Promise<TelegramReviewCandidate> {
	const scopeCondition = getScopeCondition(scope);
	const duplicate = row.qrContent
		? await db
				.select({ id: institutions.id })
				.from(institutions)
				.where(
					and(
						eq(institutions.qrContent, row.qrContent),
						ne(institutions.id, row.id),
						ne(institutions.status, "rejected"),
					),
				)
				.limit(1)
		: [];
	const [positionResult, totalResult] = await Promise.all([
		db
			.select({ value: count() })
			.from(institutions)
			.where(
				and(
					eq(institutions.status, "pending"),
					scopeCondition,
					lte(institutions.id, row.id),
				),
			),
		db
			.select({ value: count() })
			.from(institutions)
			.where(and(eq(institutions.status, "pending"), scopeCondition)),
	]);

	return {
		...row,
		version: reviewVersion(row),
		duplicates: await findReviewDuplicates(row),
		duplicateInstitutionId: duplicate[0]?.id ?? null,
		position: positionResult[0]?.value ?? 1,
		total: totalResult[0]?.value ?? 0,
	};
}

const candidateSelection = {
	id: institutions.id,
	reviewMetadata: institutions.reviewMetadata,
	name: institutions.name,
	category: institutions.category,
	state: institutions.state,
	city: institutions.city,
	address: institutions.address,
	qrImage: institutions.qrImage,
	qrContent: institutions.qrContent,
	supportedPayment: institutions.supportedPayment,
	coords: institutions.coords,
	contributorName: users.name,
	partnerName: sql<string | null>`(
		select ${users.name}
		from ${users}
		where ${users.id} = ${institutions.partnerId}
		limit 1
	)`,
	sourceUrl: institutions.sourceUrl,
	createdAt: institutions.createdAt,
};

export async function getTelegramReviewCandidate(
	institutionId: number,
	scope: TelegramReviewScope,
): Promise<TelegramReviewCandidate | null> {
	const [row] = await db
		.select(candidateSelection)
		.from(institutions)
		.leftJoin(users, eq(institutions.contributorId, users.id))
		.where(
			and(
				eq(institutions.id, institutionId),
				eq(institutions.status, "pending"),
				scope === "all" ? sql`true` : getScopeCondition(scope),
			),
		)
		.limit(1);
	return row ? hydrateCandidate(row, scope) : null;
}

export async function getNextTelegramReviewCandidate(
	scope: TelegramReviewScope,
	afterInstitutionId?: number,
): Promise<TelegramReviewCandidate | null> {
	const afterCondition = afterInstitutionId
		? gt(institutions.id, afterInstitutionId)
		: sql`true`;
	const [row] = await db
		.select(candidateSelection)
		.from(institutions)
		.leftJoin(users, eq(institutions.contributorId, users.id))
		.where(
			and(
				eq(institutions.status, "pending"),
				getScopeCondition(scope),
				afterCondition,
			),
		)
		.orderBy(asc(institutions.id))
		.limit(1);
	return row ? hydrateCandidate(row, scope) : null;
}

export async function getTelegramQueueCounts() {
	const reviewable = getScopeCondition("all");
	const [row] = await db
		.select({
			totalPending: count(),
			held: sql<number>`count(*) filter (where ${getScopeCondition("held")})`.mapWith(
				Number,
			),
			all: sql<number>`count(*) filter (where ${reviewable})`.mapWith(Number),
			community:
				sql<number>`count(*) filter (where ${and(reviewable, getScopeCondition("community"))})`.mapWith(
					Number,
				),
			imports:
				sql<number>`count(*) filter (where ${and(reviewable, getScopeCondition("imports"))})`.mapWith(
					Number,
				),
			needsExtraction:
				sql<number>`count(*) filter (where ${institutions.qrContent} is null or trim(${institutions.qrContent}) = '')`.mapWith(
					Number,
				),
		})
		.from(institutions)
		.where(eq(institutions.status, "pending"));
	return {
		all: row?.all ?? 0,
		held: row?.held ?? 0,
		community: row?.community ?? 0,
		imports: row?.imports ?? 0,
		needsExtraction: row?.needsExtraction ?? 0,
		totalPending: row?.totalPending ?? 0,
	};
}

export async function searchTelegramReviewCandidates(
	query: string,
	limit = 5,
): Promise<Array<{ id: number; name: string }>> {
	const trimmed = query.trim();
	if (!trimmed) return [];
	return db
		.select({ id: institutions.id, name: institutions.name })
		.from(institutions)
		.where(
			and(
				eq(institutions.status, "pending"),
				sql`${institutions.name} ilike ${`%${trimmed}%`}`,
			),
		)
		.orderBy(asc(institutions.id))
		.limit(limit);
}

export async function saveTelegramReviewSession(input: {
	telegramChatId: string;
	scope: TelegramReviewScope;
	cursorInstitutionId: number;
}) {
	await db
		.insert(telegramReviewSessions)
		.values({
			telegramChatId: input.telegramChatId,
			scope: input.scope,
			cursorInstitutionId: input.cursorInstitutionId,
		})
		.onConflictDoUpdate({
			target: telegramReviewSessions.telegramChatId,
			set: {
				scope: input.scope,
				cursorInstitutionId: input.cursorInstitutionId,
				updatedAt: new Date(),
			},
		});
}

export async function getTelegramReviewSession(
	telegramChatId: string,
): Promise<{
	scope: TelegramReviewScope;
	cursorInstitutionId: number | null;
} | null> {
	const [session] = await db
		.select({
			scope: telegramReviewSessions.scope,
			cursorInstitutionId: telegramReviewSessions.cursorInstitutionId,
		})
		.from(telegramReviewSessions)
		.where(eq(telegramReviewSessions.telegramChatId, telegramChatId))
		.limit(1);
	return session ?? null;
}
