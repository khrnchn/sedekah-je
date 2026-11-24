import { z } from "zod";

export type ApprovalSendResult =
	| { ok: true; messageId: string }
	| { ok: false; error: string; certainty: "rejected" | "unknown" };

const responseSchema = z.object({
	statusCode: z.number(),
	headers: z.record(z.unknown()).optional(),
	body: z.unknown().optional(),
});

export function approvalSendResponse(value: unknown): ApprovalSendResult {
	const parsed = responseSchema.safeParse(value);
	if (!parsed.success)
		return {
			ok: false,
			certainty: "unknown",
			error:
				"Provider returned an unexpected response. Check MailerSend activity before retrying.",
		};
	const { statusCode, headers, body } = parsed.data;
	const id = headers?.["x-message-id"];
	if (statusCode === 202 && typeof id === "string" && id.length > 0)
		return { ok: true, messageId: id };
	const suppressed = z
		.object({ warnings: z.array(z.object({ type: z.string() })) })
		.safeParse(body);
	if (
		statusCode === 202 &&
		suppressed.success &&
		suppressed.data.warnings.some((w) => w.type === "ALL_SUPPRESSED")
	) {
		return {
			ok: false,
			certainty: "rejected",
			error:
				"MailerSend suppressed the recipient. Check the recipient’s suppression status.",
		};
	}
	// Retain an actionable provider code without persisting recipient addresses or raw bodies.
	const providerCode = JSON.stringify(body ?? {}).match(/\bMS\d{5}\b/)?.[0];
	const error =
		providerCode === "MS42225"
			? "MailerSend sandbox recipient limit reached (MS42225). Complete MailerSend account approval before retrying."
			: `MailerSend returned HTTP ${statusCode}${providerCode ? ` (${providerCode})` : ""}. Check provider activity and configuration.`;
	return {
		ok: false,
		error,
		certainty:
			statusCode >= 400 && statusCode < 500 && statusCode !== 408
				? "rejected"
				: "unknown",
	};
}

export function approvalSendError(error: unknown): ApprovalSendResult {
	if (responseSchema.safeParse(error).success)
		return approvalSendResponse(error);
	return {
		ok: false,
		certainty: "unknown",
		error:
			"No confirmed provider response. Check MailerSend activity before retrying to avoid duplicate email.",
	};
}
