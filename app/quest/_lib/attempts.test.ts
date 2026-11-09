import assert from "node:assert/strict";
import { test } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { insertQuestAttempt } from "@/app/quest/_lib/attempts";
import { db } from "@/db";
import { institutions, questAttempts, questMosques, users } from "@/db/schema";
import { env } from "@/env";
import { getTelegramReviewCandidate } from "@/lib/integrations/telegram/review-repository";

// Opt in explicitly; refuse any non-loopback database. Never use the project's real DB.
const enabled = process.env.QUEST_LOCAL_TESTS === "true";
if (
	enabled &&
	!["127.0.0.1", "localhost"].includes(new URL(env.DATABASE_URL).hostname)
)
	throw new Error("Quest attempt tests require a disposable loopback database");
const localTest = enabled ? test : test.skip;

async function withSeed(
	run: (seed: {
		mosqueId: number;
		userId: string;
		institution: (
			status: "pending" | "approved" | "rejected",
		) => Promise<number>;
	}) => Promise<void>,
) {
	const tag = `quest-attempt-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
	const [user] = await db
		.insert(users)
		.values({ id: tag, email: `${tag}@example.test` })
		.returning();
	const [mosque] = await db
		.insert(questMosques)
		.values({ name: "Masjid Ujian", district: "Petaling", jaisId: tag })
		.returning();
	const institutionIds: number[] = [];
	try {
		await run({
			mosqueId: mosque.id,
			userId: user.id,
			async institution(status) {
				const [row] = await db
					.insert(institutions)
					.values({
						name: "Masjid Ujian",
						slug: `${tag}-${institutionIds.length}`,
						category: "masjid",
						state: "Selangor",
						city: "Petaling Jaya",
						status,
					})
					.returning();
				institutionIds.push(row.id);
				return row.id;
			},
		});
	} finally {
		await db
			.delete(questAttempts)
			.where(eq(questAttempts.questMosqueId, mosque.id));
		await db.delete(questMosques).where(eq(questMosques.id, mosque.id));
		if (institutionIds.length > 0)
			await db
				.delete(institutions)
				.where(inArray(institutions.id, institutionIds));
		await db.delete(users).where(eq(users.id, user.id));
	}
}

async function attemptCount(mosqueId: number) {
	const rows = await db
		.select({ id: questAttempts.id })
		.from(questAttempts)
		.where(eq(questAttempts.questMosqueId, mosqueId));
	return rows.length;
}

localTest("mosque linked to approved listing returns has_qr", async () => {
	await withSeed(async ({ mosqueId, userId, institution }) => {
		const linked = await institution("approved");
		await db
			.update(questMosques)
			.set({ institutionId: linked })
			.where(eq(questMosques.id, mosqueId));
		const other = await institution("pending");
		const outcome = await db.transaction((tx) =>
			insertQuestAttempt(tx, {
				questMosqueId: mosqueId,
				userId,
				kind: "new",
				institutionId: other,
			}),
		);
		assert.deepEqual(outcome, { result: "has_qr" });
		assert.equal(await attemptCount(mosqueId), 0);
	});
});

localTest("mosque linked to pending listing still accepts", async () => {
	await withSeed(async ({ mosqueId, userId, institution }) => {
		const linked = await institution("pending");
		await db
			.update(questMosques)
			.set({ institutionId: linked })
			.where(eq(questMosques.id, mosqueId));
		const other = await institution("pending");
		const outcome = await insertQuestAttempt(db, {
			questMosqueId: mosqueId,
			userId,
			kind: "new",
			institutionId: other,
		});
		assert.equal(outcome.result, "ok");
		assert.equal(await attemptCount(mosqueId), 1);
	});
});

localTest(
	"same mosque and listing twice returns already_submitted",
	async () => {
		await withSeed(async ({ mosqueId, userId, institution }) => {
			const listing = await institution("approved");
			const input = {
				questMosqueId: mosqueId,
				userId,
				kind: "existing" as const,
				institutionId: listing,
			};
			const first = await db.transaction((tx) => insertQuestAttempt(tx, input));
			assert.equal(first.result, "ok");
			assert.deepEqual(
				await db.transaction((tx) => insertQuestAttempt(tx, input)),
				{ result: "already_submitted" },
			);
			assert.equal(await attemptCount(mosqueId), 1);
		});
	},
);

localTest(
	"review card counts pending and approved attempts for the mosque",
	async () => {
		await withSeed(async ({ mosqueId, userId, institution }) => {
			const fresh = await institution("pending");
			const approved = await institution("approved");
			const rejected = await institution("approved");
			const unrelated = await institution("pending");
			await db.insert(questAttempts).values([
				{ questMosqueId: mosqueId, userId, kind: "new", institutionId: fresh },
				{
					questMosqueId: mosqueId,
					userId,
					kind: "existing",
					institutionId: approved,
					status: "approved",
				},
				{
					questMosqueId: mosqueId,
					userId,
					kind: "existing",
					institutionId: rejected,
					status: "rejected",
				},
			]);

			const card = await getTelegramReviewCandidate(fresh, "all");
			assert.deepEqual(card?.quest, {
				mosqueName: "Masjid Ujian",
				attempts: 2,
			});
			const plain = await getTelegramReviewCandidate(unrelated, "all");
			assert.equal(plain?.quest, undefined);
		});
	},
);
