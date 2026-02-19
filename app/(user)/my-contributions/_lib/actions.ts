"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { institutions } from "@/db/institutions";
import { getUserById } from "@/lib/queries/users";
import { r2Storage } from "@/lib/r2-client";
import { logRejectedInstitutionUpdate } from "@/lib/telegram";
import { slugify } from "@/lib/utils";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export type UpdateRejectedInstitutionResult =
	| { status: "success" }
	| { status: "error"; errors: Record<string, string[]> };

async function generateUniqueSlugForUpdate(
	name: string,
	excludeId: number,
): Promise<string> {
	const baseSlug = slugify(name);
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const [existing] = await db
			.select({ id: institutions.id })
			.from(institutions)
			.where(and(eq(institutions.slug, slug), ne(institutions.id, excludeId)))
			.limit(1);

		if (!existing) {
			return slug;
		}

		slug = `${baseSlug}-${counter}`;
		counter++;
	}
}

export async function updateRejectedInstitution(
	institutionId: number,
	formData: FormData,
): Promise<UpdateRejectedInstitutionResult> {
	const hdrs = await import("next/headers").then((m) => m.headers());
	const session = await auth.api.getSession({ headers: hdrs });

	if (!session?.user?.id) {
		return {
			status: "error",
			errors: {
				general: [
					"Anda mesti log masuk untuk mengemaskini. Sila log masuk dan cuba lagi.",
				],
			},
		};
	}

	const contributorId = session.user.id;
	const user = await getUserById(contributorId);

	if (!user) {
		return {
			status: "error",
			errors: {
				general: ["Pengguna tidak sah. Sila log masuk semula dan cuba lagi."],
			},
		};
	}

	const name = formData.get("name");
	if (!name || typeof name !== "string" || name.trim() === "") {
		return {
			status: "error",
			errors: { name: ["Nama institusi diperlukan"] },
		};
	}

	const [existing] = await db
		.select({
			id: institutions.id,
			name: institutions.name,
			slug: institutions.slug,
			status: institutions.status,
			contributorId: institutions.contributorId,
			qrImage: institutions.qrImage,
			qrContent: institutions.qrContent,
			category: institutions.category,
			state: institutions.state,
			city: institutions.city,
		})
		.from(institutions)
		.where(eq(institutions.id, institutionId))
		.limit(1);

	if (!existing) {
		return {
			status: "error",
			errors: { general: ["Institusi tidak dijumpai."] },
		};
	}

	if (existing.contributorId !== contributorId) {
		return {
			status: "error",
			errors: {
				general: ["Anda tidak dibenarkan mengemaskini institusi ini."],
			},
		};
	}

	if (existing.status !== "rejected") {
		return {
			status: "error",
			errors: {
				general: ["Hanya institusi yang ditolak boleh dikemaskini."],
			},
		};
	}

	let qrImageUrl: string | undefined = existing.qrImage ?? undefined;
	let qrContent: string | null = existing.qrContent;
	const qrImageFile = formData.get("qrImage") as File | null;

	if (qrImageFile && qrImageFile.size > 0) {
		const maxSizeBytes = 5 * 1024 * 1024; // 5MB
		if (qrImageFile.size > maxSizeBytes) {
			return {
				status: "error",
				errors: {
					qrImage: ["Saiz fail imej terlalu besar. Had maksimum adalah 5MB."],
				},
			};
		}

		if (!qrImageFile.type.startsWith("image/")) {
			return {
				status: "error",
				errors: { qrImage: ["Fail yang dimuat naik mestilah imej."] },
			};
		}

		const arrayBuffer = await qrImageFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		try {
			qrImageUrl = await r2Storage.uploadFile(buffer, qrImageFile.name);
		} catch (uploadError) {
			console.error("Failed to upload QR image to R2:", uploadError);
			return {
				status: "error",
				errors: { qrImage: ["Gagal memuat naik imej QR. Sila cuba lagi."] },
			};
		}

		const qrContentFromForm = formData.get("qrContent");
		qrContent =
			qrContentFromForm && typeof qrContentFromForm === "string"
				? qrContentFromForm
				: null;
	}

	const newSlug = await generateUniqueSlugForUpdate(name.trim(), institutionId);

	try {
		await db
			.update(institutions)
			.set({
				name: name.trim(),
				slug: newSlug,
				qrImage: qrImageUrl,
				qrContent,
				status: "pending",
				adminNotes: null,
				reviewedBy: null,
				reviewedAt: null,
				updatedAt: new Date(),
			})
			.where(eq(institutions.id, institutionId));

		try {
			await logRejectedInstitutionUpdate({
				institutionId: institutionId.toString(),
				institutionName: name.trim(),
				category: existing.category ?? "unknown",
				state: existing.state,
				city: existing.city,
				contributorName: user.name || "Unknown",
				contributorEmail: user.email ?? "N/A",
				previousName: existing.name,
			});
		} catch (telegramError) {
			console.error(
				"Failed to log rejected institution update to Telegram:",
				telegramError,
			);
		}

		revalidateTag(`user-contributions:${contributorId}`);
		revalidateTag("user-contributions");
		revalidatePath("/my-contributions", "page");
		revalidatePath("/admin/institutions/pending", "page");
		revalidateTag("institutions-count");
		revalidateTag("pending-institutions");

		return { status: "success" };
	} catch (error) {
		console.error("Failed to update rejected institution:", error);
		return {
			status: "error",
			errors: {
				general: [
					"Gagal mengemaskini sumbangan. Sila cuba lagi atau hubungi kami.",
				],
			},
		};
	}
}
