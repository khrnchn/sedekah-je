import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import {
	approvalEmailEvents,
	approvalEmails,
	institutions,
	users,
} from "@/db/schema";
import { sendInstitutionApprovalEmail } from "./approval";
import { buildInstitutionApproveLink } from "./approval-link";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function queueApprovalEmails(
	tx: Transaction,
	institutionIds: number[],
) {
	if (!institutionIds.length) return;
	await tx
		.insert(approvalEmails)
		.values(institutionIds.map((institutionId) => ({ institutionId })))
		.onConflictDoNothing();
}

export function invalidateApprovalEmailStatus() {
	try {
		revalidateTag("approved-institutions", { expire: 0 });
	} catch {
		/* CLI workers have no request cache. */
	}
}

export async function sendTrackedApprovalEmail(
	institutionId: number,
	send = sendInstitutionApprovalEmail,
) {
	const token = randomUUID();
	const claimed = await db.transaction(async (tx) => {
		const [row] = await tx
			.select()
			.from(institutions)
			.where(
				and(
					eq(institutions.id, institutionId),
					eq(institutions.status, "approved"),
				),
			)
			.for("update");
		if (!row) throw new Error("Institution is not approved");
		const [attempt] = await tx
			.update(approvalEmails)
			.set({
				status: "sending",
				attemptToken: token,
				attemptCount: sql`${approvalEmails.attemptCount} + 1`,
				attemptedAt: new Date(),
				lastError: null,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(approvalEmails.institutionId, institutionId),
					inArray(approvalEmails.status, ["pending", "failed"]),
				),
			)
			.returning();
		if (!attempt) return null;
		const [contributor] = row.contributorId
			? await tx
					.select({ email: users.email, name: users.name })
					.from(users)
					.where(eq(users.id, row.contributorId))
					.limit(1)
			: [];
		return { row, contributor };
	});
	if (!claimed)
		throw new Error(
			"Email cannot be retried: it is already processing, accepted, or its outcome is unknown",
		);
	invalidateApprovalEmailStatus();

	const { row, contributor } = claimed;
	const result = contributor?.email
		? await send({
				recipientEmail: contributor.email,
				recipientName: contributor.name,
				approveLink: buildInstitutionApproveLink(row.category, row.slug),
				city: row.city,
				state: row.state,
				category: row.category,
				institutionName: row.name,
			})
		: ({
				ok: false,
				certainty: "rejected",
				error:
					"No contributor email is available. Assign a contributor before retrying.",
			} as const);

	await db.transaction(async (tx) => {
		if (result.ok) {
			await tx.execute(
				sql`select pg_advisory_xact_lock(hashtext(${result.messageId}))`,
			);
			const [event] = await tx
				.select()
				.from(approvalEmailEvents)
				.where(eq(approvalEmailEvents.messageId, result.messageId))
				.limit(1);
			await tx
				.update(approvalEmails)
				.set({
					status: event?.status ?? "accepted",
					messageId: result.messageId,
					acceptedAt: new Date(),
					deliveredAt: event?.status === "delivered" ? event.occurredAt : null,
					lastError:
						event?.status === "bounced"
							? "MailerSend reported a bounced email. Check recipient details in provider activity."
							: null,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(approvalEmails.institutionId, institutionId),
						eq(approvalEmails.attemptToken, token),
					),
				);
		} else {
			await tx
				.update(approvalEmails)
				.set({
					status: result.certainty === "rejected" ? "failed" : "unknown",
					lastError: result.error,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(approvalEmails.institutionId, institutionId),
						eq(approvalEmails.attemptToken, token),
					),
				);
		}
	});
	invalidateApprovalEmailStatus();
	return result;
}

export async function recordApprovalEmailEvent(event: {
	messageId: string;
	status: "delivered" | "bounced";
	occurredAt: Date;
}) {
	await db.transaction(async (tx) => {
		await tx.execute(
			sql`select pg_advisory_xact_lock(hashtext(${event.messageId}))`,
		);
		const [existing] = await tx
			.select()
			.from(approvalEmailEvents)
			.where(eq(approvalEmailEvents.messageId, event.messageId))
			.limit(1);
		// Latest provider event wins; a bounce wins ties. Repeated and delayed events are harmless.
		if (
			existing &&
			(existing.occurredAt > event.occurredAt ||
				(existing.occurredAt.getTime() === event.occurredAt.getTime() &&
					existing.status === "bounced"))
		)
			return;
		await tx
			.insert(approvalEmailEvents)
			.values(event)
			.onConflictDoUpdate({
				target: approvalEmailEvents.messageId,
				set: { status: event.status, occurredAt: event.occurredAt },
			});
		await tx
			.update(approvalEmails)
			.set({
				status: event.status,
				deliveredAt: event.status === "delivered" ? event.occurredAt : null,
				lastError:
					event.status === "bounced"
						? "MailerSend reported a bounced email. Check recipient details in provider activity."
						: null,
				updatedAt: new Date(),
			})
			.where(eq(approvalEmails.messageId, event.messageId));
	});
	invalidateApprovalEmailStatus();
}
