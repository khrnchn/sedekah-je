import assert from "node:assert/strict";
import { test } from "node:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { institutions, telegramReviewOperations, users } from "@/db/schema";
import { env } from "@/env";
import {
	reviewPendingInstitution,
	undoInstitutionReview,
} from "@/lib/features/institution-review/review";
import {
	operationVersion,
	reviewVersion,
} from "@/lib/features/institution-review/telegram-evidence";
import { makePayload, makeRecord } from "./__fixtures__/review-records";
import { createTelegramBotClient } from "./bot-api";
import { REVIEW_PROMPT_VERSION } from "./gemini-assessment";
import { runReviewAnalysis, scheduleReviewAnalysis } from "./review-analysis";
import { syncReviewCard } from "./review-card-sync";
import {
	applyReviewOperation,
	createReviewOperation,
	findReviewDuplicates,
} from "./review-operations";
import {
	getNextTelegramReviewCandidate,
	getTelegramReviewCandidate,
	searchTelegramReviewCandidates,
} from "./review-repository";

// Opt in explicitly; refuse any non-loopback database. Never use the project's real DB.
const enabled = process.env.TELEGRAM_REVIEW_LOCAL_TESTS === "true";
if (
	enabled &&
	!["127.0.0.1", "localhost"].includes(new URL(env.DATABASE_URL).hostname)
)
	throw new Error("Review tests require a disposable loopback database");
