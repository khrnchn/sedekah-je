import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { reviewVersion } from "@/lib/features/institution-review/telegram-evidence";
import {
	buildCustomReasonConfirmation,
	buildCustomReasonPrompt,
	buildRejectionMenu,
	buildReviewCard,
	buildReviewedCardStatus,
	buildReviewTools,
	decodeReviewCallback,
	encodeReviewCallback,
	extractCustomReason,
	getReviewBlockers,
	parseCustomReasonPrompt,
	type TelegramReviewCandidate,
} from "@/lib/integrations/telegram/review-ui";

const candidate: TelegramReviewCandidate = {
	id: 42,
	name: "Masjid <Amanah> & Rakan",
	category: "masjid",
	state: "Selangor",
	city: "Petaling Jaya",
	address: "Jalan SS 2",
	qrImage: "https://images.example.test/qr.jpg",
	qrContent: "00020101021126&merchant",
	supportedPayment: ["duitnow"],
	coords: [3.1, 101.6],
	contributorName: "Community Contributor",
	partnerName: null,
	sourceUrl: null,
	createdAt: new Date("2026-08-21T05:19:10.650Z"),
	duplicateInstitutionId: null,
	position: 1,
	total: 3,
};

describe("Telegram institution review UI", () => {
	test("round-trips compact callback actions", () => {
		const encoded = encodeReviewCallback({
			action: "reject-template-confirm",
			scope: "community",
			institutionId: 42,
			template: "unclear",
		});

		assert.ok(encoded.length <= 64);
		assert.deepEqual(decodeReviewCallback(encoded), {
			action: "reject-template-confirm",
			scope: "community",
			institutionId: 42,
			template: "unclear",
		});
		assert.equal(decodeReviewCallback("malformed"), null);
	});

	test("escapes institution data and exposes a guarded approval action", () => {
		const card = buildReviewCard(candidate, "community", {
			adminBaseUrl: "https://sedekah.example",
		});

		assert.ok(card.caption.includes("Masjid &lt;Amanah&gt; &amp; Rakan"));
		assert.ok(card.caption.includes("00020101021126"));
		assert.ok(
			card.replyMarkup.inline_keyboard
				.flat()
				.some((button) => button.text === "✅ Approve"),
		);
		assert.equal(card.qrFollowUpText, null);
	});

	test("labels partner submissions with the partner name", () => {
		const card = buildReviewCard(
			{ ...candidate, contributorName: "Ali", partnerName: "Taubat" },
			"community",
			{ adminBaseUrl: null },
		);

		assert.ok(card.caption.includes("Partner: Taubat"));
	});

	test("blocks quick approval when required review evidence is missing", () => {
		const incomplete = {
			...candidate,
			qrContent: null,
			coords: null,
		};

		assert.deepEqual(getReviewBlockers(incomplete), [
			"QR content is missing",
			"coordinates are missing",
		]);

		const card = buildReviewCard(incomplete, "community", {
			adminBaseUrl: "https://sedekah.example",
		});
		assert.ok(
			card.replyMarkup.inline_keyboard
				.flat()
				.some((button) => button.text === "✅ Approve"),
		);
		assert.ok(card.caption.includes("QR payload missing"));
		assert.ok(
			buildReviewTools(incomplete, "community")
				.inline_keyboard.flat()
				.some((b) => b.text === "Retry/replace QR"),
		);
	});

	test("keeps an oversized payload intact in the follow-up", () => {
		const card = buildReviewCard(
			{ ...candidate, qrContent: "A".repeat(1_200) },
			"community",
			{ adminBaseUrl: null },
		);

		assert.ok(card.caption.length <= 1024);
		assert.ok(card.qrFollowUpText?.includes("A".repeat(1_200)));
	});

	test("offers template buttons and preserves a custom rejection reason", () => {
		const menu = buildRejectionMenu(42, "community");
		assert.deepEqual(
			menu.inline_keyboard.flat().map((button) => button.text),
			[
				"📷 Tidak jelas",
				"👤 Individu",
				"♻️ Duplicate",
				"✍️ Custom reason",
				"↩️ Cancel",
			],
		);

		const confirmation = buildCustomReasonConfirmation(
			42,
			"community",
			"QR belongs to <someone else>",
		);
		assert.ok(confirmation.text.includes("QR belongs to &lt;someone else&gt;"));
		assert.equal(
			extractCustomReason(confirmation.plainText, 42),
			"QR belongs to <someone else>",
		);
	});

	test("carries the original review message through the custom-reason reply", () => {
		const prompt = buildCustomReasonPrompt(42, "imports", 9001);
		assert.deepEqual(parseCustomReasonPrompt(prompt), {
			institutionId: 42,
			scope: "imports",
			reviewMessageId: 9001,
		});

		const confirmation = buildCustomReasonConfirmation(
			42,
			"imports",
			"Custom reason",
			9001,
		);
		const confirmCallback = confirmation.replyMarkup.inline_keyboard[0]?.[0];
		assert.ok(confirmCallback?.callback_data);
		assert.deepEqual(decodeReviewCallback(confirmCallback.callback_data), {
			action: "reject-custom-confirm",
			scope: "imports",
			institutionId: 42,
			reviewMessageId: 9001,
		});
		const editCallback = confirmation.replyMarkup.inline_keyboard[0]?.[1];
		assert.ok(editCallback?.callback_data);
		assert.deepEqual(decodeReviewCallback(editCallback.callback_data), {
			action: "reject-custom-edit",
			scope: "imports",
			institutionId: 42,
			reviewMessageId: 9001,
		});
	});

	test("builds a final, escaped review status for the original card", () => {
		assert.equal(
			buildReviewedCardStatus({
				institutionId: 42,
				decision: "approved",
				reviewerName: "Admin <One>",
			}),
			"✅ <b>APPROVED · #42</b>\nReviewed by Admin &lt;One&gt;",
		);
	});
});

