/**
 * Import RHB-PDF dataset from HuggingFace (Issue #93)
 *
 * Populates institution data from ~120 Malaysian religious institutions with QR codes.
 * All imported institutions have status: "pending" for admin review.
 *
 * Usage: bun scripts/import-rhb-data.ts
 * Prerequisites: .env with DATABASE_URL, R2_* vars
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
import { drizzle } from "drizzle-orm/node-postgres";
import jsQR from "jsqr";
import { Pool } from "pg";
import sharp from "sharp";
import { institutions as institutionsTable } from "../db/institutions";
import { env } from "../env";
import { geocodeInstitution } from "../lib/geocode";
import type { categories } from "../lib/institution-constants";
import { states } from "../lib/institution-constants";
import { r2Storage } from "../lib/r2-client";
import { slugify } from "../lib/utils";

// --- Config ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data", "rhb");
const JSONL_URL =
	"https://huggingface.co/datasets/Hiraishin/RHB-PDF/resolve/main/rhb_pdf_extracted_cleaned.jsonl";
const ZIP_URL =
	"https://huggingface.co/datasets/Hiraishin/RHB-PDF/resolve/main/RHB-PDF-QR-CODES.zip";
const SOURCE_URL = "https://huggingface.co/datasets/Hiraishin/RHB-PDF";
const GEOCODE_DELAY_MS = 1100;
const BATCH_SIZE = 100;

// --- State mapping (special cases) ---
const STATE_ALIASES: Record<string, (typeof states)[number]> = {
	"Kuala Lumpur": "W.P. Kuala Lumpur",
	"WP Putrajaya": "W.P. Putrajaya",
	Seremban: "Negeri Sembilan",
};

// --- Category inference (keyword → category) ---
const CATEGORY_KEYWORDS: Array<{
	keywords: string[];
	category: (typeof categories)[number];
}> = [
	{ keywords: ["masjid"], category: "masjid" },
	{ keywords: ["surau"], category: "surau" },
	{ keywords: ["tahfiz", "maahad", "madrasah"], category: "tahfiz" },
	{
		keywords: ["kebajikan", "yatim", "pertubuhan", "tabung", "dana", "wakaf"],
		category: "kebajikan",
	},
];

function inferCategory(name: string): (typeof categories)[number] {
	const lower = name.toLowerCase();
	for (const { keywords, category } of CATEGORY_KEYWORDS) {
		if (keywords.some((kw) => lower.includes(kw))) return category;
	}
	return "lain-lain";
}

// --- Address parsing ---
type ParsedAddress = {
	name: string;
	state: (typeof states)[number];
	city: string;
	address: string;
};

function parseAddress(fullAddrCleaned: string): ParsedAddress | null {
	const segments = fullAddrCleaned
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	if (segments.length < 2) return null;

	const first = segments[0];
	if (first === undefined) return null;
	const name = first;

	// Find state: scan from end
	const stateSet = new Set(states);
	let state: (typeof states)[number] | null = null;
	let stateIdx = -1;

	for (let i = segments.length - 1; i >= 1; i--) {
		const seg = segments[i];
		if (seg === undefined) continue;
		// Strip leading postcode (e.g., "50450 Kuala Lumpur" → "Kuala Lumpur")
		const stripped = seg.replace(/^\d{5}\s*/, "").trim();
		const normalized = STATE_ALIASES[stripped] ?? stripped;
		if (stateSet.has(normalized as (typeof states)[number])) {
			state = normalized as (typeof states)[number];
			stateIdx = i;
			break;
		}
	}

	if (!state) return null;

	// City: from postcode segment (\d{5}\s+(.+)) or fallback to segment before state
	let city = "";
	for (let i = 1; i < stateIdx; i++) {
		const seg = segments[i];
		if (seg === undefined) continue;
		const match = seg.match(/^\d{5}\s+(.+)$/);
		if (match) {
			city = (match[1] ?? "").trim();
			break;
		}
	}
	if (!city && stateIdx >= 2) {
		city = segments[stateIdx - 1] ?? "Unknown";
	}
	if (!city) city = "Unknown";

	// Address: everything between name and state
	const addressParts = segments.slice(1, stateIdx);
	const address = addressParts.length > 0 ? addressParts.join(", ") : "";

	return { name, state, city, address };
}

// --- QR decode (jsQR handles red DuitNow QR codes better than @zxing/library) ---
async function decodeQrFromBuffer(buffer: Buffer): Promise<string | null> {
	try {
		const { data, info } = await sharp(buffer)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });

		const result = jsQR(
			new Uint8ClampedArray(data.buffer),
			info.width,
			info.height,
		);
		return result?.data || null;
	} catch {
		return null;
	}
}