const localTest = enabled ? test : test.skip;
const actor = "telegram-review-test-admin";
async function seed() {
	await db.delete(telegramReviewOperations);
	await db.delete(institutions);
	await db
		.insert(users)
		.values({
			id: actor,
			name: "Test Admin",
			email: "telegram-review@example.test",
			role: "admin",
			isActive: true,
		})
		.onConflictDoNothing();
	const { id, ...row } = makeRecord({
		slug: `test-${Date.now()}`,
		qrImage: `${env.R2_PUBLIC_URL}/uploads/test.png`,
	});
	const [created] = await db.insert(institutions).values(row).returning();
	return created;
}
async function current(id: number) {
	const [row] = await db
		.select()
		.from(institutions)
		.where(eq(institutions.id, id));
	return row;
}
async function operation(
	row: Awaited<ReturnType<typeof seed>>,
	kind: string,
	payload: Record<string, unknown> = {},
) {
	const promptMessageId = Math.floor(Math.random() * 1_000_000);
	const id = await createReviewOperation({
		chatId: "123",
		institutionId: row.id,
		promptMessageId,
		version: operationVersion(row),
		kind,
		payload,
	});
	return { id, chatId: "123", promptMessageId };
}
localTest(
	"Postgres: holds, missing QR search, stale previews, expiry, authorization and concurrent delivery",
	async () => {
		const row = await seed();
		await db
			.update(institutions)
			.set({ qrContent: null })
			.where(eq(institutions.id, row.id));
		const missing = await current(row.id);
		assert.equal(
			(await getNextTelegramReviewCandidate("community"))?.id,
			row.id,
		);
		assert.equal(
			(await searchTelegramReviewCandidates("Amanah"))[0].id,
			row.id,
		);
		const hold = await operation(missing, "hold");
		const duplicateDelivery = await Promise.allSettled([
			applyReviewOperation(hold, actor),
			applyReviewOperation(hold, actor),
		]);
		assert.equal(
			duplicateDelivery.filter((r) => r.status === "fulfilled").length,
			1,
		);
		assert.equal((await current(row.id)).status, "pending");
		assert.equal(await getNextTelegramReviewCandidate("community"), null);
		assert.equal((await getNextTelegramReviewCandidate("held"))?.id, row.id);
		assert.ok(await getTelegramReviewCandidate(row.id, "all"));
		const held = await current(row.id);
		const stale = await operation(held, "location", { address: "New address" });
		const resume = await operation(held, "resume");
		await applyReviewOperation(resume, actor);
		await assert.rejects(
			() => applyReviewOperation(stale, actor),
			/Record changed/,
		);
		const edit = await operation(await current(row.id), "location", {
			coords: [3.2, 101.7],
		});
		await assert.rejects(
			() => applyReviewOperation({ ...edit, chatId: "999" }, actor),
			/expired/,
		);
		await assert.rejects(
			() => applyReviewOperation({ ...edit, promptMessageId: -1 }, actor),
			/expired/,
		);
		await assert.rejects(
			() => applyReviewOperation(edit, "non-admin"),
			/Unauthorized/,
		);
		await db
			.update(telegramReviewOperations)
			.set({ expiresAt: new Date(0) })
			.where(eq(telegramReviewOperations.id, edit.id));
		await assert.rejects(() => applyReviewOperation(edit, actor), /expired/);
	},
);
localTest(
	"Postgres: QR replacement retains prior image/payload and invalidates evidence",
	async () => {
		const row = await seed();
		await db
			.update(institutions)
			.set({
				reviewMetadata: {
					evidence: {
						version: reviewVersion(row),
						recipientInstitution: true,
						physicalDisplay: true,
					},
				},
			})
			.where(eq(institutions.id, row.id));
		const replacement = await operation(await current(row.id), "qr", {
			qrImage: `${env.R2_PUBLIC_URL}/uploads/new.png`,
			qrContent: makePayload("MASJID BARU"),
		});
		await applyReviewOperation(replacement, actor);
		const updated = await current(row.id);
		assert.equal(updated.reviewMetadata?.evidence, undefined);
		assert.equal(updated.qrContent, makePayload("MASJID BARU"));
		assert.match(
			JSON.stringify(updated.reviewMetadata?.history),
			/MASJID AMANAH/,
		);
		assert.match(JSON.stringify(updated.reviewMetadata?.history), /test.png/);
	},
);
localTest(
	"Postgres: approval rechecks evidence, duplicates and operation; undo cannot undo a later review",
	async () => {
		const row = await seed();
		const evidence = await operation(row, "evidence", {
			physicalDisplay: true,
		});
		await applyReviewOperation(evidence, actor);
		const verified = await current(row.id);
		const approval = await operation(verified, "approve");
		const { id, ...other } = makeRecord({
			slug: "exact-duplicate",
			qrContent: verified.qrContent,
		});
		const [duplicate] = await db.insert(institutions).values(other).returning();
		await assert.rejects(
			() =>
				reviewPendingInstitution({
					institutionId: row.id,
					reviewerId: actor,
					decision: "approved",
					telegramOperation: approval,
				}),
			/Exact payload duplicate/,
		);
		assert.equal((await current(row.id)).status, "pending");
		await db.delete(institutions).where(eq(institutions.id, duplicate.id));
		await reviewPendingInstitution({
			institutionId: row.id,
			reviewerId: actor,
			decision: "approved",
			telegramOperation: approval,
		});
		await assert.rejects(() =>
			reviewPendingInstitution({
				institutionId: row.id,
				reviewerId: actor,
				decision: "approved",
				telegramOperation: approval,
			}),
		);
		const reviewed = await current(row.id),
			undo = await operation(reviewed, "undo");
		await undoInstitutionReview({
			institutionId: row.id,
			reviewerId: actor,
			telegramOperation: undo,
		});
		assert.equal((await current(row.id)).status, "pending");
		await assert.rejects(() =>
			undoInstitutionReview({
				institutionId: row.id,
				reviewerId: actor,
				telegramOperation: undo,
			}),
		);
		assert.equal(
			(await current(row.id)).reviewMetadata?.history?.at(-1)?.action,
			"undo",
		);
	},
);
localTest(
	"Postgres: UPM different QR, 300m suggestions and explicit different institution",
	async () => {
		const row = await seed();
		const { id, ...other } = makeRecord({
			name: "Masjid Amanah",
			slug: "upm-alternate",
			status: "approved",
			qrContent: makePayload("MASJID AMANAH", "PETALING JAYA", "other-account"),
		});
		const [duplicate] = await db.insert(institutions).values(other).returning();
		assert.equal((await findReviewDuplicates(row))[0].reason, "similar_name");
		await applyReviewOperation(
			await operation(row, "different", {
				ids: [duplicate.id],
				versions: { [duplicate.id]: reviewVersion(duplicate) },
			}),
			actor,
		);
		assert.deepEqual(
			(await current(row.id)).reviewMetadata?.differentInstitutions?.ids,
			[duplicate.id],
		);
		await db
			.update(institutions)
			.set({ name: "Other Institution", coords: [3.1001, 101.6] })
			.where(eq(institutions.id, duplicate.id));
		assert.equal((await findReviewDuplicates(row))[0].reason, "nearby");
	},
);
localTest(
	"Postgres: Gemini claims once, caps retries, handles permanent/malformed failures and recovers interrupted work",
	{ timeout: 30000 },
	async () => {
		assert.equal(env.GEMINI_API_KEY, "local-review-test");
		assert.equal(env.TELEGRAM_BOT_TOKEN, undefined);
		const sharp = (await import("sharp")).default;
		const bytes = await sharp({
			create: { width: 16, height: 16, channels: 3, background: "white" },
		})
			.png()
			.toBuffer();
		const originalFetch = globalThis.fetch;
		let requests = 0,
			mode = "success";
		const result = {
			imageType: "digital_artwork",
			visibleInstitution: "Test NGO",
			visibleLocation: "",
			recipientRelationship: "unclear",
			conflicts: ["Recipient truncated"],
			explanation: "Verify official source.",
		};
		globalThis.fetch = Object.assign(async (url: unknown) => {
			if (String(url).startsWith(env.R2_PUBLIC_URL))
				return new Response(bytes, {
					headers: { "Content-Type": "image/png" },
				});
			assert.match(
				String(url),
				/^https:\/\/generativelanguage.googleapis.com\//,
			);
			requests++;
			if (mode === "timeout") throw new DOMException("timeout", "TimeoutError");
			if (mode === "body-timeout")
				return new Response(
					new ReadableStream({
						start(controller) {
							controller.error(new DOMException("timeout", "TimeoutError"));
						},
					}),
				);
			if (mode === "403" || mode === "429")
				return new Response("", { status: Number(mode) });
			return Response.json({
				candidates: [
					{
						content: {
							parts: [
								{
									text:
										mode === "malformed" ? "invalid" : JSON.stringify(result),
								},
							],
						},
					},
				],
			});
		}, {});
		try {
			let row = await seed();
			const work: Array<() => Promise<void>> = [];
			await scheduleReviewAnalysis(row.id, false, (task) => work.push(task));
			assert.equal(
				(await current(row.id)).reviewMetadata?.analysis?.state,
				"queued",
			);
			await Promise.all([work[0](), runReviewAnalysis(row.id)]);
			assert.equal(requests, 1);
			assert.equal(
				(await current(row.id)).reviewMetadata?.analysis?.state,
				"complete",
			);
			await scheduleReviewAnalysis(row.id, false, (task) => work.push(task));
			assert.equal(work.length, 1); // cached
			for (mode of ["403", "429", "malformed", "timeout", "body-timeout"]) {
				row = await seed();
				requests = 0;
				await scheduleReviewAnalysis(row.id, false, (task) => work.push(task));
				const task = work.at(-1);
				assert.ok(task);
				await task();
				assert.equal(
					requests,
					["429", "timeout", "body-timeout"].includes(mode) ? 3 : 1,
				);
				assert.equal(
					(await current(row.id)).reviewMetadata?.analysis?.state,
					"unavailable",
				);
				assert.equal((await current(row.id)).status, "pending");
			}
			mode = "success";
			row = await seed();
			requests = 0;
			await db
				.update(institutions)
				.set({
					reviewMetadata: {
						analysis: {
							state: "processing",
							version: reviewVersion(row),
							model: env.GEMINI_MODEL,
							promptVersion: REVIEW_PROMPT_VERSION,
							attempts: 1,
							leaseUntil: 0,
						},
					},
				})
				.where(eq(institutions.id, row.id));
			await scheduleReviewAnalysis(row.id, false, (task) => work.push(task));
			const task = work.at(-1);
			assert.ok(task);
			await task();
			assert.equal(requests, 1);
			assert.equal(
				(await current(row.id)).reviewMetadata?.analysis?.attempts,
				2,
			);
		} finally {
			globalThis.fetch = originalFetch;
		}
	},
);

