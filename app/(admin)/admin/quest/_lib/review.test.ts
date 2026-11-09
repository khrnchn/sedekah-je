import assert from "node:assert/strict";
import { test } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { reviewExistingQuestAttempt } from "@/app/(admin)/admin/quest/_lib/review";
import { db } from "@/db";
import { institutions, questAttempts, questMosques, users } from "@/db/schema";
import { env } from "@/env";
import { syncQuestMosques } from "@/lib/features/quest/sync";

// Opt in explicitly; refuse any non-loopback database. Never use the project's real DB.
const enabled = process.env.QUEST_LOCAL_TESTS === "true";
if (
	enabled &&
	!["127.0.0.1", "localhost"].includes(new URL(env.DATABASE_URL).hostname)
)
	throw new Error("Quest review tests require a disposable loopback database");
const localTest = enabled ? test : test.skip;

async function withSeed(
	run: (seed: {
		adminId: string;
		mosqueA: number;
		mosqueB: number;
		listingId: number;
		attemptA: number;
		attemptB: number;
	}) => Promise<void>,
) {
	const tag = `quest-review-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
	const [admin] = await db
		.insert(users)
		.values({ id: tag, email: `${tag}@example.test`, role: "admin" })
		.returning();
	const mosques = await db
		.insert(questMosques)
		.values([
			{ name: "Masjid A", district: "Petaling", jaisId: `${tag}-a` },
			{ name: "Masjid B", district: "Petaling", jaisId: `${tag}-b` },
		])
		.returning();
	const [listing] = await db
		.insert(institutions)
		.values({
			name: "Masjid Ujian",
			slug: tag,
			category: "masjid",
			state: "Selangor",
			city: "Petaling Jaya",
			status: "approved",
		})
		.returning();
	const attempts = await db
		.insert(questAttempts)
		.values(
			mosques.map((mosque) => ({
				questMosqueId: mosque.id,
				institutionId: listing.id,
				kind: "existing" as const,
			})),
		)
		.returning();
	const mosqueIds = mosques.map((mosque) => mosque.id);
	try {
		await run({
			adminId: admin.id,
			mosqueA: mosques[0].id,
			mosqueB: mosques[1].id,
			listingId: listing.id,
			attemptA: attempts[0].id,
			attemptB: attempts[1].id,
		});
	} finally {
		await db
			.delete(questAttempts)
			.where(inArray(questAttempts.questMosqueId, mosqueIds));
		await db.delete(questMosques).where(inArray(questMosques.id, mosqueIds));
		await db.delete(institutions).where(eq(institutions.id, listing.id));
		await db.delete(users).where(eq(users.id, admin.id));
	}
}

async function linkedTo(mosqueId: number) {
	const [row] = await db
		.select({ institutionId: questMosques.institutionId })
		.from(questMosques)
		.where(eq(questMosques.id, mosqueId));
	return row.institutionId;
}

async function statusOf(attemptId: number) {
	const [row] = await db
		.select({ status: questAttempts.status })
		.from(questAttempts)
		.where(eq(questAttempts.id, attemptId));
	return row.status;
}

localTest("approving a listing linked elsewhere rejects it", async () => {
	await withSeed(
		async ({ adminId, mosqueA, mosqueB, listingId, attemptA, attemptB }) => {
			const first = await db.transaction((tx) =>
				reviewExistingQuestAttempt(tx, attemptA, "approved", adminId),
			);
			assert.equal(first, "reviewed");
			assert.equal(await linkedTo(mosqueA), listingId);

			const second = await db.transaction((tx) =>
				reviewExistingQuestAttempt(tx, attemptB, "approved", adminId),
			);
			assert.equal(second, "already_linked");
			assert.equal(await statusOf(attemptB), "rejected");
			assert.equal(await linkedTo(mosqueB), null);
			assert.equal(await linkedTo(mosqueA), listingId);
		},
	);
});

localTest("sync skips a listing linked to another mosque", async () => {
	await withSeed(async ({ mosqueA, mosqueB, listingId }) => {
		await db
			.update(questAttempts)
			.set({ status: "approved" })
			.where(inArray(questAttempts.questMosqueId, [mosqueA, mosqueB]));
		await syncQuestMosques(db, [mosqueA, mosqueB]);
		assert.equal(await linkedTo(mosqueA), listingId);
		assert.equal(await linkedTo(mosqueB), null);
	});
});
