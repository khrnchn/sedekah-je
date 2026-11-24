"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/date-utils";
import {
	type ApprovalEmailSummary,
	approvalEmailDescriptions,
	approvalEmailLabels,
	canRetryApprovalEmail,
} from "@/lib/email/approval-status";
import { retryInstitutionApprovalEmail } from "../_lib/actions";

export function ApprovalEmailStatus({
	institutionId,
	email,
	detailed = false,
}: {
	institutionId: number;
	email: ApprovalEmailSummary | null;
	detailed?: boolean;
}) {
	const router = useRouter();
	const [busy, startTransition] = useTransition();
	const status = email?.status ?? "unknown";
	useEffect(() => {
		if (
			!detailed ||
			(status !== "pending" && status !== "sending" && status !== "accepted")
		)
			return;
		const timer = setInterval(() => router.refresh(), 15_000);
		return () => clearInterval(timer);
	}, [router, status, detailed]);
	function retry() {
		startTransition(async () => {
			try {
				const result = await retryInstitutionApprovalEmail(institutionId);
				if (result.ok)
					toast.success(
						"Email accepted by MailerSend. Delivery is not yet confirmed.",
					);
				else toast.error(result.error);
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Could not retry the email. Refresh to check its status.",
				);
			} finally {
				router.refresh();
			}
		});
	}
	return (
		<div className="space-y-2" aria-busy={busy}>
			<div className="flex flex-wrap items-center gap-2">
				<Badge
					variant={
						status === "failed" || status === "bounced"
							? "destructive"
							: "outline"
					}
				>
					{approvalEmailLabels[status]}
				</Badge>
				{canRetryApprovalEmail(email?.status ?? null) && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={retry}
						disabled={busy}
						aria-label={`${status === "pending" ? "Send" : "Retry"} approval email for institution ${institutionId}`}
					>
						{busy ? (
							<Loader2 className="mr-1 h-3 w-3 animate-spin" />
						) : (
							<RefreshCw className="mr-1 h-3 w-3" />
						)}
						{busy
							? "Sending…"
							: status === "pending"
								? "Send email"
								: "Retry email"}
					</Button>
				)}
			</div>
			{email?.lastError && (
				<p
					className="max-w-sm whitespace-normal break-words text-xs text-destructive"
					aria-live="polite"
				>
					{email.lastError}
				</p>
			)}
			{detailed && (
				<div className="space-y-1 text-sm text-muted-foreground">
					<p>
						{email
							? approvalEmailDescriptions[status]
							: "No email tracking record exists for this approval. Past delivery is unknown; it will not be resent automatically."}
					</p>
					{email && (
						<>
							<p>
								Attempts: {email.attemptCount} · Last attempt:{" "}
								{formatDateTime(email.attemptedAt)}
							</p>
							{email.acceptedAt && (
								<p>Accepted: {formatDateTime(email.acceptedAt)}</p>
							)}
							{email.deliveredAt && (
								<p>Delivered: {formatDateTime(email.deliveredAt)}</p>
							)}
							{email.messageId && (
								<p className="break-all">
									Provider message ID:{" "}
									<span className="font-mono text-xs">{email.messageId}</span>
								</p>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
