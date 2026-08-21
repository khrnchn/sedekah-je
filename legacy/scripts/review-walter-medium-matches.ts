#!/usr/bin/env bun
/**
 * Sends `nameMatchesMedium` from the Walter similarity report to OpenAI
 * (gpt-4o-mini) for a human-style duplicate review. Writes structured JSON
 * under scripts/data/ (gitignored).
 *
 * Requires: OPENAI_API_KEY (see env.ts)
 *
 * Usage:
 *   bun scripts/review-walter-medium-matches.ts [--report path/to.json] [--chunk N]
 * Default report: scripts/data/walter-similarity-report.json
 * Default chunk: 15 pairs per API call (then one final merge summary call).
 *
 * Output: scripts/data/walter-medium-llm-review.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPORT = path.join(
	__dirname,
	"data",
	"walter-similarity-report.json",
);
const OUTPUT_PATH = path.join(
	__dirname,
	"data",
	"walter-medium-llm-review.json",
);
const MODEL = "gpt-4o-mini";
const MAX_ATTEMPTS = 6;

type MediumRow = {
	walterId: number;
	walterName: string;
	similarity: number;
	matchType: string;
	candidateId: number;
	candidateName: string;
	candidateCity: string;
	candidateState: string;
	candidateCategory: string;
	candidateStatus: string;
	normWalter: string;
	normCandidate: string;
};

type ItemVerdict = {
	walterId: number;
	verdict: "likely_duplicate" | "likely_distinct" | "uncertain";
	confidence: "low" | "medium" | "high";
	reason: string;
};

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

function parseOpenAiRetryAfterMs(errText: string): number | null {
	const m = errText.match(/try again in ([\d.]+)\s*ms/i);
	if (!m?.[1]) return null;
	const n = Number.parseFloat(m[1]);
	return Number.isFinite(n) ? Math.ceil(n) + 250 : null;
}

function parseArgs() {
	const argv = process.argv.slice(2);
	let reportPath = DEFAULT_REPORT;
	const ri = argv.indexOf("--report");
	if (ri !== -1 && argv[ri + 1]) reportPath = path.resolve(argv[ri + 1]);
	let chunkSize = 15;
	const ci = argv.indexOf("--chunk");
	const chunkArg = ci !== -1 ? argv[ci + 1] : undefined;
	if (typeof chunkArg === "string") {
		const n = Number.parseInt(chunkArg, 10);
		if (Number.isFinite(n) && n > 0) chunkSize = n;
	}
	return { reportPath, chunkSize };
}

function buildBatchPrompt(rows: MediumRow[], batchLabel: string): string {
	const lines = rows.map((r, i) => {
		const sim = (r.similarity * 100).toFixed(1);
		return [
			`${i + 1}. [walterId=${r.walterId}] "${r.walterName}"`,
			`   vs [candidateId=${r.candidateId}] "${r.candidateName}"`,
			`   (${r.candidateCity}, ${r.candidateState}; ${r.candidateCategory}; ${r.candidateStatus})`,
			`   algorithm: ${r.matchType} ~${sim}% | norm: "${r.normWalter}" vs "${r.normCandidate}"`,
		].join("\n");
	});
	return [
		`Batch: ${batchLabel} (${rows.length} pair(s)).`,
		"",
		"Each line is a NEW Walter bulk import row vs an EXISTING approved directory entry.",
		"Decide if they are likely the SAME real-world institution (or same donation channel),",
		"likely DIFFERENT (coincidence / substring false positive / different place), or UNCERTAIN.",
		"",
		...lines,
	].join("\n");
}

const SYSTEM_PROMPT =
	"You review Malaysian mosque/surau/tahfiz/charity listings for duplicate detection. " +
	"Be concise. Names may be in Malay/English/Rumi; states and cities matter for distinctness. " +
	"A 'contains' fuzzy hit is often a false positive when geography differs. " +
	"Respond with JSON only.";

async function callOpenAiJson(userText: string): Promise<unknown | null> {
	const apiKey = env.OPENAI_API_KEY;
	if (!apiKey) {
		console.error("OPENAI_API_KEY is not set.");
		return null;
	}

	const body = {
		model: MODEL,
		response_format: { type: "json_object" as const },
		messages: [
			{ role: "system" as const, content: SYSTEM_PROMPT },
			{ role: "user" as const, content: userText },
		],
	};

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const res = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (res.status === 429) {
			const errText = await res.text();
			const waitMs =
				parseOpenAiRetryAfterMs(errText) ??
				Math.min(60_000, 2000 * 2 ** attempt);
			console.warn(
				`OpenAI 429, waiting ${waitMs}ms (attempt ${attempt + 1}/${MAX_ATTEMPTS})`,
			);
			await sleep(waitMs);
			continue;
		}

		if (!res.ok) {
			console.error("OpenAI error:", res.status, await res.text());
			return null;
		}

		const data = (await res.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		const raw = data.choices?.[0]?.message?.content;
		if (!raw) return null;
		try {
			return JSON.parse(raw) as unknown;
		} catch {
			console.error("OpenAI returned non-JSON");
			return null;
		}
	}
	console.error("OpenAI: exhausted retries.");
	return null;
}

function isItemVerdict(x: unknown, walterId: number): x is ItemVerdict {
	if (!x || typeof x !== "object") return false;
	const o = x as Record<string, unknown>;
	return (
		o.walterId === walterId &&
		(o.verdict === "likely_duplicate" ||
			o.verdict === "likely_distinct" ||
			o.verdict === "uncertain") &&
		(o.confidence === "low" ||
			o.confidence === "medium" ||
			o.confidence === "high") &&
		typeof o.reason === "string"
	);
}

async function mergeSummaries(
	batchSummaries: string[],
	allItems: ItemVerdict[],
): Promise<string | null> {
	const text =
		"Here are per-batch summaries from reviewing Walter import vs existing institution name matches:\n\n" +
		batchSummaries.map((s, i) => `--- Batch ${i + 1} ---\n${s}`).join("\n\n") +
		"\n\nCounts by verdict:\n" +
		["likely_duplicate", "likely_distinct", "uncertain"]
			.map((v) => {
				const c = allItems.filter((i) => i.verdict === v).length;
				return `${v}: ${c}`;
			})
			.join("\n") +
		'\n\nReturn JSON: { "overallSummary": string } with 2–4 short paragraphs in English for admins: themes, how many look like duplicates vs noise, and review tips.';

	const parsed = await callOpenAiJson(text);
	if (!parsed || typeof parsed !== "object") return null;
	const s = (parsed as { overallSummary?: unknown }).overallSummary;
	return typeof s === "string" ? s : null;
}

async function main() {
	const { reportPath, chunkSize } = parseArgs();

	if (!fs.existsSync(reportPath)) {
		console.error(`Report not found: ${reportPath}`);
		process.exit(1);
	}

	const raw = JSON.parse(fs.readFileSync(reportPath, "utf-8")) as {
		generatedAt?: string;
		nameMatchesMedium?: MediumRow[];
	};
	const medium = raw.nameMatchesMedium ?? [];
	if (medium.length === 0) {
		console.log("No nameMatchesMedium in report; nothing to send.");
		const empty = {
			generatedAt: new Date().toISOString(),
			sourceReport: reportPath,
			model: MODEL,
			overallSummary: "No medium matches to review.",
			items: [] as ItemVerdict[],
			batchSummaries: [] as string[],
		};
		fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
		fs.writeFileSync(OUTPUT_PATH, JSON.stringify(empty, null, 2), "utf-8");
		console.log(`Wrote ${OUTPUT_PATH}`);
		return;
	}

	console.log(
		`Reviewing ${medium.length} medium match(es), chunk size ${chunkSize}…`,
	);

	const allItems: ItemVerdict[] = [];
	const batchSummaries: string[] = [];

	for (let start = 0; start < medium.length; start += chunkSize) {
		const chunk = medium.slice(start, start + chunkSize);
		const label = `${start + 1}-${start + chunk.length}`;
		console.log(`  API batch ${label}…`);
		const userText =
			buildBatchPrompt(chunk, label) +
			'\n\nReturn JSON: { "items": [ { "walterId": number, "verdict": "likely_duplicate"|"likely_distinct"|"uncertain", "confidence": "low"|"medium"|"high", "reason": string } ], "batchSummary": string }' +
			"\nInclude one object per pair above, same order, matching walterId exactly. " +
			"batchSummary: 2–4 sentences on this chunk only.";

		const parsed = await callOpenAiJson(userText);
		if (!parsed || typeof parsed !== "object") {
			console.error(`Failed batch ${label}`);
			process.exit(1);
		}
		const items = (parsed as { items?: unknown }).items;
		const batchSummary = (parsed as { batchSummary?: unknown }).batchSummary;
		if (!Array.isArray(items)) {
			console.error(`Invalid items in batch ${label}`);
			process.exit(1);
		}
		for (let i = 0; i < chunk.length; i++) {
			const row = chunk[i];
			if (row === undefined) continue;
			const it = items[i];
			if (!isItemVerdict(it, row.walterId)) {
				console.error(`Batch ${label}: bad item at ${i}`);
				process.exit(1);
			}
			allItems.push(it);
		}
		batchSummaries.push(
			typeof batchSummary === "string" ? batchSummary : "(no batch summary)",
		);
		await sleep(500);
	}

	console.log("Merging batch summaries…");
	const overallSummary =
		batchSummaries.length === 1
			? (batchSummaries[0] ?? "")
			: ((await mergeSummaries(batchSummaries, allItems)) ??
				batchSummaries.join("\n\n"));

	const output = {
		generatedAt: new Date().toISOString(),
		sourceReport: reportPath,
		similarityReportAt: raw.generatedAt ?? null,
		model: MODEL,
		chunkSize,
		overallSummary,
		batchSummaries,
		items: allItems,
	};

	fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
	fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");

	console.log("\n--- Overall summary ---\n");
	console.log(overallSummary);
	console.log(`\nWrote ${OUTPUT_PATH}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
