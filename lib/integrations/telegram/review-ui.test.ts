import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	buildCustomReasonConfirmation,
	buildCustomReasonPrompt,
	buildRejectionMenu,
	buildReviewCard,
	decodeReviewCallback,
	encodeReviewCallback,
	extractCustomReason,
	getReviewBlockers,
	parseCustomReasonPrompt,
	type TelegramReviewCandidate,
} from "./review-ui";

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
		assert.ok(
			card.caption.includes("<code>00020101021126&amp;merchant</code>"),
		);
		assert.ok(
			card.replyMarkup.inline_keyboard
				.flat()
				.some((button) => button.text === "✅ Approve"),
		);
		assert.equal(card.qrFollowUpText, null);
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
			!card.replyMarkup.inline_keyboard
				.flat()
				.some((button) => button.text === "✅ Approve"),
		);
		assert.ok(card.caption.includes("Needs web review"));
	});

	test("keeps oversized QR content copyable in a follow-up message", () => {
		const card = buildReviewCard(
			{ ...candidate, qrContent: "A".repeat(1_200) },
			"community",
			{ adminBaseUrl: null },
		);

		assert.ok(card.caption.length <= 1024);
		assert.ok(
			card.qrFollowUpText?.includes(`<code>${"A".repeat(1_200)}</code>`),
		);
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
	});
});
