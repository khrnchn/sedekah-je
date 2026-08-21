import {
	and,
	asc,
	count,
	eq,
	gt,
	isNull,
	like,
	lt,
	lte,
	ne,
	not,
	or,
	sql,
} from "drizzle-orm";
import { db } from "@/db";
import { institutions, telegramReviewSessions, users } from "@/db/schema";
import type {
	TelegramReviewCandidate,
	TelegramReviewScope,
} from "@/lib/integrations/telegram/review-ui";

function getScopeCondition(scope: TelegramReviewScope) {
	if (scope === "all") return sql`true`;
	const automated = and(
		not(isNull(institutions.sourceUrl)),
		ne(institutions.sourceUrl, ""),
		not(like(institutions.sourceUrl, "http%")),
	);
	return scope === "imports"
		? automated
		: or(
				isNull(institutions.sourceUrl),
				eq(institutions.sourceUrl, ""),
				like(institutions.sourceUrl, "http%"),
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
					or(
						lt(institutions.createdAt, row.createdAt),
						and(
							eq(institutions.createdAt, row.createdAt),
							lte(institutions.id, row.id),
						),
					),
				),
			),
		db
			.select({ value: count() })
			.from(institutions)
			.where(and(eq(institutions.status, "pending"), scopeCondition)),
	]);

	return {
		...row,
		duplicateInstitutionId: duplicate[0]?.id ?? null,
		position: positionResult[0]?.value ?? 1,
		total: totalResult[0]?.value ?? 0,
	};
}

const candidateSelection = {
	id: institutions.id,
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
				getScopeCondition(scope),
			),
		)
		.limit(1);
	return row ? hydrateCandidate(row, scope) : null;
}

export async function getNextTelegramReviewCandidate(
	scope: TelegramReviewScope,
	afterInstitutionId?: number,
): Promise<TelegramReviewCandidate | null> {
	let cursor: { id: number; createdAt: Date } | undefined;
	if (afterInstitutionId) {
		[cursor] = await db
			.select({ id: institutions.id, createdAt: institutions.createdAt })
			.from(institutions)
			.where(eq(institutions.id, afterInstitutionId))
			.limit(1);
	}

	const afterCondition = cursor
		? or(
				gt(institutions.createdAt, cursor.createdAt),
				and(
					eq(institutions.createdAt, cursor.createdAt),
					gt(institutions.id, cursor.id),
				),
			)
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
		.orderBy(asc(institutions.createdAt), asc(institutions.id))
		.limit(1);
	return row ? hydrateCandidate(row, scope) : null;
}

export async function getTelegramQueueCounts() {
	const [row] = await db
		.select({
			all: count(),
			community:
				sql<number>`count(*) filter (where ${getScopeCondition("community")})`.mapWith(
					Number,
				),
			imports:
				sql<number>`count(*) filter (where ${getScopeCondition("imports")})`.mapWith(
					Number,
				),
		})
		.from(institutions)
		.where(eq(institutions.status, "pending"));
	return {
		all: row?.all ?? 0,
		community: row?.community ?? 0,
		imports: row?.imports ?? 0,
	};
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
