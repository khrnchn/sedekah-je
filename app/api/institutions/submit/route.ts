import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { institutions } from "@/db/institutions";
import { users } from "@/db/users";
import {
	categories as validCategories,
	states as validStates,
} from "@/lib/institution-constants";
import {
	geocodeInstitutionWithFallback,
	reverseGeocodeInstitution,
	reverseGeocodeWithGoogle,
} from "@/lib/integrations/geocode";
import { r2Storage } from "@/lib/integrations/r2-client";
import { notifyInstitutionSubmission } from "@/lib/integrations/telegram/review-bot";
import { decodeQrFromBuffer } from "@/lib/qr-decode";
import { isToyyibpay } from "@/lib/qr-utils";
import {
	checkSubmissionRateLimit,
	SUBMISSIONS_PER_DAY,
} from "@/lib/queries/institution-submission-limit";
import { slugify } from "@/lib/utils";

/**
 * Allowed origins for the browser extension.
 * EXTENSION_ID is set via env var once the extension is published.
 * During development, all chrome-extension:// origins are allowed.
 */
function isAllowedOrigin(origin: string): boolean {
	// Dev: localhost
	if (origin === "http://localhost:3000" || origin === "http://localhost:3003")
		return true;

	// Chrome extension
	if (!origin.startsWith("chrome-extension://")) return false;

	const pinnedId = process.env.EXTENSION_ID;
	if (pinnedId) {
		// Production: only allow the specific published extension
		return origin === `chrome-extension://${pinnedId}`;
	}

	// Dev: allow any extension origin
	return true;
}

function getCorsHeaders(origin: string | null) {
	const headers: Record<string, string> = {
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Credentials": "true",
	};

	if (origin && isAllowedOrigin(origin)) {
		headers["Access-Control-Allow-Origin"] = origin;
	}

	return headers;
}

export async function OPTIONS(request: NextRequest) {
	const origin = request.headers.get("origin");
	return new NextResponse(null, {
		status: 204,
		headers: getCorsHeaders(origin),
	});
}

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

