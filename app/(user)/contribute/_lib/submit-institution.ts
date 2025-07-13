"use server";

import { db } from "@/db";
import { institutions } from "@/db/institutions";
import type { categories, states } from "@/lib/institution-constants";
import { getUserById } from "@/lib/queries/users";
import { r2Storage } from "@/lib/r2-client";
import {
	BinaryBitmap,
	HybridBinarizer,
	QRCodeReader,
	RGBLuminanceSource,
} from "@zxing/library";
import { and, count, eq, gte } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import sharp from "sharp";
import { institutionFormServerSchema } from "./validations";

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
	const rawFromForm = {
		name: formData.get("name"),
		category: formData.get("category"),
		state: formData.get("state"),
		city: formData.get("city"),
		address: formData.get("address"),
		contributorRemarks: formData.get("contributorRemarks"),
		sourceUrl: formData.get("sourceUrl"),
		contributorId: formData.get("contributorId"),
	};

	// --- Verify Turnstile token (skip in development)
	if (process.env.NODE_ENV !== "development") {
		const turnstileToken = formData.get("turnstileToken") as string;
		if (!turnstileToken) {
			return {
				status: "error",
				errors: {
					turnstileToken: ["Pengesahan keselamatan diperlukan"],
				},
			};
		}

		try {
			const baseUrl = process.env.VERCEL_URL
				? `https://${process.env.VERCEL_URL}`
				: "https://sedekah.je";

			const verifyResponse = await fetch(`${baseUrl}/api/verify-turnstile`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token: turnstileToken }),
			});

			const verifyResult = await verifyResponse.json();
			if (!verifyResult.success) {
				return {
					status: "error",
					errors: {
						turnstileToken: [
							verifyResult.error || "Pengesahan keselamatan gagal",
						],
					},
				};
			}
		} catch (error) {
			console.error("Turnstile verification failed:", error);
			return {
				status: "error",
				errors: {
					turnstileToken: ["Ralat pengesahan keselamatan. Sila cuba lagi."],
				},
			};
		}
	}

	// --- Rate limit check (3 submissions per day)
	const contributorId = formData.get("contributorId") as string | null;
	if (contributorId) {
		const user = await getUserById(contributorId);

		if (user?.role !== "admin") {
			const oneDayAgo = new Date();
			oneDayAgo.setDate(oneDayAgo.getDate() - 1);

			const [{ value }] = await db
				.select({ value: count() })
				.from(institutions)
				.where(
					and(
						eq(institutions.contributorId, contributorId),
						gte(institutions.createdAt, oneDayAgo),
					),
				);

			if (value >= 3) {
				return {
					status: "error",
					errors: {
						general: [
							"Anda telah mencapai had 3 sumbangan sehari. Sila cuba lagi esok. Terima kasih!",
						],
					},
				};
			}
		}
	}

	const socialMedia = {
		facebook: formData.get("facebook") || undefined,
		instagram: formData.get("instagram") || undefined,
		website: formData.get("website") || undefined,
	};

	let coords: [number, number] | undefined;
	const lat = formData.get("lat");
	const lon = formData.get("lon");
	if (lat && lon) {
		coords = [
			Number.parseFloat(lat as string),
			Number.parseFloat(lon as string),
		];
	}

	const dataToValidate = {
		...rawFromForm,
		socialMedia,
		coords,
	};

	const parsed = institutionFormServerSchema.safeParse(dataToValidate);

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
			// Validate file size (5MB limit)
			const maxSizeBytes = 5 * 1024 * 1024; // 5MB
			if (qrImageFile.size > maxSizeBytes) {
				return {
					status: "error",
					errors: {
						qrImage: ["Saiz fail imej terlalu besar. Had maksimum adalah 5MB."],
					},
				};
			}

			// Validate file type
			if (!qrImageFile.type.startsWith("image/")) {
				return {
					status: "error",
					errors: {
						qrImage: ["Fail yang dimuat naik mestilah imej."],
					},
				};
			}

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
			}
		}
	} catch (err) {
		console.error("Error processing QR image:", err);
	}

	// The logic for geocoding if coords are not present can remain,
	// but it happens after our primary validation. We can re-assign coords.
	if (!coords) {
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
				category: parsed.data.category as (typeof categories)[number],
				state: parsed.data.state as (typeof states)[number],
				city: parsed.data.city,
				address: parsed.data.address,
				qrImage: qrImageUrl,
				qrContent: qrContent,
				coords: coords,
				socialMedia: parsed.data.socialMedia,
				contributorId: parsed.data.contributorId,
				contributorRemarks: parsed.data.contributorRemarks,
				sourceUrl: parsed.data.sourceUrl,
				supportedPayment: ["duitnow", "tng"],
			})
			.returning({ id: institutions.id });

		// --- Revalidate paths that show institution list
		revalidatePath("/");
		revalidatePath("/my-contributions");

		// --- Revalidate admin dashboard data
		revalidateTag("pending-institutions");

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