localTest(
	"Postgres: analysis recovery preserves evidence until context or image bytes change",
	async () => {
		const sharp = (await import("sharp")).default;
		const bytes = await sharp({
			create: { width: 16, height: 16, channels: 3, background: "white" },
		})
			.png()
			.toBuffer();
		const { assessmentKey } = await import("./gemini-assessment");
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async (url) => {
			assert.ok(String(url).startsWith(env.R2_PUBLIC_URL));
			return new Response(bytes);
		};
		try {
			for (const state of ["queued", "processing"] as const) {
				const row = await seed();
				const evidence = {
					version: reviewVersion(row),
					recipientInstitution: true as const,
					physicalDisplay: true as const,
					imageHash: "unchanged",
				};
				await db
					.update(institutions)
					.set({
						reviewMetadata: {
							evidence,
							analysis: {
								state,
								version: reviewVersion(row),
								model: env.GEMINI_MODEL,
								promptVersion: REVIEW_PROMPT_VERSION,
								attempts: 1,
								key: assessmentKey(bytes, row, env.GEMINI_MODEL),
								leaseUntil: 0,
							},
						},
					})
					.where(eq(institutions.id, row.id));
				const before = await current(row.id);
				await scheduleReviewAnalysis(row.id, false, () => {});
				const after = await current(row.id);
				assert.deepEqual(after.reviewMetadata?.evidence, evidence);
				assert.equal(operationVersion(after), operationVersion(before));
				assert.equal(after.reviewMetadata?.analysis?.attempts, 1);
			}
			for (const change of ["location", "model", "prompt", "image"]) {
				const row = await seed();
				const analysis = {
					state: "complete" as const,
					version: reviewVersion(row),
					model: change === "model" ? "old-model" : env.GEMINI_MODEL,
					promptVersion:
						change === "prompt" ? "old-prompt" : REVIEW_PROMPT_VERSION,
					attempts: 1,
					key: assessmentKey(
						change === "image" ? Buffer.from("old image") : bytes,
						row,
						env.GEMINI_MODEL,
					),
				};
				await db
					.update(institutions)
					.set({
						...(change === "location" ? { city: "Shah Alam" } : {}),
						reviewMetadata: {
							evidence: {
								version: reviewVersion(row),
								recipientInstitution: true,
								physicalDisplay: true,
							},
							analysis,
						},
					})
					.where(eq(institutions.id, row.id));
				await scheduleReviewAnalysis(row.id, false, () => {});
				assert.equal(
					(await current(row.id)).reviewMetadata?.evidence,
					undefined,
				);
			}
		} finally {
			globalThis.fetch = originalFetch;
		}
	},
);

