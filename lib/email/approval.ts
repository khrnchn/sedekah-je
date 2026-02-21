"use server";

import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import { env } from "@/env";

/**
 * Sends an institution approval email to the submitter via MailerSend template.
 * No-op if MailerSend is not configured (missing API key or template ID).
 */
export async function sendInstitutionApprovalEmail(params: {
	recipientEmail: string;
	recipientName: string | null;
	approveLink: string;
}): Promise<{ ok: boolean; error?: string }> {
	const apiKey = env.MAILERSEND_API_KEY;
	const templateId = env.MAILERSEND_APPROVAL_TEMPLATE_ID;
	const fromEmail = env.MAILERSEND_FROM_EMAIL ?? "noreply@mail.sedekah.je";
	const fromName = env.MAILERSEND_FROM_NAME ?? "SedekahJe";

	if (!apiKey || !templateId) {
		return { ok: true }; // no-op when not configured
	}

	try {
		const mailerSend = new MailerSend({ apiKey });
		const sentFrom = new Sender(fromEmail, fromName);
		const recipients = [
			new Recipient(params.recipientEmail, params.recipientName ?? "Pengguna"),
		];
		const personalization = [
			{
				email: params.recipientEmail,
				data: {
					name: params.recipientName ?? "Pengguna",
					approveLink: params.approveLink,
				},
			},
		];

		const emailParams = new EmailParams()
			.setFrom(sentFrom)
			.setTo(recipients)
			.setReplyTo(sentFrom)
			.setSubject("Kiriman anda telah diluluskan – SedekahJe")
			.setTemplateId(templateId)
			.setPersonalization(personalization);

		await mailerSend.email.send(emailParams);
		return { ok: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: message };
	}
}
