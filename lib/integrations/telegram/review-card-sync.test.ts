import assert from "node:assert/strict";
import { test } from "node:test";
import { reviewVersion } from "@/lib/features/institution-review/telegram-evidence";
import { makeRecord } from "./__fixtures__/review-records";
import { editBoundReviewCard } from "./review-card-sync";
import type { TelegramReviewCandidate } from "./review-ui";

function fixture() {
	const record = makeRecord();
	const candidate: TelegramReviewCandidate = {
		...record,
		contributorName: null,
		partnerName: null,
		duplicateInstitutionId: null,
		position: 1,
		total: 1,
		reviewMetadata: {
			analysis: {
				version: reviewVersion(record),
				model: "test",
				attempts: 1,
				state: "complete",
				result: {
					imageType: "physical_photo",
					visibleInstitution: "Masjid Amanah",
					visibleLocation: "Jalan Amanah",
					recipientRelationship: "institution",
					conflicts: [],
					explanation: "A sign beside the QR.",
				},
			},
		},
	};
	const target = {
		chatId: "123",
		messageId: 8,
		kind: "photo" as const,
		scope: "community" as const,
		version: reviewVersion(record),
		digest: "",
	};
	return { candidate, target };
}

test("completed and unavailable analyses edit the original photo with review buttons; repeated refreshes do nothing", async () => {
	const { candidate, target } = fixture();
	const edits: string[] = [];
	const client = {
		editMessageCaption: async (input: {
			messageId: number;
			caption: string;
			replyMarkup?: unknown;
		}) => {
			assert.equal(input.messageId, 8);
			assert.ok(input.replyMarkup);
			edits.push(input.caption);
			return true as const;
		},
		editMessageText: async () => {
			throw Error("Should edit the photo");
		},
	};
	const config = { chatId: "123", adminBaseUrl: null };
	const updated = await editBoundReviewCard(client, config, candidate, target);
	assert.match(edits[0], /Name shown: Masjid Amanah/);
	assert.match(edits[0], /Location shown: Jalan Amanah/);
	await editBoundReviewCard(client, config, candidate, updated);
	assert.equal(edits.length, 1);
	const analysis = candidate.reviewMetadata?.analysis;
	assert.ok(analysis);
	analysis.state = "unavailable";
	await editBoundReviewCard(client, config, candidate, updated);
	assert.match(edits[1], /Unavailable. Review manually or retry/);
});

test("text fallback edits text; stale record and wrong chat cannot edit a card", async () => {
	const { candidate, target } = fixture();
	let edits = 0;
	const client = {
		editMessageCaption: async () => {
			throw Error("Should edit text");
		},
		editMessageText: async () => {
			edits++;
			return true as const;
		},
	};
	await editBoundReviewCard(
		client,
		{ chatId: "999", adminBaseUrl: null },
		candidate,
		target,
	);
	await editBoundReviewCard(
		client,
		{ chatId: "123", adminBaseUrl: null },
		{ ...candidate, address: "Changed" },
		target,
	);
	assert.equal(edits, 0);
	await editBoundReviewCard(
		client,
		{ chatId: "123", adminBaseUrl: null },
		candidate,
		{ ...target, kind: "text" },
	);
	assert.equal(edits, 1);
});
