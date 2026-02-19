"use server";

import { db } from "@/db";
import { institutions } from "@/db/institutions";
import { geocodeInstitution } from "@/lib/geocode";
import type { categories, states } from "@/lib/institution-constants";
import { getUserById } from "@/lib/queries/users";
import { r2Storage } from "@/lib/r2-client";
import {
	logInstitutionSubmissionFailure,
	logNewInstitution,
} from "@/lib/telegram";
import { slugify } from "@/lib/utils";
import { and, count, eq, gte } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { institutionFormServerSchema } from "./validations";

export type SubmitInstitutionFormState =
	| { status: "idle" }
	| { status: "success" }
	| { status: "error"; errors: Record<string, string[]> };

// Helper function to generate a unique slug
async function generateUniqueSlug(name: string): Promise<string> {
	const baseSlug = slugify(name);
	let slug = baseSlug;
	let counter = 1;

	// Check if slug already exists
	while (true) {
		const [existing] = await db
			.select({ id: institutions.id })
			.from(institutions)
			.where(eq(institutions.slug, slug))
			.limit(1);

		if (!existing) {
			return slug;
		}

		// If slug exists, append counter
		slug = `${baseSlug}-${counter}`;
		counter++;
	}
}

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
		qrContent: formData.get("qrContent"),
	};

	// --- Authentication check
	const contributorId = formData.get("contributorId") as string | null;
	if (!contributorId || contributorId.trim() === "") {
		return {
			status: "error",
			errors: {
				general: [
					"Anda mesti log masuk untuk menyumbang. Sila log masuk dan cuba lagi.",
				],
			},
		};
	}

	// --- Validate contributorId is a valid user
	const user = await getUserById(contributorId);
	if (!user) {
		return {
			status: "error",
			errors: {
				general: ["Pengguna tidak sah. Sila log masuk semula dan cuba lagi."],
			},
		};
	}

	// --- Rate limit check (3 submissions per day)
	if (user.role !== "admin") {
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

	// --- Duplicate QR content check
	const qrContentRaw = rawFromForm.qrContent;
	if (
		qrContentRaw &&
		typeof qrContentRaw === "string" &&
		qrContentRaw.trim() !== ""
	) {
		const [existingQr] = await db
			.select({ id: institutions.id })
			.from(institutions)
			.where(eq(institutions.qrContent, qrContentRaw.trim()))
			.limit(1);

		if (existingQr) {
			return {
				status: "error",
				errors: {
					general: [
						"QR code ini telah pun wujud dalam sistem. Sila semak semula.",
					],
				},
			};
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

	// Only process coordinates if both are provided and not empty strings
	if (lat && lon && typeof lat === "string" && typeof lon === "string") {
		const latStr = lat.trim();
		const lonStr = lon.trim();

		if (latStr !== "" && lonStr !== "") {
			const latNum = Number.parseFloat(latStr);
			const lonNum = Number.parseFloat(lonStr);

			// Validate that both are valid numbers within proper ranges
			if (
				!Number.isNaN(latNum) &&
				Number.isFinite(latNum) &&
				latNum >= -90 &&
				latNum <= 90 &&
				!Number.isNaN(lonNum) &&
				Number.isFinite(lonNum) &&
				lonNum >= -180 &&
				lonNum <= 180
			) {
				coords = [latNum, lonNum];
			}
		}
	}

	// Generate unique slug before validation since it's required by the schema
	const slug = await generateUniqueSlug(rawFromForm.name as string);

	const dataToValidate = {
		...rawFromForm,
		slug,
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
	// We get qrContent from the form data now, no more backend processing
	const qrContent = formData.get("qrContent") as string | null;

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
			try {
				qrImageUrl = await r2Storage.uploadFile(buffer, qrImageFile.name);
			} catch (uploadError) {
				console.error("Failed to upload QR image to R2:", uploadError);

				// Log to Telegram with error details
				try {
					await logInstitutionSubmissionFailure({
						error:
							uploadError instanceof Error
								? uploadError.message
								: String(uploadError),
						institutionName: parsed.data.name,
						category: parsed.data.category,
						state: parsed.data.state,
						city: parsed.data.city,
						contributorName: user?.name || undefined,
						contributorEmail: user?.email,
						errorType: "R2 image upload failure",
					});
				} catch (telegramError) {
					console.error(
						"Failed to log upload failure to Telegram:",
						telegramError,
					);
				}

				return {
					status: "error",
					errors: {
						qrImage: ["Gagal memuat naik imej QR. Sila cuba lagi."],
					},
				};
			}
		}
	} catch (error) {
		console.error("Error handling QR image upload:", error);

		// Log to Telegram with error details
		try {
			await logInstitutionSubmissionFailure({
				error: error instanceof Error ? error.message : String(error),
				institutionName: parsed?.data?.name,
				category: parsed?.data?.category,
				state: parsed?.data?.state,
				city: parsed?.data?.city,
				contributorName: user?.name || undefined,
				contributorEmail: user?.email,
				errorType: "QR image processing failure",
			});
		} catch (telegramError) {
			console.error(
				"Failed to log QR processing failure to Telegram:",
				telegramError,
			);
		}

		return {
			status: "error",
			errors: {
				qrImage: ["Berlaku ralat semasa memproses imej QR. Sila cuba lagi."],
			},
		};
	}

	// Geocode if coords not provided
	if (!coords) {
		const geocoded = await geocodeInstitution(
			parsed.data.name,
			parsed.data.city,
			parsed.data.state,
		);
		if (geocoded) coords = geocoded;
		else console.error("Geocoding failed");
	}

	try {
		const [{ id: newId }] = await db
			.insert(institutions)
			.values({
				...parsed.data,
				// We can safely cast here because client-side validation ensures
				// these are valid enum values. The server-side schema is intentionally
				// loose as per project rules (no pgEnum).
				category: parsed.data.category as (typeof categories)[number],
				state: parsed.data.state as (typeof states)[number],
				coords: coords, // Coords may be updated by geocoding
				qrImage: qrImageUrl,
				contributorId: contributorId, // Include the contributor ID
				status: "pending", // Always pending for new submissions
				supportedPayment: ["duitnow"], // Default to DuitNow for new submissions
			})
			.returning({ id: institutions.id });

		// Log to Telegram
		if (user) {
			try {
				await logNewInstitution({
					id: newId.toString(),
					name: parsed.data.name,
					category: parsed.data.category,
					state: parsed.data.state,
					city: parsed.data.city,
					contributorName: user.name || "Unknown",
					contributorEmail: user.email,
				});
			} catch (telegramError) {
				console.error(
					"Failed to log new institution to Telegram:",
					telegramError,
				);
			}
		}

		// Revalidate paths to show the new submission.
		// Route groups are not part of the public pathname.
		revalidatePath("/my-contributions", "page");
		revalidatePath("/admin/institutions/pending", "page");
		revalidateTag("institutions-count");
		revalidateTag("pending-institutions");
		revalidateTag(`user_contributions_count:${contributorId}`);

		return { status: "success" };
	} catch (error) {
		console.error("Failed to insert institution:", error);

		// Log to Telegram with error details
		try {
			await logInstitutionSubmissionFailure({
				error: error instanceof Error ? error.message : String(error),
				institutionName: parsed?.data?.name,
				category: parsed?.data?.category,
				state: parsed?.data?.state,
				city: parsed?.data?.city,
				contributorName: user?.name || undefined,
				contributorEmail: user?.email,
				errorType: "Database insertion failure",
			});
		} catch (telegramError) {
			console.error(
				"Failed to log submission failure to Telegram:",
				telegramError,
			);
		}

		return {
			status: "error",
			errors: {
				general: [
					"Gagal menyimpan sumbangan anda. Sila cuba lagi atau hubungi kami.",
				],
			},
		};
	}
}
