import assert from "node:assert/strict";
import { test } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { institutions, questAttempts, questMosques } from "@/db/schema";
import { env } from "@/env";
import { syncQuestForInstitutions } from "@/lib/features/quest/sync";

// Opt in explicitly; refuse any non-loopback database. Never use the project's real DB.
const enabled = process.env.QUEST_LOCAL_TESTS === "true";
if (
	enabled &&
	!["127.0.0.1", "localhost"].includes(new URL(env.DATABASE_URL).hostname)
)
	throw new Error("Quest sync tests require a disposable loopback database");
const localTest = enabled ? test : test.skip;

async function withSeed(
	run: (seed: {
		mosqueId: number;
		institution: (
			status: "pending" | "approved" | "rejected",
			attemptStatus: "pending" | "approved" | "rejected",
			createdAt: Date,
		) => Promise<number>;
	}) => Promise<void>,
) {
	const tag = `quest-sync-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
	const [mosque] = await db
		.insert(questMosques)
		.values({ name: "Masjid Ujian", district: "Petaling", jaisId: tag })
		.returning();
	const institutionIds: number[] = [];
	try {
		await run({
			mosqueId: mosque.id,
			async institution(status, attemptStatus, createdAt) {
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
				await db.insert(questAttempts).values({
					questMosqueId: mosque.id,
					institutionId: row.id,
					kind: "new",
					status: attemptStatus,
					createdAt,
				});
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
	}
}

async function link(mosqueId: number, institutionId: number | null) {
	await db
		.update(questMosques)
		.set({ institutionId })
		.where(eq(questMosques.id, mosqueId));
}

async function setStatus(
	institutionId: number,
	status: "pending" | "approved" | "rejected",
) {
	await db
		.update(institutions)
		.set({ status })
		.where(eq(institutions.id, institutionId));
}

async function linkedTo(mosqueId: number) {
	const [row] = await db
		.select({ institutionId: questMosques.institutionId })
		.from(questMosques)
		.where(eq(questMosques.id, mosqueId));
	return row.institutionId;
}

async function attemptStatus(institutionId: number) {
	const [row] = await db
		.select({ status: questAttempts.status })
		.from(questAttempts)
		.where(eq(questAttempts.institutionId, institutionId));
	return row.status;
}

localTest("approve new attempt links mosque", async () => {
	await withSeed(async ({ mosqueId, institution }) => {
		const a = await institution("pending", "pending", new Date("2026-11-01"));
		await setStatus(a, "approved");
		const affected = await syncQuestForInstitutions(db, [a]);
		assert.deepEqual(affected, [mosqueId]);
		assert.equal(await linkedTo(mosqueId), a);
		assert.equal(await attemptStatus(a), "approved");
	});
});

localTest("second approval does not steal link", async () => {
	await withSeed(async ({ mosqueId, institution }) => {
		const a = await institution("approved", "approved", new Date("2026-11-02"));
		await link(mosqueId, a);
		const b = await institution("pending", "pending", new Date("2026-11-01"));
		await setStatus(b, "approved");
		await syncQuestForInstitutions(db, [b]);
		assert.equal(await linkedTo(mosqueId), a);
		assert.equal(await attemptStatus(b), "approved");
	});
});

localTest("undo only approval unlinks", async () => {
	await withSeed(async ({ mosqueId, institution }) => {
		const a = await institution("approved", "approved", new Date("2026-11-01"));
		await link(mosqueId, a);
		await setStatus(a, "rejected");
		await syncQuestForInstitutions(db, [a]);
		assert.equal(await linkedTo(mosqueId), null);
		assert.equal(await attemptStatus(a), "rejected");
	});
});

localTest("undo relinks to other approved attempt", async () => {
	await withSeed(async ({ mosqueId, institution }) => {
		const a = await institution("approved", "approved", new Date("2026-11-01"));
		await link(mosqueId, a);
		const b = await institution("approved", "approved", new Date("2026-11-02"));
		await setStatus(a, "rejected");
		await syncQuestForInstitutions(db, [a]);
		assert.equal(await linkedTo(mosqueId), b);
		assert.equal(await attemptStatus(a), "rejected");
	});
});

localTest("revert to pending sets attempt pending and unlinks", async () => {
	await withSeed(async ({ mosqueId, institution }) => {
		const a = await institution("approved", "approved", new Date("2026-11-01"));
		await link(mosqueId, a);
		await setStatus(a, "pending");
		await syncQuestForInstitutions(db, [a]);
		assert.equal(await linkedTo(mosqueId), null);
		assert.equal(await attemptStatus(a), "pending");
	});
});

localTest("legacy link without attempt row is kept", async () => {
	await withSeed(async ({ mosqueId, institution }) => {
		const b = await institution("pending", "pending", new Date("2026-11-01"));
		await db.delete(questAttempts).where(eq(questAttempts.institutionId, b));
		await setStatus(b, "approved");
		await link(mosqueId, b);
		const c = await institution("pending", "pending", new Date("2026-10-01"));
		await setStatus(c, "approved");
		await syncQuestForInstitutions(db, [c]);
		assert.equal(await linkedTo(mosqueId), b);
	});
});

localTest(
	"undo rejection sets attempt pending and stays unlinked",
	async () => {
		await withSeed(async ({ mosqueId, institution }) => {
			const a = await institution(
				"rejected",
				"rejected",
				new Date("2026-11-01"),
			);
			await setStatus(a, "pending");
			await syncQuestForInstitutions(db, [a]);
			assert.equal(await linkedTo(mosqueId), null);
			assert.equal(await attemptStatus(a), "pending");
		});
	},
);
