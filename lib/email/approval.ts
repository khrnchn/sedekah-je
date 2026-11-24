import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import { env } from "@/env";
import {
	type ApprovalSendResult,
	approvalSendError,
	approvalSendResponse,
} from "./approval-result";

/**
 * Sends an institution approval email to the submitter via MailerSend template.
 * Missing configuration is an explicit failure; acceptance requires a message ID.
 */
export async function sendInstitutionApprovalEmail(params: {
	recipientEmail: string;
	recipientName: string | null;
	approveLink: string;
	city: string;
	state: string;
	category: string;
	institutionName: string;
}): Promise<ApprovalSendResult> {
	const apiKey = env.MAILERSEND_API_KEY;
	const templateId = env.MAILERSEND_APPROVAL_TEMPLATE_ID;
	const fromEmail = env.MAILERSEND_FROM_EMAIL ?? "noreply@mail.sedekah.je";
	const fromName = env.MAILERSEND_FROM_NAME ?? "SedekahJe";

	if (!apiKey || !templateId) {
		return {
			ok: false,
			certainty: "rejected",
			error:
				"Approval email is not configured. Set the MailerSend API key and approval template before retrying.",
		};
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
					city: params.city,
					name: params.recipientName ?? "Pengguna",
					state: params.state,
					category: params.category,
					approveLink: params.approveLink,
					institutionName: params.institutionName,
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

		return approvalSendResponse(await mailerSend.email.send(emailParams));
	} catch (err) {
		return approvalSendError(err);
	}
}
