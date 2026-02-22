"use server";

import { and, count, eq, gte, isNull } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { institutions, questMosques } from "@/db/schema";
import { r2Storage } from "@/lib/r2-client";
import { logNewInstitution } from "@/lib/telegram";
import { slugify } from "@/lib/utils";

export type QuestContributeState =
	| { status: "idle" }
	| { status: "success" }
	| { status: "error"; message: string };

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

export async function submitQuestContribution(
	formData: FormData,
): Promise<QuestContributeState> {
	// 1. Auth check
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return { status: "error", message: "Sila log masuk untuk menyumbang." };
	}

	const userId = session.user.id;

	// 2. Rate limit: 3 submissions per day (skip for admins)
	if ((session.user as { role?: string }).role !== "admin") {
		const oneDayAgo = new Date();
		oneDayAgo.setDate(oneDayAgo.getDate() - 1);

		const [{ value }] = await db
			.select({ value: count() })
			.from(institutions)
			.where(
				and(
					eq(institutions.contributorId, userId),
					gte(institutions.createdAt, oneDayAgo),
				),
			);

		if (value >= 3) {
			return {
				status: "error",
				message:
					"Anda telah mencapai had 3 sumbangan sehari. Sila cuba lagi esok.",
			};
		}
	}

	// 3. Validate quest mosque
	const questMosqueId = formData.get("questMosqueId");
	if (!questMosqueId || typeof questMosqueId !== "string") {
		return { status: "error", message: "ID masjid tidak sah." };
	}

	const [questMosque] = await db
		.select()
		.from(questMosques)
		.where(
			and(
				eq(questMosques.id, Number.parseInt(questMosqueId, 10)),
				isNull(questMosques.institutionId),
			),
		)
		.limit(1);

	if (!questMosque) {
		return {
			status: "error",
			message: "Masjid tidak ditemui atau sudah mempunyai QR.",
		};
	}

	// 4. Validate QR image
	const qrImageFile = formData.get("qrImage") as File | null;
	if (!qrImageFile || qrImageFile.size === 0) {
		return { status: "error", message: "Gambar kod QR diperlukan." };
	}

	if (qrImageFile.size > 5 * 1024 * 1024) {
		return {
			status: "error",
			message: "Saiz fail imej terlalu besar. Had maksimum adalah 5MB.",
		};
	}

	if (!qrImageFile.type.startsWith("image/")) {
		return {
			status: "error",
			message: "Fail yang dimuat naik mestilah imej.",
		};
	}

	// 5. Duplicate QR check
	const qrContent = formData.get("qrContent") as string | null;
	if (qrContent && qrContent.trim() !== "") {
		const [existingQr] = await db
			.select({ id: institutions.id })
			.from(institutions)
			.where(eq(institutions.qrContent, qrContent.trim()))
			.limit(1);

		if (existingQr) {
			return {
				status: "error",
				message: "QR code ini telah pun wujud dalam sistem.",
			};
		}
	}

	// 5b. Validate optional sourceUrl
	const rawSourceUrl = formData.get("sourceUrl") as string | null;
	let sourceUrl: string | null = null;
	if (rawSourceUrl && rawSourceUrl.trim() !== "") {
		try {
			const u = new URL(rawSourceUrl.trim());
			if (u.protocol !== "http:" && u.protocol !== "https:") {
				return { status: "error", message: "URL tidak sah." };
			}
			sourceUrl = rawSourceUrl.trim();
		} catch {
			return { status: "error", message: "URL tidak sah." };
		}
	}

	// 6. Generate slug
	const slug = await generateUniqueSlug(questMosque.name);

	// 7. Upload QR image to R2
	let qrImageUrl: string;
	try {
		const arrayBuffer = await qrImageFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		qrImageUrl = await r2Storage.uploadFile(buffer, qrImageFile.name);
	} catch (uploadError) {
		console.error("Failed to upload QR image to R2:", uploadError);
		return {
			status: "error",
			message: "Gagal memuat naik imej QR. Sila cuba lagi.",
		};
	}

	// 8. Insert institution
	try {
		const [{ id: newId }] = await db
			.insert(institutions)
			.values({
				name: questMosque.name,
				slug,
				category: "masjid",
				state: "Selangor",
				city: questMosque.district,
				address: questMosque.address,
				coords: questMosque.coords,
				qrImage: qrImageUrl,
				qrContent: qrContent?.trim() || null,
				sourceUrl,
				supportedPayment: ["duitnow"],
				status: "pending",
				contributorId: userId,
				contributorRemarks: `Quest contribution for mosque ID ${questMosque.id} (JAIS: ${questMosque.jaisId})`,
			})
			.returning({ id: institutions.id });

		await db
			.update(questMosques)
			.set({ institutionId: newId })
			.where(eq(questMosques.id, questMosque.id));

		// 9. Telegram notification
		try {
			// Avoid sending raw contributor email to third-party notifications.
			await logNewInstitution({
				id: newId.toString(),
				name: questMosque.name,
				category: "masjid",
				state: "Selangor",
				city: questMosque.district,
				contributorName: session.user.name || "Unknown",
				contributorEmail: "redacted",
			});
		} catch (telegramError) {
			console.error("Failed to log to Telegram:", telegramError);
		}

		// 10. Revalidate caches
		revalidateTag("quest-mosques");
		revalidateTag("institutions-count");
		revalidateTag("pending-institutions");
		revalidateTag(`user_contributions_count:${userId}`);

		return { status: "success" };
	} catch (error) {
		console.error("Failed to insert institution:", error);
		return {
			status: "error",
			message: "Gagal menyimpan sumbangan. Sila cuba lagi.",
		};
	}
}
