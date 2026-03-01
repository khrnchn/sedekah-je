import { and, count, eq, gte } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { institutions } from "@/db/institutions";
import { geocodeInstitutionWithFallback } from "@/lib/geocode";
import {
	categories as validCategories,
	states as validStates,
} from "@/lib/institution-constants";
import { r2Storage } from "@/lib/r2-client";
import { logNewInstitution } from "@/lib/telegram";
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

	// --- Authenticate via Better Auth session cookie
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

	const user = session.user;
	const contributorId = user.id;
	const isAdmin = user.role === "admin";

	// --- Rate limit (skip for admins)
	if (!isAdmin) {
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
			return json(
				{ status: "error", message: "Rate limit: max 3 submissions per day." },
				429,
			);
		}
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
	const qrContent = (formData.get("qrContent") as string | null)?.trim();
	const sourceUrl = (formData.get("sourceUrl") as string | null)?.trim();
	const qrImageFile = formData.get("qrImage") as File | null;

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

	// --- Require QR image
	if (!qrImageFile || qrImageFile.size === 0) {
		return json({ status: "error", message: "QR image is required." }, 400);
	}

	// --- Duplicate QR content check
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
					message: "This QR code already exists in the system.",
				},
				409,
			);
		}
	}

	// --- Upload QR image to R2
	let qrImageUrl: string;
	try {
		if (qrImageFile.size > 5 * 1024 * 1024) {
			return json(
				{ status: "error", message: "Image too large. Max 5MB." },
				400,
			);
		}
		if (!qrImageFile.type.startsWith("image/")) {
			return json({ status: "error", message: "File must be an image." }, 400);
		}

		const buffer = Buffer.from(await qrImageFile.arrayBuffer());
		qrImageUrl = await r2Storage.uploadFile(buffer, qrImageFile.name);
	} catch (error) {
		console.error("R2 upload failed:", error);
		return json({ status: "error", message: "Failed to upload image." }, 500);
	}

	// --- Generate slug
	const slug = await generateUniqueSlug(name);

	// --- Geocode (Google Maps first, Nominatim fallback)
	let coords: [number, number] | undefined;
	const geocoded = await geocodeInstitutionWithFallback(name, city, state);
	if (geocoded) coords = geocoded;

	// --- Insert into DB
	try {
		const [{ id: newId }] = await db
			.insert(institutions)
			.values({
				name,
				slug,
				category: category as (typeof validCategories)[number],
				state: state as (typeof validStates)[number],
				city,
				qrImage: qrImageUrl,
				qrContent: qrContent || undefined,
				coords,
				sourceUrl: sourceUrl || undefined,
				contributorId,
				status: "pending",
				supportedPayment: ["duitnow"],
			})
			.returning({ id: institutions.id });

		// Log to Telegram
		try {
			await logNewInstitution({
				id: newId.toString(),
				name,
				category,
				state,
				city,
				contributorName: user.name || "Unknown",
				contributorEmail: user.email,
			});
		} catch (telegramError) {
			console.error("Telegram log failed:", telegramError);
		}

		// Revalidate caches
		revalidatePath("/my-contributions", "page");
		revalidatePath("/admin/institutions/pending", "page");
		revalidateTag("institutions-count");
		revalidateTag("pending-institutions");
		revalidateTag(`user_contributions_count:${contributorId}`);

		return json({ status: "success", id: newId });
	} catch (error) {
		console.error("DB insert failed:", error);
		return json(
			{ status: "error", message: "Failed to save institution." },
			500,
		);
	}
}