export async function POST(request: NextRequest) {
	const origin = request.headers.get("origin");
	const cors = getCorsHeaders(origin);

	function json(body: Record<string, unknown>, status = 200) {
		return NextResponse.json(body, { status, headers: cors });
	}

	// --- Authenticate: partner API key (server to server) or session cookie
	const apiKeyHeader = request.headers.get("x-api-key");
	let partner: { id: string; name: string } | null = null;
	let sessionUser: { id: string; isAdmin: boolean } | null = null;

	if (apiKeyHeader) {
		const result = await auth.api.verifyApiKey({
			// Permissions can only be set server side, so this rejects any key
			// not issued by scripts/partner-api-key.ts.
			body: { key: apiKeyHeader, permissions: { submissions: ["create"] } },
		});
		if (!result.valid || !result.key) {
			if (result.error?.code === "RATE_LIMITED") {
				return json(
					{
						status: "error",
						code: "rate_limited",
						message: "Partner daily request limit reached.",
					},
					429,
				);
			}
			return json(
				{
					status: "error",
					code: "invalid_api_key",
					message: "Invalid, disabled or expired API key.",
				},
				401,
			);
		}
		partner = {
			id: result.key.userId,
			name: result.key.name ?? result.key.userId,
		};
	} else {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return json(
				{
					status: "error",
					message: "Not authenticated. Please sign in to sedekah.je first.",
				},
				401,
			);
		}
		sessionUser = {
			id: session.user.id,
			isAdmin: session.user.role === "admin",
		};
	}

	// --- Parse form data
	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return json({ status: "error", message: "Invalid form data." }, 400);
	}

	const name = (formData.get("name") as string | null)?.trim();
	const category = formData.get("category") as string | null;
	const state = formData.get("state") as string | null;
	const city = (formData.get("city") as string | null)?.trim();
	const clientQrContent = (formData.get("qrContent") as string | null)?.trim();
	const sourceUrl = (formData.get("sourceUrl") as string | null)?.trim();
	const qrImageFile = formData.get("qrImage") as File | null;
	let address = (formData.get("address") as string | null)?.trim() || undefined;

	// --- Validate required fields
	if (!name) {
		return json({ status: "error", message: "Name is required." }, 400);
	}
	if (
		!category ||
		!validCategories.includes(category as (typeof validCategories)[number])
	) {
		return json({ status: "error", message: "Invalid category." }, 400);
	}
	if (!state || !validStates.includes(state as (typeof validStates)[number])) {
		return json({ status: "error", message: "Invalid state." }, 400);
	}
	if (!city) {
		return json({ status: "error", message: "City is required." }, 400);
	}

	// --- Optional coordinates, both or neither
	let coords: [number, number] | undefined;
	const lat = (formData.get("lat") as string | null)?.trim();
	const lon = (formData.get("lon") as string | null)?.trim();
	if (lat || lon) {
		const latNum = Number(lat);
		const lonNum = Number(lon);
		if (
			!lat ||
			!lon ||
			!Number.isFinite(latNum) ||
			!Number.isFinite(lonNum) ||
			latNum < -90 ||
			latNum > 90 ||
			lonNum < -180 ||
			lonNum > 180
		) {
			return json({ status: "error", message: "Invalid coordinates." }, 400);
		}
		coords = [latNum, lonNum];
	}

	// --- Resolve contributor. Partner submissions are credited to the
	// individual by email, matching an existing user or creating one at insert.
	let contributorId: string | undefined = sessionUser?.id;
	let newSubmitter: { email: string; name: string } | undefined;

	if (partner) {
		const submitterEmail = (formData.get("submitterEmail") as string | null)
			?.trim()
			.toLowerCase();
		const submitterName = (
			formData.get("submitterName") as string | null
		)?.trim();

		if (
			!submitterEmail ||
			!z.string().email().max(255).safeParse(submitterEmail).success
		) {
			return json(
				{ status: "error", message: "Valid submitterEmail is required." },
				400,
			);
		}
		if (!submitterName || submitterName.length > 255) {
			return json(
				{ status: "error", message: "submitterName is required." },
				400,
			);
		}

		const [existingUser] = await db
			.select({ id: users.id, banned: users.banned })
			.from(users)
			.where(eq(users.email, submitterEmail))
			.limit(1);

		if (existingUser?.banned) {
			return json(
				{
					status: "error",
					code: "submitter_banned",
					message: "This submitter is not allowed to contribute.",
				},
				403,
			);
		}
		contributorId = existingUser?.id;
		if (!existingUser) {
			newSubmitter = { email: submitterEmail, name: submitterName };
		}
	}

	// --- Rate limit per contributor (admins skip it; a new submitter has no history)
	if (contributorId) {
		const rateLimit = await checkSubmissionRateLimit(
			contributorId,
			sessionUser?.isAdmin ?? false,
		);
		if (rateLimit.limited) {
			return json(
				{
					status: "error",
					code: "rate_limited",
					message: `Rate limit: max ${SUBMISSIONS_PER_DAY} submissions per day.`,
					retryAfter: rateLimit.cooldownEndsAt.toISOString(),
				},
				429,
			);
		}
	}

	// --- Require a QR image
	if (!qrImageFile || qrImageFile.size === 0) {
		return json({ status: "error", message: "QR image is required." }, 400);
	}
	if (qrImageFile.size > 5 * 1024 * 1024) {
		return json({ status: "error", message: "Image too large. Max 5MB." }, 400);
	}
	if (!qrImageFile.type.startsWith("image/")) {
		return json({ status: "error", message: "File must be an image." }, 400);
	}

	// --- Decode QR on the server. Partners must send a readable QR; the
	// extension may fall back to the content it decoded in the browser.
	const qrBuffer = Buffer.from(await qrImageFile.arrayBuffer());
	let qrContent = await decodeQrFromBuffer(qrBuffer);
	if (!qrContent && !partner) qrContent = clientQrContent || null;

	if (!qrContent && partner) {
		return json(
			{
				status: "error",
				code: "unreadable_qr",
				message: "Could not decode a QR code from the image.",
			},
			422,
		);
	}

	// --- Duplicate QR content check (before upload to avoid orphaned objects)
	if (qrContent) {
		const [existing] = await db
			.select({ id: institutions.id })
			.from(institutions)
			.where(eq(institutions.qrContent, qrContent))
			.limit(1);

		if (existing) {
			return json(
				{
					status: "error",
					code: "duplicate_qr",
					message: "This QR code already exists in the system.",
				},
				409,
			);
		}
	}

	// --- Upload QR image to R2
	let qrImageUrl: string;
	try {
		qrImageUrl = await r2Storage.uploadFile(qrBuffer, qrImageFile.name);
	} catch (error) {
		console.error("R2 upload failed:", error);
		return json({ status: "error", message: "Failed to upload image." }, 500);
	}

	// --- Generate slug
	const slug = await generateUniqueSlug(name);

	// --- Geocode (Google Maps first, Nominatim fallback)
	if (!coords) {
		const geocoded = await geocodeInstitutionWithFallback(name, city, state);
		if (geocoded) coords = geocoded;
	}

	// --- Reverse geocode address from coords when missing
	if (!address && coords) {
		address =
			(await reverseGeocodeWithGoogle(coords[0], coords[1])) ??
			(await reverseGeocodeInstitution(coords[0], coords[1]))?.addressLine ??
			undefined;
	}

	// --- Insert into DB
	try {
		const newId = await db.transaction(async (tx) => {
			let resolvedContributorId = contributorId;
			if (newSubmitter && partner) {
				// A concurrent submission may have created the same submitter
				await tx
					.insert(users)
					.values({
						id: generateId(),
						email: newSubmitter.email,
						name: newSubmitter.name,
						createdVia: partner.name,
					})
					.onConflictDoNothing({ target: users.email });
				const [submitter] = await tx
					.select({ id: users.id })
					.from(users)
					.where(eq(users.email, newSubmitter.email))
					.limit(1);
				resolvedContributorId = submitter.id;
			}

			const [inserted] = await tx
				.insert(institutions)
				.values({
					name,
					slug,
					category: category as (typeof validCategories)[number],
					state: state as (typeof validStates)[number],
					city,
					address,
					qrImage: qrImageUrl,
					qrContent: qrContent || undefined,
					coords,
					sourceUrl: sourceUrl || undefined,
					contributorId: resolvedContributorId,
					partnerId: partner?.id,
					status: "pending",
					supportedPayment: [isToyyibpay(qrContent) ? "toyyibpay" : "duitnow"],
				})
				.returning({ id: institutions.id });
			contributorId = resolvedContributorId;
			return inserted.id;
		});

		// Log to Telegram
		try {
			await notifyInstitutionSubmission(newId);
		} catch (telegramError) {
			console.error("Telegram log failed:", telegramError);
		}

		// Revalidate caches
		revalidatePath("/my-contributions", "page");
		revalidatePath("/admin/institutions/pending", "page");
		revalidateTag("institutions-count", "max");
		revalidateTag("pending-institutions", "max");
		revalidateTag(`user_contributions_count:${contributorId}`, "max");

		return json({ status: "success", id: newId });
	} catch (error) {
		console.error("DB insert failed:", error);
		return json(
			{ status: "error", message: "Failed to save institution." },
			500,
		);
	}
}
