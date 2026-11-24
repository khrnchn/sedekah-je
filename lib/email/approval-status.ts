export const approvalEmailStatuses = [
	"pending",
	"sending",
	"accepted",
	"delivered",
	"failed",
	"bounced",
	"unknown",
] as const;
export type ApprovalEmailStatus = (typeof approvalEmailStatuses)[number];

export const approvalEmailLabels: Record<ApprovalEmailStatus, string> = {
	pending: "Pending",
	sending: "Sending",
	accepted: "Accepted",
	delivered: "Delivered",
	failed: "Failed",
	bounced: "Bounced",
	unknown: "Unknown",
};

export function canRetryApprovalEmail(status: ApprovalEmailStatus | null) {
	return status === "failed" || status === "pending";
}

export const approvalEmailDescriptions: Record<ApprovalEmailStatus, string> = {
	pending: "Waiting to send. You can send this pending email now.",
	sending:
		"A send attempt started. Check provider activity before attempting another send.",
	accepted: "MailerSend accepted the email. Delivery has not been confirmed.",
	delivered: "MailerSend confirmed delivery to the recipient’s mail server.",
	failed: "The email was not accepted. Fix this issue, then retry.",
	bounced:
		"The recipient’s mail server rejected the email. Check the recipient before sending again.",
	unknown:
		"No confirmed sending outcome. Check provider activity before sending again.",
};

export type ApprovalEmailSummary = Pick<
	typeof import("@/db/schema").approvalEmails.$inferSelect,
	| "institutionId"
	| "status"
	| "attemptCount"
	| "lastError"
	| "attemptedAt"
	| "acceptedAt"
	| "deliveredAt"
	| "messageId"
>;
