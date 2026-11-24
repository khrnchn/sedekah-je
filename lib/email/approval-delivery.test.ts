import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { after as afterAll, test } from "node:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
	approvalEmailEvents,
	approvalEmails,
	institutions,
	users,
} from "@/db/schema";
import { env } from "@/env";
import {
	queueApprovalEmails,
	recordApprovalEmailEvent,
	sendTrackedApprovalEmail,
} from "./approval-delivery";
import type { ApprovalSendResult } from "./approval-result";
import { MAILERSEND_TEST_SECRET } from "./approval-webhook";

const enabled = process.env.APPROVAL_EMAIL_LOCAL_TESTS === "true";
if (
	enabled &&
	!["localhost", "127.0.0.1"].includes(new URL(env.DATABASE_URL).hostname)
)
	throw new Error("Email tests require a disposable loopback database");
const localTest = enabled ? test : test.skip;
const ids: number[] = [];
const actor = `email-test-${randomUUID()}`;
async function seed(
	status: "approved" | "pending" = "approved",
	contributor = true,
) {
	await db
		.insert(users)
		.values({
			id: actor,
			name: "Email Test Admin",
			email: `${actor}@example.test`,
			role: "admin",
			isActive: true,
		})
		.onConflictDoNothing();
	const [row] = await db
		.insert(institutions)
		.values({
			name: "Test Mosque",
			slug: randomUUID(),
			city: "Test City",
			state: "Selangor",
			category: "masjid",
			status,
			contributorId: contributor ? actor : null,
		})
		.returning();
	ids.push(row.id);
	await db.transaction((tx) => queueApprovalEmails(tx, [row.id]));
	return row.id;
}
async function current(id: number) {
	const [row] = await db
		.select()
		.from(approvalEmails)
		.where(eq(approvalEmails.institutionId, id));
	return row;
}
const rejected = async (): Promise<ApprovalSendResult> => ({
	ok: false,
	certainty: "rejected",
	error: "Sandbox limit MS42225",
});

