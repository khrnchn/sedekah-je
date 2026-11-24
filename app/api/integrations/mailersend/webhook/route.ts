import { env } from "@/env";
import { recordApprovalEmailEvent } from "@/lib/email/approval-delivery";
import {
	MAILERSEND_TEST_SECRET,
	parseMailerSendEvent,
	verifyMailerSendSignature,
} from "@/lib/email/approval-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const body = await request.text();
	if (body.length > 64_000)
		return new Response("Payload too large", { status: 413 });
	const signature = request.headers.get("signature");
	// MailerSend validates new URLs with a fixed signing key. This path never mutates data.
	if (verifyMailerSendSignature(body, signature, MAILERSEND_TEST_SECRET)) {
		return new Response(null, {
			status: parseMailerSendEvent(body)?.type === "webhook.test" ? 204 : 401,
		});
	}
	if (!env.MAILERSEND_WEBHOOK_SECRET)
		return new Response("Webhook is not configured", { status: 503 });
	if (
		!verifyMailerSendSignature(body, signature, env.MAILERSEND_WEBHOOK_SECRET)
	)
		return new Response("Unauthorized", { status: 401 });
	const event = parseMailerSendEvent(body);
	if (!event) return new Response("Invalid event", { status: 400 });
	if (
		event.type === "activity.delivered" ||
		event.type === "activity.soft_bounced" ||
		event.type === "activity.hard_bounced"
	) {
		if (!event.data) return new Response("Missing message ID", { status: 400 });
		try {
			await recordApprovalEmailEvent({
				messageId: event.data.message_id,
				status: event.type === "activity.delivered" ? "delivered" : "bounced",
				occurredAt: new Date(event.created_at),
			});
		} catch {
			console.error("[approval email webhook] Event persistence failed");
			return new Response("Please retry", { status: 503 });
		}
	}
	return new Response(null, { status: 204 });
}
