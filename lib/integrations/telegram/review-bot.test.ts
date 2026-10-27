import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import type { Institution } from "@/db/institutions";
import {
	getRejectionReasonBucket,
	REJECTION_TEMPLATES,
} from "@/lib/admin-templates";
import { reviewVersion } from "@/lib/features/institution-review/telegram-evidence";
import { makeRecord } from "./__fixtures__/review-records";
import type { TelegramBotClient, TelegramMessage } from "./bot-api";
import {
	handleMenuMessage,
	handleReviewCallback,
	type ReviewBotDependencies,
	resumeReview,
	sendNextCandidate,
} from "./review-bot";
import {
	parseEvidence,
	parseLocationEdit,
	type ReviewToolServices,
} from "./review-tools";
import { encodeReviewCallback, type ReviewCallback } from "./review-ui";

const config = {
	chatId: "123",
	reviewerUserId: "test-admin",
	reviewerName: "Admin",
	adminBaseUrl: null,
};
function harness(updates: Partial<Institution> = {}) {
	let record = makeRecord(updates),
		nextMessage = 10;
	const calls: Array<{ method: string; input: unknown }> = [];
	const ops: Array<{
		id: string;
		chatId: string;
		institutionId: number;
		promptMessageId: number;
		version: string;
		kind: string;
		payload: Record<string, unknown>;
		expiresAt: Date;
		consumedAt: Date | null;
	}> = [];
	const message: TelegramMessage = {
		message_id: 1,
		chat: { id: 123, type: "private" },
		from: { id: 123 },
	};
	const log = async (method: string, input: unknown) => {
		calls.push({ method, input });
		return { ...message, message_id: ++nextMessage };
	};
	const client: TelegramBotClient = {
		downloadPhoto: async () => Buffer.from("image"),
		getUpdates: async () => [],
		sendMessage: (input: unknown) => log("sendMessage", input),
		sendPhoto: (input: unknown) => log("sendPhoto", input),
		answerCallbackQuery: async (input: unknown) => {
			await log("answerCallbackQuery", input);
			return true;
		},
		editMessageReplyMarkup: (input: unknown) =>
			log("editMessageReplyMarkup", input),
		editMessageText: (input: unknown) => log("editMessageText", input),
		editMessageCaption: (input: unknown) => log("editMessageCaption", input),
	};
	const tools: ReviewToolServices = {
		getRecord: async () => record,
		createOperation: async (input) => {
			const id = (ops.length + 1).toString(16).padStart(32, "0");
			ops.push({
				...input,
				payload: input.payload ?? {},
				id,
				expiresAt: new Date(Date.now() + 900000),
				consumedAt: null,
			});
			return id;
		},
		getReplyOperation: async (chat, prompt) =>
			ops.find(
				(op) =>
					op.chatId === chat && op.promptMessageId === prompt && !op.consumedAt,
			),
		consumePrompt: async (binding) => {
			const op = ops.find((op) => op.id === binding.id && !op.consumedAt);
			if (!op) throw new Error("already used");
			op.consumedAt = new Date();
		},
		applyOperation: async () => record,
		duplicates: async () => [],
		geocode: async () => null,
		fetchImage: async () => Buffer.from("image"),
		recoverQr: async () => record.qrContent,
		upload: async () => "https://images.example.test/new.png",
		analyse: async () => {},
		review: async () => record,
		undo: async () => record,
	};
	const candidate = () => ({
		...record,
		contributorName: null,
		partnerName: null,
		duplicateInstitutionId: null,
		position: 1,
		total: 1,
	});
	const dependencies: ReviewBotDependencies = {
		syncCard: async (_client, _config, id, target) => {
			calls.push({ method: "syncCard", input: { id, target } });
		},
		tools,
		getCandidate: async () => candidate(),
		getNextCandidate: async () => candidate(),
		getQueueCounts: async () => ({
			all: 1,
			held: 0,
			community: 1,
			imports: 0,
			needsExtraction: 1,
			totalPending: 1,
		}),
		getSession: async () => ({
			scope: "community",
			cursorInstitutionId: record.id,
		}),
		saveSession: async (input) => {
			calls.push({ method: "saveSession", input });
		},
		searchCandidates: async () => [{ id: record.id, name: record.name }],
		undoReview: async () => record,
		reviewInstitution: async () => record,
	};
	async function action(action: ReviewCallback["action"]) {
		await handleReviewCallback(
			client,
			config,
			{
				id: "callback",
				from: { id: 123 },
				message,
				data: encodeReviewCallback({
					action,
					institutionId: record.id,
					scope: "community",
				}),
			},
			dependencies,
		);
	}
	async function confirm(index = ops.length - 1) {
		const op = ops[index];
		await handleReviewCallback(
			client,
			config,
			{
				id: "confirm",
				from: { id: 123 },
				message: { ...message, message_id: op.promptMessageId },
				data: `ro:${op.id}`,
			},
			dependencies,
		);
	}
	async function reply(
		text?: string,
		location?: TelegramMessage["location"],
		fromId = 123,
	) {
		const op = ops.at(-1);
		assert.ok(op);
		await handleMenuMessage(
			client,
			config,
			{
				...message,
				from: { id: fromId },
				text,
				location,
				reply_to_message: { ...message, message_id: op.promptMessageId },
			},
			dependencies,
		);
	}
	return {
		record,
		tools,
		client,
		message,
		calls,
		ops,
		dependencies,
		action,
		confirm,
		reply,
		text: () => JSON.stringify(calls),
	};
}
test("manual address and pin edits preview complete values and require confirmation", async () => {
	const h = harness();
	let saves = 0;
	h.tools.applyOperation = async () => {
		saves++;
		return h.record;
	};
	await h.action("location");
	await h.reply(undefined, { latitude: 3.2, longitude: 101.7 });
	assert.equal(saves, 0);
	assert.equal(h.ops.at(-1)?.kind, "location");
	assert.deepEqual(h.ops.at(-1)?.payload, { coords: [3.2, 101.7] });
	assert.match(h.text(), /Jalan Amanah/);
	assert.match(h.text(), /does not geocode/);
	await h.confirm();
	assert.equal(saves, 1);
});
test("Find address proposes contextual lookup and flags Al-Istiqlal location conflict", async () => {
	const h = harness({ name: "Masjid Al-Istiqlal", city: "Petaling Jaya" });
	let query = "";
	h.tools.geocode = async (name) => {
		query = name;
		return {
			address: "Different location",
			coords: [3.5, 101.9],
			city: "Shah Alam",
			state: "Selangor",
			needsManualReview: true,
			provider: "nominatim",
		};
	};
	await h.action("find-address");
	assert.match(query, /Masjid Al-Istiqlal, Petaling Jaya, Selangor/);
	assert.equal(h.record.address, "Jalan Amanah");
	assert.match(h.text(), /possible location conflict/);
	assert.equal(h.ops.at(-1)?.kind, "location");
	assert.match(h.text(), /Nominatim/);
	assert.equal(h.text().includes("Google name"), false);
});
test("stale and unauthorised replies cannot create edits", async () => {
	const h = harness();
	await h.action("location");
	await h.reply("unauthorized", undefined, 999);
	assert.equal(h.ops.length, 1);
	h.record.city = "Changed";
	await h.reply("new address");
	assert.equal(h.ops.length, 1);
	assert.match(h.text(), /Record changed/);
});
test("missing QR payload opens from search and offers replacement", async () => {
	const h = harness({ qrContent: null });
	await handleMenuMessage(
		h.client,
		config,
		{ ...h.message, text: "/find 42" },
		h.dependencies,
	);
	assert.match(h.text(), /Retry\/replace QR/);
	assert.match(h.text(), /checksum missing/);
	await h.action("qr");
	assert.equal(h.ops[0].kind, "prompt-qr");
});
test("evidence confirmation and old approval callbacks cannot directly approve", async () => {
	const h = harness();
	let approved = 0;
	h.tools.review = async () => {
		approved++;
		return h.record;
	};
	await h.action("approve");
	assert.equal(approved, 0);
	assert.match(h.text(), /Approval needs attention/);
	await h.action("evidence");
	await h.reply("PHYSICAL");
	assert.equal(h.ops.at(-1)?.kind, "evidence");
	assert.match(h.text(), /not an individual/);
	await h.action("approve-confirm");
	assert.equal(approved, 0);
	assert.match(h.text(), /older confirmation expired/);
});
test("approval carries a durable operation binding and creates guarded undo", async () => {
	const h = harness();
	h.record.reviewMetadata = {
		evidence: {
			version: reviewVersion(h.record),
			recipientInstitution: true,
			imageHash: createHash("sha256")
				.update(Buffer.from("image"))
				.digest("hex"),
			physicalDisplay: true,
		},
	};
	let received: unknown;
	h.tools.review = async (input) => {
		received = input;
		return { ...h.record, status: "approved", reviewedAt: new Date() };
	};
	await h.action("approve");
	assert.equal(h.ops.at(-1)?.kind, "approve");
	const op = h.ops.at(-1);
	assert.ok(op);
	await h.confirm();
	assert.deepEqual(received, {
		institutionId: 42,
		reviewerId: "test-admin",
		decision: "approved",
		adminNotes: undefined,
		telegramOperation: {
			id: op.id,
			chatId: "123",
			promptMessageId: op.promptMessageId,
		},
	});
	assert.equal(h.ops.at(-1)?.kind, "undo");
});
test("UPM different-QR comparison offers explicit different-institution and duplicate rejection", async () => {
	const h = harness({ name: "Masjid UPM" });
	h.tools.duplicates = async () => [
		{
			...makeRecord({
				id: 706,
				name: "Masjid UPM",
				qrContent: "different payload",
				status: "approved",
			}),
			reason: "similar_name",
		},
	];
	await h.action("compare");
	assert.match(h.text(), /Reject duplicate of #706/);
	assert.match(h.text(), /Different institution/);
	assert.equal(h.ops.at(-1)?.kind, "different");
	assert.equal(h.record.qrContent?.startsWith("000202"), true);
});
test("held queue, resume, skip and search keep their navigation", async () => {
	const h = harness({ qrContent: null });
	await h.action("hold");
	assert.equal(h.ops.at(-1)?.kind, "hold");
	assert.equal(h.record.status, "pending");
	await handleMenuMessage(
		h.client,
		config,
		{ ...h.message, text: "⏸ Held submissions" },
		h.dependencies,
	);
	assert.match(h.text(), /rv:n:d:42/);
	await resumeReview(h.client, config, h.dependencies);
	await sendNextCandidate(
		h.client,
		config,
		"community",
		undefined,
		h.dependencies,
	);
	assert.ok(h.calls.some((c) => c.method === "saveSession"));
});
test("location/evidence parsing rejects unsupported state, arbitrary updates and unverified source forms", () => {
	assert.deepEqual(parseLocationEdit({ text: "New address" }), {
		address: "New address",
	});
	assert.throws(() => parseLocationEdit({ text: '{"state":"Unknown"}' }));
	assert.throws(() => parseLocationEdit({ text: '{"status":"approved"}' }));
	assert.throws(() =>
		parseLocationEdit({ location: { latitude: 91, longitude: 101 } }),
	);
	assert.throws(() =>
		parseEvidence("https://official.example.test", { category: "masjid" }),
	);
	assert.throws(() =>
		parseEvidence("http://official.example.test", { category: "tahfiz" }),
	);
	assert.deepEqual(
		parseEvidence("https://official.example.test/donate", {
			category: "tahfiz",
		}),
		{ officialSource: "https://official.example.test/donate" },
	);
});

test("replacement photo previews both recipients and preserves saved QR until confirmation", async () => {
	const h = harness();
	const sharp = (await import("sharp")).default;
	const bytes = await sharp({
		create: { width: 8, height: 8, channels: 3, background: "white" },
	})
		.png()
		.toBuffer();
	h.client.downloadPhoto = async () => bytes;
	h.tools.recoverQr = async () => makeRecord({ name: "Other" }).qrContent;
	await h.action("qr");
	const prompt = h.ops.find((op) => op.kind === "prompt-qr");
	assert.ok(prompt);
	await handleMenuMessage(
		h.client,
		config,
		{
			...h.message,
			photo: [{ file_id: "photo-id", file_size: bytes.length }],
			reply_to_message: { ...h.message, message_id: prompt.promptMessageId },
		},
		h.dependencies,
	);
	assert.equal(h.ops.at(-1)?.kind, "qr");
	assert.equal(h.record.qrImage, "https://images.example.test/qr.png");
	assert.match(h.text(), /Old recipient/);
	assert.match(h.text(), /New recipient/);
});

test("analysis retries require a single-use confirmation before scheduling", async () => {
	const h = harness();
	let analyses = 0;
	h.tools.analyse = async () => {
		analyses++;
	};
	h.tools.applyOperation = async (binding) => {
		const operation = h.ops.find(
			(op) => op.id === binding.id && !op.consumedAt,
		);
		assert.ok(operation);
		operation.consumedAt = new Date();
		return h.record;
	};
	await h.action("analysis");
	assert.equal(analyses, 0);
	assert.equal(h.ops.at(-1)?.kind, "analysis-request");
	await h.confirm();
	assert.equal(analyses, 1);
	assert.ok(h.calls.some((call) => call.method === "syncCard"));
	assert.ok(
		h.calls.some(
			(call) =>
				call.method === "editMessageText" &&
				JSON.stringify(call.input).includes(
					"Results will appear on the review card",
				),
		),
	);
	assert.ok(
		!h.calls.some(
			(call) =>
				call.method === "sendMessage" &&
				JSON.stringify(call.input).includes("Saved."),
		),
	);
	await h.confirm();
	assert.equal(analyses, 1);
});

test("long location previews preserve full data and bind confirmation to the final part", async () => {
	const h = harness({ address: "A".repeat(2000) });
	const sent: Array<{ id: number; text: string }> = [];
	h.client.sendMessage = async (input) => {
		assert.ok(input.text.length <= 4096);
		const id = 200 + sent.length;
		sent.push({ id, text: input.text });
		return { message_id: id, chat: { id: 123, type: "private" } };
	};
	await h.action("location");
	const first = h.ops.at(-1);
	assert.ok(first);
	await h.reply(undefined, { latitude: 3.2, longitude: 101.7 });
	const preview = h.ops.at(-1);
	assert.ok(preview);
	assert.equal(preview.kind, "location");
	assert.equal(preview.promptMessageId, sent.at(-1)?.id);
	assert.ok(first.consumedAt);
	assert.ok(sent.length >= 3);
	assert.ok(
		sent
			.slice(1)
			.map((part) => part.text)
			.join("")
			.includes("A".repeat(2000)),
	);
	let saves = 0;
	h.tools.applyOperation = async (binding) => {
		const op = h.ops.find((op) => op.id === binding.id && !op.consumedAt);
		assert.ok(op);
		op.consumedAt = new Date();
		saves++;
		return h.record;
	};
	await h.confirm();
	await h.confirm(1);
	assert.equal(saves, 1);
});

test("Telegram template rejections keep shared feedback and admin filter buckets", async () => {
	for (const [template, expectedBucket, index] of [
		["unclear", "unclear_qr", 0],
		["individual", "individual_qr", 1],
		["duplicate", "duplicate", 2],
	] as const) {
		const h = harness();
		await handleReviewCallback(
			h.client,
			config,
			{
				id: "template",
				from: { id: 123 },
				message: h.message,
				data: encodeReviewCallback({
					action: "reject-template-confirm",
					institutionId: h.record.id,
					scope: "community",
					template,
				}),
			},
			h.dependencies,
		);
		const op = h.ops.at(-1);
		assert.ok(op);
		assert.equal(op.payload.notes, REJECTION_TEMPLATES[index].value);
		let notes: string | undefined;
		h.tools.review = async (input) => {
			notes = input.adminNotes;
			return { ...h.record, status: "rejected" };
		};
		await h.confirm();
		assert.equal(getRejectionReasonBucket(notes ?? null), expectedBucket);
	}
});

test("photo details are sent only on request and reject stale assessments", async () => {
	const base = makeRecord();
	const h = harness({
		reviewMetadata: {
			analysis: {
				version: reviewVersion(base),
				state: "complete",
				model: "test",
				attempts: 1,
				result: {
					imageType: "physical_photo",
					visibleInstitution: "Masjid Amanah",
					visibleLocation: "Jalan Amanah",
					recipientRelationship: "institution",
					conflicts: ["Check the address"],
					explanation: "A physical sign.",
				},
			},
		},
	});
	await h.action("analysis-details");
	assert.match(h.text(), /Check the address/);
	assert.equal(h.ops.length, 0);
	h.record.address = "Changed";
	await h.action("analysis-details");
	assert.match(h.text(), /No current photo assessment/);
});

test("retry from a tracked current card keeps the same photo; legacy cards reopen the current image", async () => {
	const row = makeRecord();
	const h = harness({
		reviewMetadata: {
			telegramCard: {
				chatId: config.chatId,
				messageId: 1,
				kind: "photo",
				scope: "community",
				version: reviewVersion(row),
				digest: "already-shown",
			},
		},
	});
	await h.action("analysis");
	assert.equal(h.calls.filter((call) => call.method === "sendPhoto").length, 0);
	assert.ok(h.calls.some((call) => call.method === "syncCard"));
	const legacy = harness();
	await legacy.action("analysis");
	assert.equal(
		legacy.calls.filter((call) => call.method === "sendPhoto").length,
		1,
	);
});
