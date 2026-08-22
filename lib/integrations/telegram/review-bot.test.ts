import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type {
	TelegramBotClient,
	TelegramCallbackQuery,
	TelegramMessage,
} from "@/lib/integrations/telegram/bot-api";
import {
	handleMenuMessage,
	handleReviewCallback,
	type ReviewBotConfig,
	type ReviewBotDependencies,
	resumeReview,
	sendNextCandidate,
} from "@/lib/integrations/telegram/review-bot";
import {
	encodeReviewCallback,
	type TelegramReviewCandidate,
} from "@/lib/integrations/telegram/review-ui";

const candidate: TelegramReviewCandidate = {
	id: 42,
	name: "Masjid Amanah",
	category: "masjid",
	state: "Selangor",
	city: "Petaling Jaya",
	address: "Jalan Amanah",
	qrImage: "https://images.example.test/qr.jpg",
	qrContent: "00020101021126merchant",
	supportedPayment: ["duitnow"],
	coords: [3.1, 101.6],
	contributorName: "Contributor",
	sourceUrl: null,
	createdAt: new Date("2026-08-21T05:19:10.650Z"),
	duplicateInstitutionId: null,
	position: 1,
	total: 1,
};

const config: ReviewBotConfig = {
	chatId: "123",
	reviewerUserId: "admin-1",
	reviewerName: "Review Admin",
	adminBaseUrl: null,
};

function createHarness() {
	const calls: Array<{ method: string; input: unknown }> = [];
	const message: TelegramMessage = {
		message_id: 500,
		chat: { id: 123, type: "private" },
	};
	const client = {
		getUpdates: async () => [],
		sendMessage: async (input: unknown) => {
			calls.push({ method: "sendMessage", input });
			return message;
		},
		sendPhoto: async (input: unknown) => {
			calls.push({ method: "sendPhoto", input });
			return message;
		},
		answerCallbackQuery: async (input: unknown) => {
			calls.push({ method: "answerCallbackQuery", input });
			return true;
		},
		editMessageReplyMarkup: async (input: unknown) => {
			calls.push({ method: "editMessageReplyMarkup", input });
			return true;
		},
		editMessageText: async (input: unknown) => {
			calls.push({ method: "editMessageText", input });
			return true;
		},
		editMessageCaption: async (input: unknown) => {
			calls.push({ method: "editMessageCaption", input });
			return true;
		},
	} as TelegramBotClient;
	return { calls, client, message };
}

function createDependencies(
	overrides: Partial<ReviewBotDependencies> = {},
): ReviewBotDependencies {
	return {
		getCandidate: async () => candidate,
		getNextCandidate: async () => null,
		getQueueCounts: async () => ({
			all: 1,
			community: 1,
			imports: 0,
			needsExtraction: 0,
			totalPending: 1,
		}),
		getSession: async () => null,
		saveSession: async () => {},
		geocodeByName: async () => null,
		updateLocation: async () => {},
		searchCandidates: async () => [],
		undoReview: async () => null,
		reviewInstitution: async () => candidate,
		...overrides,
	};
}

function callback(
	action: Parameters<typeof encodeReviewCallback>[0],
	message: TelegramMessage,
): TelegramCallbackQuery {
	return {
		id: "callback-1",
		from: { id: 123 },
		data: encodeReviewCallback(action),
		message,
	};
}