localTest(
	"Postgres: late analysis binds to one card and cannot revive a reviewed or stale card",
	async () => {
		const row = await seed();
		const originalFetch = globalThis.fetch;
		let edits = 0;
		globalThis.fetch = Object.assign(
			async (url: unknown, init?: RequestInit) => {
				assert.match(String(url), /api.telegram.org.*editMessageCaption$/);
				const body = JSON.parse(String(init?.body));
				assert.equal(body.message_id, 99);
				assert.ok(body.reply_markup.inline_keyboard.length);
				edits++;
				return Response.json({ ok: true, result: true });
			},
			{},
		);
		try {
			await db
				.update(institutions)
				.set({
					reviewMetadata: {
						analysis: {
							state: "unavailable",
							version: reviewVersion(row),
							model: "test",
							attempts: 1,
						},
					},
				})
				.where(eq(institutions.id, row.id));
			const client = createTelegramBotClient("local-test");
			const config = { chatId: "123", adminBaseUrl: null };
			// Analysis finished before the initial message reference was persisted.
			await syncReviewCard(client, config, row.id, {
				chatId: "123",
				messageId: 99,
				kind: "photo",
				scope: "community",
				version: reviewVersion(row),
				digest: "",
			});
			assert.equal(edits, 1);
			assert.equal(
				(await current(row.id)).reviewMetadata?.telegramCard?.messageId,
				99,
			);
			await syncReviewCard(client, config, row.id);
			assert.equal(edits, 1); // repeated completion does not repeat Telegram edits
			await db
				.update(institutions)
				.set({ status: "approved" })
				.where(eq(institutions.id, row.id));
			await syncReviewCard(client, config, row.id);
			assert.equal(edits, 1);
			await db
				.update(institutions)
				.set({ status: "pending", address: "Changed" })
				.where(eq(institutions.id, row.id));
			await syncReviewCard(client, config, row.id);
			assert.equal(edits, 1);
		} finally {
			globalThis.fetch = originalFetch;
		}
	},
);
