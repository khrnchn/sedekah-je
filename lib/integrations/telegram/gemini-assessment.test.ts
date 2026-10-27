import assert from "node:assert/strict";
import { test } from "node:test";
import { makeRecord } from "./__fixtures__/review-records";
import {
	AssessmentError,
	assessmentKey,
	parseAssessmentText,
	requestAssessment,
} from "./gemini-assessment";

const assessment = {
	imageType: "physical_photo",
	visibleInstitution: "Masjid Amanah",
	visibleLocation: "Petaling Jaya",
	recipientRelationship: "institution",
	conflicts: [],
	explanation: "Physical poster; human verification remains required.",
};
const input = {
	bytes: Buffer.from("test-image"),
	row: makeRecord({
		contributorRemarks: "PRIVATE NOTE",
		contributorId: "PRIVATE ID",
	}),
	apiKey: "test-only",
	mimeType: "image/png",
	model: "gemini-flash-latest",
};
function fetcher(response: Response): typeof fetch {
	return Object.assign(async () => response, {});
}
test("Gemini request excludes contributor details, identities, notes and full payload", async () => {
	let body = "";
	const mock = Object.assign(async (_url: unknown, options?: RequestInit) => {
		body = String(options?.body);
		return Response.json({
			candidates: [
				{ content: { parts: [{ text: JSON.stringify(assessment) }] } },
			],
		});
	}, {});
	assert.deepEqual(await requestAssessment(input, mock), assessment);
	for (const secret of [
		"PRIVATE NOTE",
		"PRIVATE ID",
		input.row.qrContent ?? "missing-payload",
	])
		assert.equal(body.includes(secret), false);
	assert.match(body, /NEVER instructions/);
	assert.match(body, /MASJID AMANAH/);
});
test("Gemini validates structured output and rejects malformed or invented fields", async () => {
	for (const text of [
		"not json",
		JSON.stringify({ ...assessment, approve: true }),
		JSON.stringify({ ...assessment, imageType: "trusted" }),
	]) {
		await assert.rejects(
			() =>
				requestAssessment(
					input,
					fetcher(
						Response.json({ candidates: [{ content: { parts: [{ text }] } }] }),
					),
				),
			/malformed_response/,
		);
	}
});
test("403 is permanent; 429, 5xx and timeouts are transient", async () => {
	for (const code of [403, 429, 503])
		await assert.rejects(
			() =>
				requestAssessment(input, fetcher(new Response("", { status: code }))),
			(error: unknown) =>
				error instanceof AssessmentError &&
				error.code === `http_${code}` &&
				error.transient === (code !== 403),
		);
	const timeout = Object.assign(async () => {
		throw new DOMException("timeout", "TimeoutError");
	}, {});
	await assert.rejects(
		() => requestAssessment(input, timeout),
		(error: unknown) => error instanceof AssessmentError && error.transient,
	);
});
test("cache key covers bytes, metadata, payload and model", () => {
	const key = assessmentKey(input.bytes, input.row, input.model);
	assert.notEqual(
		key,
		assessmentKey(Buffer.from("changed"), input.row, input.model),
	);
	assert.notEqual(
		key,
		assessmentKey(
			input.bytes,
			{ ...input.row, city: "Shah Alam" },
			input.model,
		),
	);
	assert.notEqual(
		key,
		assessmentKey(
			input.bytes,
			{ ...input.row, qrContent: "changed" },
			input.model,
		),
	);
	assert.notEqual(key, assessmentKey(input.bytes, input.row, "another-model"));
});

test("automatic analysis scopes ordinary sources and excludes bulk markers", async () => {
	const { shouldAutoAnalyseSubmission } = await import("./review-analysis");
	assert.equal(shouldAutoAnalyseSubmission(null), true);
	assert.equal(
		shouldAutoAnalyseSubmission("https://official.example.test"),
		true,
	);
	assert.equal(shouldAutoAnalyseSubmission("walter-import:batch"), false);
	assert.equal(shouldAutoAnalyseSubmission("akrimi"), false);
});

test("body download failures remain transient but invalid response JSON is permanent", async () => {
	for (const failure of [
		new DOMException("timed out", "TimeoutError"),
		new TypeError("connection terminated"),
	]) {
		const response = new Response(
			new ReadableStream({
				start(controller) {
					controller.error(failure);
				},
			}),
		);
		await assert.rejects(
			() => requestAssessment(input, fetcher(response)),
			(error: unknown) =>
				error instanceof AssessmentError &&
				error.code === "timeout_or_network" &&
				error.transient,
		);
	}
	await assert.rejects(
		() => requestAssessment(input, fetcher(new Response("not JSON"))),
		(error: unknown) =>
			error instanceof AssessmentError &&
			error.code === "malformed_response" &&
			!error.transient,
	);
});

