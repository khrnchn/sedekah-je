"use server";

import { eq, TransactionRollbackError } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { insertQuestAttempt } from "@/app/quest/_lib/attempts";
import { questSubmitSchema } from "@/app/quest/_lib/schema";
import { auth } from "@/auth";
import { db } from "@/db";
import { institutions, questMosques } from "@/db/schema";
import { classifyQuestQr } from "@/lib/features/quest/rules";
import { r2Storage } from "@/lib/integrations/r2-client";
import {
	notifyInstitutionSubmission,
	notifyQuestAttempt,
} from "@/lib/integrations/telegram/review-bot";
import { decodeQrFromBuffer } from "@/lib/qr-decode";
import { isToyyibpay } from "@/lib/qr-utils";
import { findDuplicateQr } from "@/lib/queries/institution-duplicate";
import {
	checkSubmissionRateLimit,
	SUBMISSIONS_PER_DAY,
} from "@/lib/queries/institution-submission-limit";
import { getUserById } from "@/lib/queries/users";
import { slugify } from "@/lib/utils";

export type QuestSubmitState =
	| { status: "idle" }
	| { status: "success"; kind: "new" | "existing" }
	| {
			status: "error";
			message: string;
			cooldownEndsAt?: string;
			existingUrl?: string;
	  };

const HAS_QR_MESSAGE = "This mosque already has a QR.";
const ALREADY_SUBMITTED_MESSAGE =
	"This QR was already submitted for this mosque.";
const SAVE_FAILED_MESSAGE = "Could not save your submission. Try again.";

async function generateUniqueSlug(name: string): Promise<string> {
	const baseSlug = slugify(name);
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const [existing] = await db
			.select({ id: institutions.id })
			.from(institutions)
			.where(eq(institutions.slug, slug))
			.limit(1);

		if (!existing) return slug;

		slug = `${baseSlug}-${counter}`;
		counter++;
	}
}