localTest(
	"only one concurrent caller sends; accepted emails cannot be retried",
	async () => {
		const id = await seed();
		let sends = 0;
		const send = async (): Promise<ApprovalSendResult> => {
			sends++;
			await new Promise((resolve) => setTimeout(resolve, 40));
			return { ok: true, messageId: randomUUID() };
		};
		const results = await Promise.allSettled([
			sendTrackedApprovalEmail(id, send),
			sendTrackedApprovalEmail(id, send),
		]);
		assert.equal(sends, 1);
		assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
		assert.equal((await current(id)).status, "accepted");
		await assert.rejects(sendTrackedApprovalEmail(id, send));
		assert.equal(sends, 1);
	},
);
localTest(
	"known provider failure is persisted and can be retried once",
	async () => {
		const id = await seed();
		await sendTrackedApprovalEmail(id, rejected);
		assertFields(await current(id), {
			status: "failed",
			attemptCount: 1,
			lastError: "Sandbox limit MS42225",
		});
		await sendTrackedApprovalEmail(id, async () => ({
			ok: true,
			messageId: randomUUID(),
		}));
		assertFields(await current(id), {
			status: "accepted",
			attemptCount: 2,
			lastError: null,
		});
	},
);
localTest(
	"uncertain outcomes block retries and legacy approvals are not sent",
	async () => {
		const id = await seed();
		await sendTrackedApprovalEmail(id, async () => ({
			ok: false,
			certainty: "unknown",
			error: "Timeout",
		}));
		assert.equal((await current(id)).status, "unknown");
		await assert.rejects(sendTrackedApprovalEmail(id, rejected));
		await db.delete(approvalEmails).where(eq(approvalEmails.institutionId, id));
		await assert.rejects(sendTrackedApprovalEmail(id, rejected));
	},
);
localTest(
	"missing configuration and missing contributors are visible failures",
	async () => {
		if (env.MAILERSEND_API_KEY || env.MAILERSEND_APPROVAL_TEMPLATE_ID)
			throw new Error("Clear MailerSend configuration in disposable tests");
		const id = await seed();
		await sendTrackedApprovalEmail(id);
		assertFields(await current(id), { status: "failed" });
		assert.ok((await current(id)).lastError?.includes("not configured"));
		const absent = await seed("approved", false);
		await sendTrackedApprovalEmail(absent);
		assert.ok(
			(await current(absent)).lastError?.includes("No contributor email"),
		);
	},
);
localTest("emails for undone approvals cannot send", async () => {
	const id = await seed("pending");
	await assert.rejects(sendTrackedApprovalEmail(id, rejected), /not approved/);
	assert.equal((await current(id)).attemptCount, 0);
});
localTest(
	"early callbacks survive send response and reordered duplicate callbacks",
	async () => {
		const id = await seed();
		const messageId = randomUUID();
		const delivered = {
			messageId,
			status: "delivered",
			occurredAt: new Date("2026-11-24T01:00:00Z"),
		} as const;
		await sendTrackedApprovalEmail(id, async () => {
			await recordApprovalEmailEvent(delivered);
			return { ok: true, messageId };
		});
		assert.equal((await current(id)).status, "delivered");
		await recordApprovalEmailEvent({
			messageId,
			status: "bounced",
			occurredAt: new Date("2026-11-24T02:00:00Z"),
		});
		await recordApprovalEmailEvent(delivered);
		assert.equal((await current(id)).status, "bounced");
		await recordApprovalEmailEvent({
			...delivered,
			occurredAt: new Date("2026-11-24T03:00:00Z"),
		});
		await recordApprovalEmailEvent({
			...delivered,
			occurredAt: new Date("2026-11-24T03:00:00Z"),
		});
		assert.equal((await current(id)).status, "delivered");
		await db
			.delete(approvalEmailEvents)
			.where(eq(approvalEmailEvents.messageId, messageId));
	},
);
localTest(
	"queued emails roll back with an unsuccessful approval transaction",
	async () => {
		const id = await seed();
		await db.delete(approvalEmails).where(eq(approvalEmails.institutionId, id));
		await assert.rejects(
			db.transaction(async (tx) => {
				await queueApprovalEmails(tx, [id]);
				throw new Error("rollback");
			}),
			/rollback/,
		);
		assert.equal(await current(id), undefined);
	},
);
localTest(
	"webhook route rejects forged delivery and accepts a real signed callback",
	async () => {
		const { POST } = await import(
			"@/app/api/integrations/mailersend/webhook/route"
		);
		const id = await seed();
		const messageId = randomUUID();
		await sendTrackedApprovalEmail(id, async () => ({ ok: true, messageId }));
		const body = JSON.stringify({
			type: "activity.delivered",
			created_at: "2026-11-24T03:00:00Z",
			data: { message_id: messageId },
		});
		const request = (secret: string) =>
			new Request("http://localhost/api/integrations/mailersend/webhook", {
				method: "POST",
				body,
				headers: {
					signature: createHmac("sha256", secret).update(body).digest("hex"),
				},
			});
		assert.equal((await POST(request(MAILERSEND_TEST_SECRET))).status, 401);
		assert.equal((await current(id)).status, "accepted");
		if (!env.MAILERSEND_WEBHOOK_SECRET)
			throw new Error("Set a disposable webhook secret for integration tests");
		assert.equal(
			(await POST(request(env.MAILERSEND_WEBHOOK_SECRET))).status,
			204,
		);
		assert.equal((await current(id)).status, "delivered");
		await db
			.delete(approvalEmailEvents)
			.where(eq(approvalEmailEvents.messageId, messageId));
	},
);
localTest(
	"single and bulk approval paths create durable email records",
	async () => {
		const { reviewPendingInstitution, reviewPendingInstitutions } =
			await import("@/lib/features/institution-review/review");
		const first = await seed("pending");
		const second = await seed("pending");
		for (const id of [first, second])
			await db
				.delete(approvalEmails)
				.where(eq(approvalEmails.institutionId, id));
		await reviewPendingInstitution({
			institutionId: first,
			reviewerId: actor,
			decision: "approved",
		});
		await reviewPendingInstitutions({
			institutionIds: [second],
			reviewerId: actor,
			decision: "approved",
		});
		for (const id of [first, second]) {
			for (
				let count = 0;
				count < 50 && (await current(id))?.status !== "failed";
				count++
			)
				await new Promise((resolve) => setTimeout(resolve, 10));
			assert.equal((await current(id)).status, "failed");
			assert.equal((await current(id)).attemptCount, 1);
		}
	},
);
afterAll(async () => {
	if (!enabled) return;
	for (const id of ids)
		await db.delete(institutions).where(eq(institutions.id, id));
	await db.delete(users).where(eq(users.id, actor));
});

function assertFields(actual: object, expected: object) {
	for (const [key, value] of Object.entries(expected))
		assert.deepEqual(Reflect.get(actual, key), value);
}
