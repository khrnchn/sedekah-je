"use server";

import { db } from "@/db";
import { institutions } from "@/db/institutions";
import { requireAdminSession } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export async function saveManualQrContent(
	institutionId: number,
	qrContent: string,
): Promise<{ success: boolean; message: string }> {
	try {
		await requireAdminSession();

		if (!qrContent || qrContent.trim() === "") {
			return {
				success: false,
				message: "QR content cannot be empty",
			};
		}

		await db
			.update(institutions)
			.set({
				qrContent: qrContent.trim(),
				updatedAt: new Date(),
			})
			.where(eq(institutions.id, institutionId));

		revalidatePath(`/admin/institutions/pending/${institutionId}`);
		revalidatePath(`/admin/institutions/approved/${institutionId}`);
		revalidatePath("/admin/institutions/pending");
		revalidatePath("/admin/institutions/approved");
		revalidateTag("pending-institutions");
		revalidateTag("approved-institutions");
		revalidateTag("institutions-data");
		revalidateTag("institutions");

		return {
			success: true,
			message: "QR content saved successfully",
		};
	} catch (error) {
		console.error("Error saving manual QR content:", error);
		return {
			success: false,
			message: "Failed to save QR content",
		};
	}
}