export async function submitQuestAttempt(
	_prev: QuestSubmitState,
	formData: FormData,
): Promise<QuestSubmitState> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return { status: "error", message: "Sign in to submit." };
	}
	const userId = session.user.id;

	const parsed = questSubmitSchema.safeParse({
		questMosqueId: formData.get("questMosqueId") ?? undefined,
		qrContent: formData.get("qrContent") ?? undefined,
		sourceUrl: formData.get("sourceUrl") ?? undefined,
	});
	if (!parsed.success) {
		return {
			status: "error",
			message: parsed.error.issues[0]?.message ?? "Invalid submission.",
		};
	}
	const input = parsed.data;

	const [mosque] = await db
		.select({
			id: questMosques.id,
			name: questMosques.name,
			jaisId: questMosques.jaisId,
			district: questMosques.district,
			address: questMosques.address,
			coords: questMosques.coords,
			institutionStatus: institutions.status,
		})
		.from(questMosques)
		.leftJoin(institutions, eq(questMosques.institutionId, institutions.id))
		.where(eq(questMosques.id, input.questMosqueId))
		.limit(1);
	if (!mosque) {
		return { status: "error", message: "Mosque not found." };
	}
	if (mosque.institutionStatus === "approved") {
		return { status: "error", message: HAS_QR_MESSAGE };
	}

	const user = await getUserById(userId);
	const rateLimit = await checkSubmissionRateLimit(
		userId,
		user?.role === "admin",
	);
	if (rateLimit.limited) {
		return {
			status: "error",
			message: `You have reached the limit of ${SUBMISSIONS_PER_DAY} submissions a day. Try again later.`,
			cooldownEndsAt: rateLimit.cooldownEndsAt.toISOString(),
		};
	}

	const qrImageFile = formData.get("qrImage");
	if (!(qrImageFile instanceof File) || qrImageFile.size === 0) {
		return { status: "error", message: "A QR photo is required." };
	}
	if (qrImageFile.size > 5 * 1024 * 1024) {
		return { status: "error", message: "The photo must be 5MB or smaller." };
	}
	if (!qrImageFile.type.startsWith("image/")) {
		return { status: "error", message: "The file must be an image." };
	}

	let qrBuffer: Buffer;
	let qrContent: string | null;
	try {
		qrBuffer = Buffer.from(await qrImageFile.arrayBuffer());
		qrContent = (await decodeQrFromBuffer(qrBuffer)) ?? input.qrContent ?? null;
	} catch (error) {
		console.error("Error processing quest QR image:", error);
		return {
			status: "error",
			message: "Could not read the QR photo. Try again.",
		};
	}

	// Duplicate check runs before the R2 upload to avoid orphaned objects.
	const duplicate = qrContent
		? await findDuplicateQr(qrContent, { kind: "session", id: userId })
		: null;
	const existing = duplicate?.existingInstitution;
	let linkedToQuestMosqueId: number | null = null;
	if (existing?.status === "approved") {
		const [linked] = await db
			.select({ id: questMosques.id })
			.from(questMosques)
			.where(eq(questMosques.institutionId, existing.id))
			.limit(1);
		linkedToQuestMosqueId = linked?.id ?? null;
	}

	const classified = classifyQuestQr({ duplicate, linkedToQuestMosqueId });

	if (classified.kind === "blocked") {
		return {
			status: "error",
			message: "This QR is already on sedekah.je.",
			existingUrl: existing?.status === "approved" ? existing.url : undefined,
		};
	}

	if (classified.kind === "existing") {
		let attemptId: number;
		try {
			const outcome = await db.transaction((tx) =>
				insertQuestAttempt(tx, {
					questMosqueId: mosque.id,
					userId,
					kind: "existing",
					institutionId: classified.institutionId,
				}),
			);
			if (outcome.result === "has_qr") {
				return { status: "error", message: HAS_QR_MESSAGE };
			}
			if (outcome.result === "already_submitted") {
				return { status: "error", message: ALREADY_SUBMITTED_MESSAGE };
			}
			attemptId = outcome.id;
		} catch (error) {
			console.error("Failed to insert quest attempt:", error);
			return { status: "error", message: SAVE_FAILED_MESSAGE };
		}

		try {
			await notifyQuestAttempt(attemptId);
		} catch (telegramError) {
			console.error("Failed to notify Telegram:", telegramError);
		}

		revalidateTag("quest-mosques", "max");
		revalidateTag("pending-institutions", "max");
		revalidateTag("institutions-count", "max");
		revalidateTag(`user_contributions_count:${userId}`, "max");
		return { status: "success", kind: "existing" };
	}

	const slug = await generateUniqueSlug(mosque.name);

	let qrImageUrl: string;
	try {
		qrImageUrl = await r2Storage.uploadFile(qrBuffer, qrImageFile.name);
	} catch (error) {
		console.error("Failed to upload quest QR image to R2:", error);
		return {
			status: "error",
			message: "Could not upload the QR photo. Try again.",
		};
	}

	// Assigned inside the transaction callback; the cast stops TS narrowing it to "ok".
	let outcome = "ok" as Awaited<
		ReturnType<typeof insertQuestAttempt>
	>["result"];
	let newId: number | undefined;
	try {
		await db.transaction(async (tx) => {
			const [row] = await tx
				.insert(institutions)
				.values({
					name: mosque.name,
					slug,
					category: "masjid",
					state: "Selangor",
					city: mosque.district,
					address: mosque.address,
					coords: mosque.coords,
					qrImage: qrImageUrl,
					qrContent,
					sourceUrl: input.sourceUrl ?? null,
					supportedPayment: [isToyyibpay(qrContent) ? "toyyibpay" : "duitnow"],
					status: "pending",
					contributorId: userId,
					contributorRemarks: `Quest contribution for mosque ID ${mosque.id} (JAIS: ${mosque.jaisId})`,
				})
				.returning({ id: institutions.id });
			({ result: outcome } = await insertQuestAttempt(tx, {
				questMosqueId: mosque.id,
				userId,
				kind: "new",
				institutionId: row.id,
			}));
			if (outcome !== "ok") tx.rollback();
			newId = row.id;
		});
	} catch (error) {
		if (!(error instanceof TransactionRollbackError)) {
			console.error("Failed to insert quest institution:", error);
			outcome = "ok";
			newId = undefined;
		}
	}

	if (newId === undefined) {
		try {
			await r2Storage.deleteFile(qrImageUrl);
		} catch (cleanupError) {
			console.error("R2 cleanup after failed quest insert:", cleanupError);
		}
		if (outcome === "has_qr") {
			return { status: "error", message: HAS_QR_MESSAGE };
		}
		if (outcome === "already_submitted") {
			return { status: "error", message: ALREADY_SUBMITTED_MESSAGE };
		}
		return { status: "error", message: SAVE_FAILED_MESSAGE };
	}

	try {
		await notifyInstitutionSubmission(newId);
	} catch (telegramError) {
		console.error("Failed to notify Telegram:", telegramError);
	}

	revalidateTag("quest-mosques", "max");
	revalidateTag("pending-institutions", "max");
	revalidateTag("institutions-count", "max");
	revalidateTag(`user_contributions_count:${userId}`, "max");
	return { status: "success", kind: "new" };
}
