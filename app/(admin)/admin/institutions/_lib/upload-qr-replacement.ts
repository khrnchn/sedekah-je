"use server";

import { db } from "@/db";
import { institutions } from "@/db/institutions";
import { requireAdminSession } from "@/lib/auth-helpers";
import { r2Storage } from "@/lib/r2-client";
import {
	BinaryBitmap,
	HybridBinarizer,
	QRCodeReader,
	RGBLuminanceSource,
} from "@zxing/library";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

export type UploadQrReplacementResult = {
	success: boolean;
	message: string;
	qrImageUrl?: string;
	qrContent?: string;
	error?: string;
};

export async function uploadQrReplacement(
	institutionId: number,
	formData: FormData,
): Promise<UploadQrReplacementResult> {
	try {
		await requireAdminSession(); // Extract QR image file from FormData
		const qrImageFile = formData.get("qrImage") as File | null;

		if (!qrImageFile || qrImageFile.size === 0) {
			return {
				success: false,
				message: "No QR image file provided",
				error: "FILE_MISSING",
			};
		}

		// Convert file to buffer
		const arrayBuffer = await qrImageFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload to R2 storage
		const qrImageUrl = await r2Storage.uploadFile(buffer, qrImageFile.name);

		// Attempt QR code extraction
		let qrContent: string | undefined;
		try {
			const { data, info } = await sharp(buffer)
				.ensureAlpha()
				.raw()
				.toBuffer({ resolveWithObject: true });

			// Convert RGBA to RGB for @zxing/library
			const rgbData = new Uint8ClampedArray(info.width * info.height * 3);
			for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
				rgbData[j] = data[i]; // R
				rgbData[j + 1] = data[i + 1]; // G
				rgbData[j + 2] = data[i + 2]; // B
				// Skip alpha channel
			}

			const luminanceSource = new RGBLuminanceSource(
				rgbData,
				info.width,
				info.height,
			);
			const binaryBitmap = new BinaryBitmap(
				new HybridBinarizer(luminanceSource),
			);
			const reader = new QRCodeReader();

			const result = reader.decode(binaryBitmap);
			if (result) {
				qrContent = result.getText();
			}
		} catch (err) {
			console.error("QR decode failed:", err);
			// Don't fail the upload if QR extraction fails
		}

		return {
			success: true,
			message: qrContent
				? "QR image uploaded and content extracted successfully"
				: "QR image uploaded but content extraction failed",
			qrImageUrl,
			qrContent,
		};
	} catch (error) {
		console.error("Error uploading QR replacement:", error);
		return {
			success: false,
			message: "Failed to upload QR image",
			error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
		};
	}
}

export async function saveQrReplacement(
	institutionId: number,
	qrImageUrl: string,
	qrContent?: string,
): Promise<{ success: boolean; message: string; error?: string }> {
	try {
		await requireAdminSession(); // Update institution with new QR data
		await db
			.update(institutions)
			.set({
				qrImage: qrImageUrl,
				qrContent: qrContent || null,
				updatedAt: new Date(),
			})
			.where(eq(institutions.id, institutionId));

		// Revalidate relevant paths
		revalidatePath(`/admin/institutions/pending/${institutionId}`);
		revalidatePath(`/admin/institutions/approved/${institutionId}`);
		revalidatePath("/admin/institutions/pending");
		revalidatePath("/admin/institutions/approved");

		return {
			success: true,
			message: "QR code replacement saved successfully",
		};
	} catch (error) {
		console.error("Error saving QR replacement:", error);
		return {
			success: false,
			message: "Failed to save QR replacement",
			error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
		};
	}
}