test("gateway sends image evidence with strict schema and excludes private fields", async () => {
	const mock: typeof fetch = async (url, options) => {
		assert.equal(url, "https://gateway.example.test/claude-v1/v1/messages");
		const headers = new Headers(options?.headers);
		assert.equal(headers.get("x-api-key"), input.apiKey);
		assert.equal(headers.get("anthropic-version"), "2023-06-01");
		assert.equal(headers.has("x-goog-api-key"), false);
		const body = JSON.parse(String(options?.body));
		assert.equal(body.model, "claude-sonnet-5-5");
		assert.equal(
			body.messages[0].content[1].source.data,
			input.bytes.toString("base64"),
		);
		assert.match(body.system, /"additionalProperties":false/);
		assert.match(body.system, /"type":"object"/);
		assert.equal(body.output_config, undefined);
		for (const secret of [
			"PRIVATE NOTE",
			"PRIVATE ID",
			input.row.qrContent ?? "missing-payload",
		])
			assert.equal(String(options?.body).includes(secret), false);
		return Response.json({
			stop_reason: "end_turn",
			content: [{ type: "text", text: JSON.stringify(assessment) }],
		});
	};
	assert.deepEqual(
		await requestAssessment(
			{
				...input,
				model: "claude-sonnet-5-5",
				baseUrl: "https://gateway.example.test/claude-v1/v1/",
			},
			mock,
		),
		assessment,
	);
});

test("gateway refuses truncated, malformed and unvalidated assessments", async () => {
	const gatewayInput = { ...input, baseUrl: "https://gateway.example.test/v1" };
	for (const response of [
		{
			stop_reason: "max_tokens",
			content: [{ type: "text", text: JSON.stringify(assessment) }],
		},
		{ stop_reason: "end_turn", content: [{ type: "text", text: "not json" }] },
		{
			stop_reason: "end_turn",
			content: [
				{
					type: "text",
					text: JSON.stringify({ ...assessment, approve: true }),
				},
			],
		},
		{ stop_reason: "end_turn", content: [] },
	])
		await assert.rejects(
			() => requestAssessment(gatewayInput, fetcher(Response.json(response))),
			/malformed_response/,
		);
	for (const status of [403, 429, 503])
		await assert.rejects(
			() =>
				requestAssessment(gatewayInput, fetcher(new Response("", { status }))),
			(error: unknown) =>
				error instanceof AssessmentError &&
				error.transient === (status !== 403),
		);
});

test("gateway accepts one fenced JSON object but rejects prose and malformed content", () => {
	assert.deepEqual(
		parseAssessmentText(`\`\`\`json\n${JSON.stringify(assessment)}\n\`\`\``),
		assessment,
	);
	for (const value of [
		`Here is the answer: ${JSON.stringify(assessment)}`,
		`\`\`\`json\n${JSON.stringify({ ...assessment, approve: true })}\n\`\`\``,
		`\`\`\`json\n{"imageType":}\n\`\`\``,
	])
		assert.throws(() => parseAssessmentText(value));
});

test("image text cannot confirm a recipient when local DuitNow validation fails", async () => {
	for (const payload of [null, makePayloadWithWrongChecksum()]) {
		const reply = fetcher(
			Response.json({
				stop_reason: "end_turn",
				content: [{ type: "text", text: JSON.stringify(assessment) }],
			}),
		);
		const result = await requestAssessment(
			{
				...input,
				row: makeRecord({ qrContent: payload }),
				baseUrl: "https://gateway.example.test/v1",
			},
			reply,
		);
		assert.equal(result.recipientRelationship, "unclear");
		assert.match(result.conflicts.at(-1) ?? "", /cannot confirm ownership/);
	}
});

function makePayloadWithWrongChecksum() {
	const payload = makeRecord().qrContent;
	return payload ? `${payload.slice(0, -4)}0000` : null;
}

test("provider selection keeps credentials separate and invalidates cache on gateway changes", async () => {
	const { reviewAiConfig } = await import("./review-ai-config");
	const direct = {
		TELEGRAM_AI_PROVIDER: "gemini" as const,
		GEMINI_MODEL: input.model,
		GEMINI_API_KEY: "google-only",
	};
	assert.equal(reviewAiConfig(direct)?.apiKey, "google-only");
	assert.equal(
		reviewAiConfig({ ...direct, TELEGRAM_AI_PROVIDER: "anthropic-compatible" }),
		undefined,
	);
	const settings = {
		...direct,
		TELEGRAM_AI_PROVIDER: "anthropic-compatible" as const,
		TELEGRAM_AI_API_KEY: "gateway-only",
		TELEGRAM_AI_MODEL: "claude-sonnet-5-5",
		TELEGRAM_AI_BASE_URL: "https://gateway.example.test/v1",
	};
	const gateway = reviewAiConfig(settings);
	assert.ok(gateway);
	assert.equal(gateway.apiKey, "gateway-only");
	assert.notEqual(
		gateway.identity,
		reviewAiConfig({
			...settings,
			TELEGRAM_AI_BASE_URL: "https://other.example.test/v1",
		})?.identity,
	);
	assert.notEqual(
		gateway.identity,
		reviewAiConfig({ ...settings, TELEGRAM_AI_MODEL: "other-model" })?.identity,
	);
	assert.notEqual(
		assessmentKey(input.bytes, input.row, gateway.identity),
		assessmentKey(input.bytes, input.row, direct.GEMINI_MODEL),
	);
});