// --- Slug uniqueness (DB + in-memory set for current batch) ---
function ensureUniqueSlug(baseSlug: string, usedSlugs: Set<string>): string {
	let candidate = baseSlug;
	let counter = 0;
	while (usedSlugs.has(candidate)) {
		counter++;
		candidate = `${baseSlug}-${counter}`;
	}
	usedSlugs.add(candidate);
	return candidate;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Main ---
interface JsonlEntry {
	full_addr_cleaned: string;
	filename: string;
}

async function main() {
	const connectionString = env.DATABASE_URL;
	const pool = new Pool({ connectionString });
	const db = drizzle(pool);

	console.log("RHB-PDF Import Script");
	console.log("=====================\n");

	// 1. Ensure data dir exists
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}

	const jsonlPath = path.join(DATA_DIR, "rhb_pdf_extracted_cleaned.jsonl");
	const zipPath = path.join(DATA_DIR, "RHB-PDF-QR-CODES.zip");

	// 2. Download JSONL
	if (!fs.existsSync(jsonlPath)) {
		console.log("Downloading JSONL...");
		const res = await fetch(JSONL_URL);
		if (!res.ok) throw new Error(`JSONL fetch failed: ${res.status}`);
		fs.writeFileSync(jsonlPath, Buffer.from(await res.arrayBuffer()));
		console.log("  Done.\n");
	} else {
		console.log("JSONL already downloaded.\n");
	}

	// 3. Download ZIP
	if (!fs.existsSync(zipPath)) {
		console.log("Downloading ZIP...");
		const res = await fetch(ZIP_URL);
		if (!res.ok) throw new Error(`ZIP fetch failed: ${res.status}`);
		fs.writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
		console.log("  Done.\n");
	} else {
		console.log("ZIP already downloaded.\n");
	}

	// 4. Parse JSONL
	const lines = fs.readFileSync(jsonlPath, "utf-8").split("\n").filter(Boolean);
	const entries: JsonlEntry[] = [];
	for (const line of lines) {
		try {
			const obj = JSON.parse(line) as JsonlEntry;
			if (obj.full_addr_cleaned && obj.filename) entries.push(obj);
		} catch {
			// Skip malformed lines
		}
	}
	console.log(`Parsed ${entries.length} entries from JSONL.\n`);

	// 5. Extract ZIP
	const zip = new AdmZip(zipPath);
	const zipEntries = zip.getEntries();
	const qrMap = new Map<string, Buffer>();
	for (const entry of zipEntries) {
		if (!entry.isDirectory && entry.entryName.endsWith(".png")) {
			qrMap.set(path.basename(entry.entryName), entry.getData() as Buffer);
		}
	}
	console.log(`Extracted ${qrMap.size} QR images from ZIP.\n`);

	// 6. Process each entry
	const toInsert: Array<{
		name: string;
		slug: string;
		category: (typeof categories)[number];
		state: (typeof states)[number];
		city: string;
		address: string;
		qrImage: string | null;
		qrContent: string | null;
		coords: [number, number] | null;
		status: "pending";
		sourceUrl: string;
		supportedPayment: ["duitnow"];
	}> = [];

	const failed: Array<{ entry: JsonlEntry; reason: string }> = [];

	// Preload existing slugs for uniqueness check
	const existingRows = await db
		.select({ slug: institutionsTable.slug })
		.from(institutionsTable);
	const usedSlugs = new Set(existingRows.map((r) => r.slug));

	for (let i = 0; i < entries.length; i++) {
		const entry = entries.at(i);
		if (!entry) continue;
		const prog = `[${i + 1}/${entries.length}]`;

		const parsed = parseAddress(entry.full_addr_cleaned);
		if (!parsed) {
			failed.push({ entry, reason: "Address parse failure" });
			console.log(`${prog} Skipped: address parse failure`);
			continue;
		}

		const category = inferCategory(parsed.name);
		const baseSlug = slugify(parsed.name);
		const slug = ensureUniqueSlug(baseSlug, usedSlugs);

		// QR
		const qrBuffer = qrMap.get(entry.filename);
		let qrImage: string | null = null;
		let qrContent: string | null = null;

		if (qrBuffer) {
			qrContent = await decodeQrFromBuffer(qrBuffer);
			if (!qrContent) {
				console.log(`${prog} QR decode failed for ${entry.filename}`);
			}
			qrImage = await r2Storage.uploadFile(qrBuffer, entry.filename);
		} else {
			console.log(`${prog} QR file missing: ${entry.filename}`);
		}

		// Geocode
		const coords = await geocodeInstitution(
			parsed.name,
			parsed.city,
			parsed.state,
		);
		if (!coords) {
			console.log(`${prog} Geocode failed for ${parsed.name}`);
		}

		await sleep(GEOCODE_DELAY_MS);

		toInsert.push({
			name: parsed.name,
			slug,
			category,
			state: parsed.state,
			city: parsed.city,
			address: parsed.address,
			qrImage,
			qrContent,
			coords,
			status: "pending",
			sourceUrl: SOURCE_URL,
			supportedPayment: ["duitnow"],
		});
	}

	// 7. Batch insert
	console.log(
		`\nInserting ${toInsert.length} institutions in batches of ${BATCH_SIZE}...`,
	);

	for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
		const batch = toInsert.slice(i, i + BATCH_SIZE);
		await db.insert(institutionsTable).values(
			batch.map((row) => ({
				...row,
				description: null,
				contributorId: null,
				contributorRemarks: null,
				reviewedBy: null,
				reviewedAt: null,
				adminNotes: null,
				isVerified: false,
				isActive: true,
			})),
		);
		console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} done.`);
	}

	// 8. Summary
	console.log("\n=====================");
	console.log("Summary");
	console.log("=====================");
	console.log(`Success: ${toInsert.length}`);
	console.log(`Failed: ${failed.length}`);
	if (failed.length > 0) {
		console.log("\nFailed entries:");
		for (const { entry, reason } of failed) {
			console.log(`  - ${entry.filename}: ${reason}`);
		}
	}

	await pool.end();
	console.log("\nDone.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