describe("Telegram review orchestration", () => {
	test("confirms approval, marks the original card, and advances", async () => {
		const { calls, client, message } = createHarness();
		message.photo = [{}];
		const reviews: unknown[] = [];
		await handleReviewCallback(
			client,
			config,
			callback(
				{ action: "approve-confirm", scope: "community", institutionId: 42 },
				message,
			),
			createDependencies({
				reviewInstitution: async (input) => {
					reviews.push(input);
					return candidate;
				},
			}),
		);

		assert.deepEqual(reviews, [
			{
				institutionId: 42,
				reviewerId: "admin-1",
				decision: "approved",
				adminNotes: undefined,
			},
		]);
		assert.ok(calls.some((call) => call.method === "editMessageCaption"));
		assert.ok(
			calls.some(
				(call) =>
					call.method === "answerCallbackQuery" &&
					JSON.stringify(call.input).includes("Approved"),
			),
		);
	});

	test("passes template and custom rejection reasons to the review service", async () => {
		for (const scenario of [
			{
				action: {
					action: "reject-template-confirm" as const,
					scope: "community" as const,
					institutionId: 42,
					template: "duplicate" as const,
				},
				messageText: undefined,
			},
			{
				action: {
					action: "reject-custom-confirm" as const,
					scope: "community" as const,
					institutionId: 42,
					reviewMessageId: 400,
				},
				messageText: "Custom rejection reason for #42:\n\nIncorrect account",
			},
		]) {
			const { client, message } = createHarness();
			message.text = scenario.messageText;
			const reviews: Array<{ adminNotes?: string }> = [];
			await handleReviewCallback(
				client,
				config,
				callback(scenario.action, message),
				createDependencies({
					reviewInstitution: async (input) => {
						reviews.push(input);
						return candidate;
					},
				}),
			);
			assert.equal(reviews.length, 1);
			assert.ok(reviews[0]?.adminNotes);
		}
	});

	test("treats an already-reviewed callback as stale and does not advance", async () => {
		const { calls, client, message } = createHarness();
		await handleReviewCallback(
			client,
			config,
			callback(
				{ action: "approve-confirm", scope: "community", institutionId: 42 },
				message,
			),
			createDependencies({
				reviewInstitution: async () => {
					throw new Error("Institution not found or not pending");
				},
			}),
		);

		assert.ok(
			calls.some((call) =>
				JSON.stringify(call.input).includes("already been reviewed"),
			),
		);
		assert.ok(
			!calls.some((call) =>
				JSON.stringify(call.input).includes("No more pending"),
			),
		);
	});

	test("persists the queue cursor and resumes its pending card", async () => {
		const first = createHarness();
		const saved: unknown[] = [];
		await sendNextCandidate(
			first.client,
			config,
			"community",
			undefined,
			createDependencies({
				getNextCandidate: async () => candidate,
				saveSession: async (input) => {
					saved.push(input);
				},
			}),
		);
		assert.deepEqual(saved, [
			{
				telegramChatId: "123",
				scope: "community",
				cursorInstitutionId: 42,
			},
		]);

		const resumed = createHarness();
		await resumeReview(
			resumed.client,
			config,
			createDependencies({
				getSession: async () => ({
					scope: "community",
					cursorInstitutionId: 42,
				}),
			}),
		);
		assert.ok(resumed.calls.some((call) => call.method === "sendPhoto"));
	});

	test("resume skips a saved cursor that is no longer Telegram-reviewable", async () => {
		const resumed = createHarness();
		const nextCalls: unknown[] = [];
		await resumeReview(
			resumed.client,
			config,
			createDependencies({
				getSession: async () => ({
					scope: "community",
					cursorInstitutionId: 41,
				}),
				getCandidate: async () => null,
				getNextCandidate: async (scope, afterInstitutionId) => {
					nextCalls.push({ scope, afterInstitutionId });
					return candidate;
				},
			}),
		);

		assert.deepEqual(nextCalls, [
			{ scope: "community", afterInstitutionId: 41 },
		]);
		assert.ok(resumed.calls.some((call) => call.method === "sendPhoto"));
	});

	test("fills a missing address and coords from a name-only geocode lookup", async () => {
		const { calls, client, message } = createHarness();
		message.photo = [{}];
		const withoutAddress = { ...candidate, address: null, coords: null };
		const updates: unknown[] = [];
		await handleReviewCallback(
			client,
			config,
			callback(
				{ action: "find-address", scope: "community", institutionId: 42 },
				message,
			),
			createDependencies({
				getCandidate: async () => withoutAddress,
				geocodeByName: async () => ({
					coords: [3.2, 101.7],
					city: "Shah Alam",
					state: "Selangor",
					address: "Jalan Contoh 1",
					needsManualReview: false,
				}),
				updateLocation: async (institutionId, input) => {
					updates.push({ institutionId, input });
				},
			}),
		);

		assert.deepEqual(updates, [
			{
				institutionId: 42,
				input: { address: "Jalan Contoh 1", coords: [3.2, 101.7] },
			},
		]);
		assert.ok(calls.some((call) => call.method === "editMessageCaption"));
	});

	test("does not overwrite an existing address when finding a location", async () => {
		const { client, message } = createHarness();
		const updates: unknown[] = [];
		await handleReviewCallback(
			client,
			config,
			callback(
				{ action: "find-address", scope: "community", institutionId: 42 },
				message,
			),
			createDependencies({
				geocodeByName: async () => ({
					coords: [1, 1],
					city: "Somewhere",
					state: "Selangor",
					address: "Should not be used",
					needsManualReview: false,
				}),
				updateLocation: async (institutionId, input) => {
					updates.push({ institutionId, input });
				},
			}),
		);

		assert.deepEqual(updates, [{ institutionId: 42, input: {} }]);
	});

	test("shows a low-confidence warning when the geocode result needs manual review", async () => {
		const { calls, client, message } = createHarness();
		const withoutAddress = { ...candidate, address: null, coords: null };
		await handleReviewCallback(
			client,
			config,
			callback(
				{ action: "find-address", scope: "community", institutionId: 42 },
				message,
			),
			createDependencies({
				getCandidate: async () => withoutAddress,
				geocodeByName: async () => ({
					coords: [1.1, 1.1],
					city: "Unknown",
					state: "Selangor",
					address: "Malaysia",
					needsManualReview: true,
				}),
				updateLocation: async () => {},
			}),
		);

		assert.ok(
			calls.some(
				(call) =>
					call.method === "editMessageText" &&
					JSON.stringify(call.input).includes("please verify"),
			),
		);
		assert.ok(
			calls.some(
				(call) =>
					call.method === "answerCallbackQuery" &&
					JSON.stringify(call.input).includes("low confidence"),
			),
		);
	});

	test("undoes an approval and reverts the institution to pending", async () => {
		const { calls, client, message } = createHarness();
		const undoCalls: unknown[] = [];
		await handleReviewCallback(
			client,
			config,
			callback(
				{ action: "undo", scope: "community", institutionId: 42 },
				message,
			),
			createDependencies({
				undoReview: async (input) => {
					undoCalls.push(input);
					return {} as Awaited<ReturnType<ReviewBotDependencies["undoReview"]>>;
				},
			}),
		);

		assert.deepEqual(undoCalls, [{ institutionId: 42, reviewerId: "admin-1" }]);
		assert.ok(
			calls.some(
				(call) =>
					call.method === "sendMessage" &&
					JSON.stringify(call.input).includes("reverted to pending"),
			),
		);
	});

	test("treats undo as a no-op when the institution already changed", async () => {
		const { calls, client, message } = createHarness();
		await handleReviewCallback(
			client,
			config,
			callback(
				{ action: "undo", scope: "community", institutionId: 42 },
				message,
			),
			createDependencies({ undoReview: async () => null }),
		);

		assert.ok(
			calls.some(
				(call) =>
					call.method === "answerCallbackQuery" &&
					JSON.stringify(call.input).includes("already changed"),
			),
		);
		assert.ok(!calls.some((call) => call.method === "sendMessage"));
	});

	test("/find <id> opens a Telegram-reviewable institution directly", async () => {
		const { calls, client, message } = createHarness();
		message.text = "/find 42";
		const saved: unknown[] = [];
		await handleMenuMessage(
			client,
			config,
			message,
			createDependencies({
				getCandidate: async (id) => (id === 42 ? candidate : null),
				saveSession: async (input) => {
					saved.push(input);
				},
			}),
		);

		assert.deepEqual(saved, [
			{ telegramChatId: "123", scope: "all", cursorInstitutionId: 42 },
		]);
		assert.ok(calls.some((call) => call.method === "sendPhoto"));
	});

	test("/find <name> with one match opens it directly", async () => {
		const { calls, client, message } = createHarness();
		message.text = "/find amanah";
		await handleMenuMessage(
			client,
			config,
			message,
			createDependencies({
				searchCandidates: async () => [{ id: 42, name: "Masjid Amanah" }],
				getCandidate: async () => candidate,
			}),
		);

		assert.ok(calls.some((call) => call.method === "sendPhoto"));
	});

	test("/find <name> with multiple matches lists them instead of guessing", async () => {
		const { calls, client, message } = createHarness();
		message.text = "/find masjid";
		await handleMenuMessage(
			client,
			config,
			message,
			createDependencies({
				searchCandidates: async () => [
					{ id: 42, name: "Masjid Amanah" },
					{ id: 43, name: "Masjid Ikhlas" },
				],
			}),
		);

		assert.ok(!calls.some((call) => call.method === "sendPhoto"));
		assert.ok(
			calls.some(
				(call) =>
					call.method === "sendMessage" &&
					JSON.stringify(call.input).includes("#42") &&
					JSON.stringify(call.input).includes("#43"),
			),
		);
	});
});
