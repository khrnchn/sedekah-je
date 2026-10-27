import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import sharp from "sharp";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { env } from "@/env";
import { reviewVersion } from "@/lib/features/institution-review/telegram-evidence";
import { recoverQrFromBuffer } from "@/lib/qr-decode";
import { createTelegramBotClient } from "./bot-api";
import {
	AssessmentError,
	assessmentKey,
	REVIEW_PROMPT_VERSION,
	requestAssessment,
} from "./gemini-assessment";
import { reviewAiConfig } from "./review-ai-config";
import {
	formatAssessmentReport,
	formatAssessmentUnavailable,
} from "./review-assessment-copy";
import { fetchReviewImage } from "./review-media";
import { sendReviewText } from "./review-text";

const LEASE_MS = 180_000;
export function shouldAutoAnalyseSubmission(sourceUrl: string | null): boolean {
	return !sourceUrl || /^https?:/i.test(sourceUrl);
}
export async function scheduleReviewAnalysis(
	id: number,
	retry = false,
	dispatch?: (work: () => Promise<void>) => void,
): Promise<void> {
	// This switch gates automatic AND on-demand calls for either provider.
	const provider = reviewAiConfig(env);
	if (!env.TELEGRAM_AI_ENABLED || !provider) return;
	let validatedCacheKey: string | undefined;
	let validatedVersion: string | undefined;
	if (!retry) {
		const [snapshot] = await db
			.select()
			.from(institutions)
			.where(eq(institutions.id, id));
		const cached = snapshot?.reviewMetadata?.analysis;
		if (snapshot?.qrImage && cached?.state === "complete") {
			try {
				validatedCacheKey = assessmentKey(
					await fetchReviewImage(snapshot.qrImage),
					snapshot,
					provider.identity,
				);
				validatedVersion = reviewVersion(snapshot);
			} catch {
				/* Recheck in the worker; manual review is still available. */
			}
		}
	}
	const queued = await db.transaction(async (tx) => {
		const [row] = await tx
			.select()
			.from(institutions)
			.where(eq(institutions.id, id))
			.for("update");
		if (!row || row.status !== "pending") return false;
		const version = reviewVersion(row),
			model = provider.identity;
		const previous = row.reviewMetadata?.analysis;
		const contextChanged =
			!!previous &&
			(previous.version !== version ||
				previous.model !== model ||
				previous.promptVersion !== REVIEW_PROMPT_VERSION);
		const imageChanged =
			!!previous?.key &&
			validatedVersion === version &&
			validatedCacheKey !== undefined &&
			previous.key !== validatedCacheKey;
		const current =
			previous?.version === version &&
			previous.model === model &&
			previous.promptVersion === REVIEW_PROMPT_VERSION &&
			!imageChanged
				? previous
				: undefined;
		if (
			current?.state === "processing" &&
			(current.leaseUntil ?? 0) > Date.now()
		)
			return false;
		if (
			!retry &&
			((current?.state === "complete" &&
				validatedCacheKey &&
				current.key === validatedCacheKey) ||
				current?.state === "unavailable")
		)
			return false;
		if (!retry && current && current.attempts >= 3) {
			await tx
				.update(institutions)
				.set({
					updatedAt: row.updatedAt,
					reviewMetadata: {
						...row.reviewMetadata,
						analysis: {
							...current,
							state: "unavailable",
							error: "interrupted_attempt_limit",
						},
					},
				})
				.where(eq(institutions.id, id));
			return false;
		}
		await tx
			.update(institutions)
			.set({
				updatedAt: row.updatedAt,
				reviewMetadata: {
					...row.reviewMetadata,
					...(contextChanged || imageChanged ? { evidence: undefined } : {}),
					analysis: {
						version,
						model,
						promptVersion: REVIEW_PROMPT_VERSION,
						state: "queued",
						attempts: retry ? 0 : (current?.attempts ?? 0),
					},
				},
			})
			.where(eq(institutions.id, id));
		return true;
	});
	if (!queued) return;
	if (dispatch) {
		dispatch(() => runReviewAnalysis(id));
		return;
	}
	try {
		after(() => runReviewAnalysis(id));
	} catch {
		void runReviewAnalysis(id).catch(() =>
			console.error("[review analysis] background work interrupted"),
		);
	}
}
export async function runReviewAnalysis(id: number): Promise<void> {
	const provider = reviewAiConfig(env);
	if (!env.TELEGRAM_AI_ENABLED || !provider) return;
	for (let retry = 0; retry < 3; retry++) {
		const claim = randomUUID();
		const row = await db.transaction(async (tx) => {
			const [row] = await tx
				.select()
				.from(institutions)
				.where(eq(institutions.id, id))
				.for("update");
			const a = row?.reviewMetadata?.analysis;
			if (
				!row ||
				row.status !== "pending" ||
				!a ||
				a.version !== reviewVersion(row) ||
				a.attempts >= 3 ||
				a.model !== provider.identity ||
				a.promptVersion !== REVIEW_PROMPT_VERSION ||
				(a.state !== "queued" &&
					!(a.state === "processing" && (a.leaseUntil ?? 0) <= Date.now()))
			)
				return null;
			await tx
				.update(institutions)
				.set({
					updatedAt: row.updatedAt,
					reviewMetadata: {
						...row.reviewMetadata,
						analysis: {
							...a,
							claim,
							state: "processing",
							attempts: a.attempts + 1,
							leaseUntil: Date.now() + LEASE_MS,
						},
					},
				})
				.where(eq(institutions.id, id));
			return row;
		});
		if (!row) return;
		let result: Awaited<ReturnType<typeof requestAssessment>> | undefined,
			error: AssessmentError | undefined,
			key: string | undefined,
			decodedQrContent: string | null = null;
		try {
			if (!row.qrImage) throw new AssessmentError("missing_image");
			const bytes = await fetchReviewImage(row.qrImage);
			key = assessmentKey(bytes, row, provider.identity);
			const meta = await sharp(bytes).metadata();
			decodedQrContent = await recoverQrFromBuffer(bytes);
			result = await requestAssessment({
				bytes,
				mimeType: `image/${meta.format}`,
				row: { ...row, qrContent: decodedQrContent },
				apiKey: provider.apiKey,
				model: provider.model,
				baseUrl: provider.baseUrl,
			});
		} catch (err) {
			error =
				err instanceof AssessmentError
					? err
					: new AssessmentError("image_unavailable");
		}
		const state = await db.transaction(async (tx) => {
			const [current] = await tx
				.select()
				.from(institutions)
				.where(eq(institutions.id, id))
				.for("update");
			const analysis = current?.reviewMetadata?.analysis;
			if (
				!current ||
				current.status !== "pending" ||
				!analysis ||
				analysis.claim !== claim ||
				reviewVersion(current) !== analysis.version
			)
				return "stale";
			const shouldRetry = !!error?.transient && analysis.attempts < 3;
			await tx
				.update(institutions)
				.set({
					updatedAt: current.updatedAt,
					reviewMetadata: {
						...current.reviewMetadata,
						analysis: {
							...analysis,
							key,
							state: result
								? "complete"
								: shouldRetry
									? "queued"
									: "unavailable",
							result,
							error: error?.code,
							leaseUntil: undefined,
							claim: undefined,
						},
					},
				})
				.where(eq(institutions.id, id));
			return shouldRetry ? "retry" : "done";
		});
		if (state === "retry") {
			await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** retry));
			continue;
		}
		if (state === "done" && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
			try {
				await sendReviewText(createTelegramBotClient(env.TELEGRAM_BOT_TOKEN), {
					chatId: env.TELEGRAM_CHAT_ID,
					text: result
						? formatAssessmentReport({
								id,
								name: row.name,
								category: row.category,
								qrContent: decodedQrContent,
								assessment: result,
							})
						: formatAssessmentUnavailable(id),
				});
			} catch {
				console.error("[review analysis] report delivery failed");
			}
		}
		return;
	}
}