test("combined assessment stays within photo caption limit and escapes image text", () => {
	const row = {
		...candidate,
		name: "A".repeat(200),
		address: "B".repeat(2000),
		city: "C".repeat(100),
	};
	const card = buildReviewCard(
		{
			...row,
			reviewMetadata: {
				analysis: {
					version: reviewVersion(row),
					state: "complete",
					model: "test",
					attempts: 1,
					result: {
						imageType: "physical_photo",
						visibleInstitution: "<img>".repeat(100),
						visibleLocation: "&location".repeat(50),
						recipientRelationship: "unclear",
						conflicts: ["<concern>".repeat(30)],
						explanation: "X".repeat(800),
					},
				},
			},
		},
		"community",
		{ adminBaseUrl: null },
	);
	const parsed = card.caption
		.replace(/<\/?b>/g, "")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
	assert.ok(parsed.length <= 1024);
	assert.ok(!card.caption.includes("<img>"));
	assert.ok(!card.caption.includes("Name shown:"));
	assert.equal(card.qrFollowUpText, null);
});

test("compact card restores the complete escaped payload and keeps six main actions", () => {
	const card = buildReviewCard(candidate, "community", {
		adminBaseUrl: "https://sedekah.example",
	});
	assert.ok(
		card.caption.includes(
			`<code>${candidate.qrContent?.replaceAll("&", "&amp;")}</code>`,
		),
	);
	assert.equal(card.qrFollowUpText, null);
	assert.ok(!card.caption.includes("Pin:"));
	assert.ok(!card.caption.includes("checksum"));
	assert.deepEqual(
		card.replyMarkup.inline_keyboard.map((row) => row.map((b) => b.text)),
		[
			["✅ Approve", "❌ Reject"],
			["⏭ Skip", "⏸ Hold"],
			["🔧 Review tools", "✏️ Web admin"],
		],
	);
});

test("oversized payload is preserved in full below the caption", () => {
	const payload = "<&>".repeat(1500);
	const card = buildReviewCard(
		{ ...candidate, qrContent: payload, coords: null },
		"community",
		{ adminBaseUrl: null },
	);
	assert.ok(card.caption.includes("QR payload is in the message below."));
	assert.ok(
		card.qrFollowUpText?.includes(
			payload
				.replaceAll("&", "&amp;")
				.replaceAll("<", "&lt;")
				.replaceAll(">", "&gt;"),
		),
	);
	assert.match(card.caption, /coordinates missing/);
});

test("unavailable AI explains the provider error on the card", () => {
	const row = {
		...candidate,
		reviewMetadata: {
			analysis: {
				version: reviewVersion(candidate),
				model: "test",
				state: "unavailable" as const,
				attempts: 3,
				error: "http_503",
			},
		},
	};
	const card = buildReviewCard(row, "community", { adminBaseUrl: null });
	assert.match(card.caption, /AI: Provider unavailable \(503\)/);
});

test("AI updates keep a boundary-length payload in the same place", () => {
	for (const length of [300, 450, 600, 750]) {
		const row = { ...candidate, qrContent: "x".repeat(length) };
		const before = buildReviewCard(row, "community", { adminBaseUrl: null });
		const after = buildReviewCard(
			{
				...row,
				reviewMetadata: {
					analysis: {
						version: reviewVersion(row),
						model: "test",
						state: "unavailable",
						attempts: 3,
						error: "http_503",
					},
				},
			},
			"community",
			{ adminBaseUrl: null },
		);
		assert.equal(!!after.qrFollowUpText, !!before.qrFollowUpText);
		for (const card of [before, after]) {
			const plain = card.caption
				.replace(/<\/?(?:b|code)>/g, "")
				.replaceAll("&lt;", "<")
				.replaceAll("&gt;", ">")
				.replaceAll("&amp;", "&");
			assert.ok(plain.length <= 1024);
		}
	}
});
