"use server";

import { randomUUID } from "node:crypto";
import { institutionFormSchema } from "@/app/(user)/contribute/_lib/validations";
import type { Category } from "@/app/types/institutions";
import { db } from "@/db";
import { institutions } from "@/db/institutions";
import type { states } from "@/db/institutions";
import { r2Storage } from "@/lib/r2-client";
import jsQR from "jsqr";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

export type SubmitInstitutionFormState =
	| { status: "idle" }
	| { status: "success" }
	| { status: "error"; errors: Record<string, string[]> };

export async function submitInstitution(
	_prevState: SubmitInstitutionFormState | undefined,
	formData: FormData,
): Promise<SubmitInstitutionFormState> {
	console.log(
		"Server action called with formData:",
		Array.from(formData.entries()),
	);

	// --- Extract raw values
	const raw = {
		name: formData.get("name"),
		category: formData.get("category"),
		state: formData.get("state"),
		city: formData.get("city"),
		facebook: formData.get("facebook"),
		instagram: formData.get("instagram"),
		website: formData.get("website"),
		contributorRemarks: formData.get("contributorRemarks"),
		fromSocialMedia: formData.has("fromSocialMedia"),
		sourceUrl: formData.get("sourceUrl"),
		contributorId: formData.get("contributorId"),
		lat: formData.get("lat"),
		lon: formData.get("lon"),
	} as Record<string, unknown>;

	console.log("Raw form data:", raw);

	const parsed = institutionFormSchema.safeParse(raw);
	if (!parsed.success) {
		console.log("Validation failed:", parsed.error.flatten().fieldErrors);
		return {
			status: "error",
			errors: parsed.error.flatten().fieldErrors,
		};
	}

	console.log("Validation passed, proceeding with submission");

	// --- Handle QR image (optional)
	const qrImageFile = formData.get("qrImage") as File | null;
	let qrImageUrl: string | undefined;
	let qrContent: string | undefined;
	try {
		if (qrImageFile && qrImageFile.size > 0) {
			const arrayBuffer = await qrImageFile.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Upload to R2
			qrImageUrl = await r2Storage.uploadFile(buffer, qrImageFile.name);

			// Attempt QR decode
			try {
				const { data, info } = await sharp(buffer)
					.ensureAlpha()
					.raw()
					.toBuffer({ resolveWithObject: true });

				const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
				if (code) {
					qrContent = code.data;
				}
			} catch (err) {
				console.error("QR decode failed:", err);
			}
		}
	} catch (err) {
		console.error("Error processing QR image:", err);
	}

	// Determine coords
	let coords: [number, number] | undefined;
	if (parsed.data.lat && parsed.data.lon) {
		coords = [
			Number.parseFloat(parsed.data.lat),
			Number.parseFloat(parsed.data.lon),
		];
	} else {
		// Attempt geocoding using Nominatim with timeout
		try {
			const query = `${parsed.data.name}, ${parsed.data.city}, ${parsed.data.state}, Malaysia`;
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
					query,
				)}`,
				{
					headers: { "User-Agent": "sedekahje-bot" },
					signal: controller.signal,
				},
			);

			clearTimeout(timeoutId);

			if (res.ok) {
				const results = (await res.json()) as Array<{
					lat: string;
					lon: string;
				}>;
				if (results.length > 0) {
					coords = [
						Number.parseFloat(results[0].lat),
						Number.parseFloat(results[0].lon),
					];
				}
			}
		} catch (e) {
			console.error("Geocoding failed:", e);
		}
	}

	// --- Insert Institution (status defaults to "pending")
	try {
		const [{ id: _newId }] = await db
			.insert(institutions)
			.values({
				name: parsed.data.name,
				category: parsed.data.category as Category,
				state: parsed.data.state as (typeof states)[number],
				city: parsed.data.city,
				qrImage: qrImageUrl,
				qrContent,
				coords,
				socialMedia: {
					facebook:
						parsed.data.facebook && parsed.data.facebook !== ""
							? parsed.data.facebook
							: undefined,
					instagram:
						parsed.data.instagram && parsed.data.instagram !== ""
							? parsed.data.instagram
							: undefined,
					website:
						parsed.data.website && parsed.data.website !== ""
							? parsed.data.website
							: undefined,
				},
				contributorId: parsed.data.contributorId,
				contributorRemarks:
					parsed.data.contributorRemarks &&
					parsed.data.contributorRemarks !== ""
						? parsed.data.contributorRemarks
						: undefined,
				sourceUrl:
					parsed.data.fromSocialMedia &&
					parsed.data.sourceUrl &&
					parsed.data.sourceUrl !== ""
						? parsed.data.sourceUrl
						: undefined,
				supportedPayment: ["duitnow", "tng"],
			})
			.returning({ id: institutions.id });

		// --- Revalidate paths that show institution list
		revalidatePath("/");
		revalidatePath("/my-contributions");

		console.log("Institution successfully created with ID:", _newId);
		return { status: "success" };
	} catch (error) {
		console.error("Database insertion failed:", error);
		return {
			status: "error",
			errors: {
				general: ["Ralat menyimpan data. Sila cuba lagi."],
			},
		};
	}
}
