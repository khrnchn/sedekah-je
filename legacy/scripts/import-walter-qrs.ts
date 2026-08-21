/**
 * Bulk-import Walter University QR images into `institutions` as pending rows.
 *
 * Usage:
 *   bun scripts/import-walter-qrs.ts [--dry-run] [--limit N] [--input DIR] [--no-quarantine]
 *
 * Env: DATABASE_URL, R2_*, OPENAI_API_KEY, optional GOOGLE_GEOCODING_API_KEY,
 *      optional BULK_IMPORT_CONTRIBUTOR_ID (Better Auth user id).
 *
 * QR decode uses upscaling, ZXing, and poster tile crops; tiny codes on busy
 * posters may still fail—volunteers can crop tightly and submit via /contribute.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
	BinaryBitmap,
	HybridBinarizer,
	QRCodeReader,
	RGBLuminanceSource,
} from "@zxing/library";
import { isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import jsQR from "jsqr";
import { Pool } from "pg";
import sharp, { type Sharp } from "sharp";
import { institutions as institutionsTable } from "../db/institutions";
import { env } from "../env";
import type { categories } from "../lib/institution-constants";
import {
	geocodeMalaysiaInstitutionByName,
	reverseGeocodeInstitution,
	reverseGeocodeWithGoogle,
} from "../lib/integrations/geocode";
import { r2Storage } from "../lib/integrations/r2-client";
import { isToyyibpay } from "../lib/qr-utils";
import { slugify } from "../lib/utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INPUT = path.join(__dirname, "data", "walter-university-qrs");
const REPORT_PATH = path.join(__dirname, "data", "walter-import-report.json");
const GEOCODE_DELAY_MS = 1100;
/** Space out vision calls to reduce OpenAI tokens-per-minute bursts (TPM). */
const OPENAI_DELAY_MS = 4000;
const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_MAX_ATTEMPTS = 8;
const SOURCE_URL = "walter-university-bulk-import";

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

function normalizeCategoryHint(
	raw: string | null | undefined,
): (typeof categories)[number] | null {
	if (!raw) return null;
	const t = raw.trim().toLowerCase();
	const allowed: (typeof categories)[number][] = [
		"masjid",
		"surau",
		"tahfiz",
		"kebajikan",
		"lain-lain",
	];
	if (allowed.includes(t as (typeof categories)[number])) {
		return t as (typeof categories)[number];
	}
	return null;
}

function resolveCategory(
	name: string,
	hint: string | null | undefined,
): (typeof categories)[number] {
	return normalizeCategoryHint(hint) ?? inferCategory(name);
}

function tryJsqrOnRgba(
	data: Buffer,
	width: number,
	height: number,
): string | null {
	if (width <= 0 || height <= 0) return null;
	const expected = width * height * 4;
	if (data.byteLength < expected) return null;
	const arr = new Uint8ClampedArray(
		data.buffer,
		data.byteOffset,
		width * height * 4,
	);
	const result = jsQR(arr, width, height, {
		inversionAttempts: "attemptBoth",
	});
	return result?.data?.trim() || null;
}

function tryZxingOnRgba(
	data: Buffer,
	width: number,
	height: number,
): string | null {
	try {
		const expected = width * height * 4;
		if (data.byteLength < expected) return null;
		const rgbData = new Uint8ClampedArray(width * height * 3);
		for (let i = 0, j = 0; j < rgbData.length; i += 4, j += 3) {
			rgbData[j] = data[i] ?? 0;
			rgbData[j + 1] = data[i + 1] ?? 0;
			rgbData[j + 2] = data[i + 2] ?? 0;
		}
		const luminanceSource = new RGBLuminanceSource(rgbData, width, height);
		const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
		const reader = new QRCodeReader();
		const result = reader.decode(binaryBitmap);
		return result.getText().trim() || null;
	} catch {
		return null;
	}
}

function tryDecodeRgbaFrame(
	data: Buffer,
	width: number,
	height: number,
): string | null {
	return (
		tryJsqrOnRgba(data, width, height) ?? tryZxingOnRgba(data, width, height)
	);
}

type PreprocessQr = (img: Sharp) => Sharp;

function buildGridExtractRegions(
	width: number,
	height: number,
	rows: number,
	cols: number,
): Array<{ left: number; top: number; width: number; height: number }> {
	const regions: Array<{
		left: number;
		top: number;
		width: number;
		height: number;
	}> = [];
	const cellW = width / cols;
	const cellH = height / rows;
	const ox = Math.max(2, Math.floor(cellW * 0.06));
	const oy = Math.max(2, Math.floor(cellH * 0.06));

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			let left = Math.floor(c * cellW) - ox;
			let top = Math.floor(r * cellH) - oy;
			let rw = Math.ceil(cellW) + 2 * ox;
			let rh = Math.ceil(cellH) + 2 * oy;
			left = Math.max(0, Math.min(left, width - 1));
			top = Math.max(0, Math.min(top, height - 1));
			rw = Math.min(rw, width - left);
			rh = Math.min(rh, height - top);
			if (rw >= 64 && rh >= 64) {
				regions.push({ left, top, width: rw, height: rh });
			}
		}
	}
	return regions;
}

/**
 * Posters often embed a tiny QR; jsQR on native resolution misses it.
 * Try upscales (nearest-neighbour keeps modules sharp) + light preprocessing,
 * ZXing on the same raster, then a 3×3 crop grid (QR often in a corner).
 */
async function decodeQrRasterPipeline(
	buffer: Buffer,
	options: {
		maxEdge: number;
		scales: number[];
		kernels: ReadonlyArray<keyof typeof sharp.kernel>;
		preprocessors: PreprocessQr[];
	},
): Promise<string | null> {
	const meta = await sharp(buffer).metadata();
	const w0 = meta.width ?? 0;
	const h0 = meta.height ?? 0;
	if (!w0 || !h0) return null;

	const { maxEdge, scales, kernels, preprocessors } = options;

	for (const scale of scales) {
		const nw = Math.round(w0 * scale);
		const nh = Math.round(h0 * scale);
		if (nw < 1 || nh < 1) continue;
		if (Math.max(nw, nh) > maxEdge) continue;

		for (const kernelName of kernels) {
			const kernel = sharp.kernel[kernelName];
			for (const pre of preprocessors) {
				try {
					let img = sharp(buffer).ensureAlpha();
					if (scale !== 1) {
						img = img.resize(nw, nh, {
							kernel,
							fit: "fill",
						});
					}
					img = pre(img);
					const { data, info } = await img
						.ensureAlpha()
						.raw()
						.toBuffer({ resolveWithObject: true });
					const hit = tryDecodeRgbaFrame(data, info.width, info.height);
					if (hit) return hit;
				} catch {
					// try next variant
				}
			}
		}
	}

	return null;
}

const FULL_QR_DECODE = {
	maxEdge: 12_000,
	scales: [1, 2, 3, 4, 5, 6, 8, 10, 12],
	kernels: ["nearest", "cubic"] as const,
	preprocessors: [
		(img: Sharp) => img,
		(img: Sharp) => img.greyscale().normalize().ensureAlpha(),
		(img: Sharp) =>
			img.greyscale().normalize().sharpen({ sigma: 0.9 }).ensureAlpha(),
	] satisfies PreprocessQr[],
};

const CROP_QR_DECODE = {
	maxEdge: 10_000,
	scales: [3, 4, 6, 8, 10, 12],
	kernels: ["nearest"] as const,
	preprocessors: [
		(img: Sharp) => img,
		(img: Sharp) => img.greyscale().normalize().ensureAlpha(),
	] satisfies PreprocessQr[],
};

async function decodeQrFromBuffer(buffer: Buffer): Promise<string | null> {
	const oriented = await sharp(buffer).rotate().toBuffer();

	let hit = await decodeQrRasterPipeline(oriented, FULL_QR_DECODE);
	if (hit) return hit;

	const meta = await sharp(oriented).metadata();
	const w = meta.width ?? 0;
	const h = meta.height ?? 0;
	if (w < 500 || h < 500) return null;

	for (const region of buildGridExtractRegions(w, h, 3, 3)) {
		try {
			const crop = await sharp(oriented).extract(region).png().toBuffer();
			hit = await decodeQrRasterPipeline(crop, CROP_QR_DECODE);
			if (hit) return hit;
		} catch {
			// invalid crop
		}
	}

	return null;
}

type VisionResult = {
	name: string;
	category_hint: string | null;
	notes: string | null;
};

function parseOpenAiRetryAfterMs(errText: string): number | null {
	const m = errText.match(/try again in ([\d.]+)\s*ms/i);
	if (!m?.[1]) return null;
	const n = Number.parseFloat(m[1]);
	return Number.isFinite(n) ? Math.ceil(n) + 250 : null;
}

async function extractInstitutionWithOpenAI(
	imageBuffer: Buffer,
	mime: string,
): Promise<VisionResult | null> {
	const apiKey = env.OPENAI_API_KEY;
	if (!apiKey) {
		console.error("OPENAI_API_KEY is not set.");
		return null;
	}

	const b64 = imageBuffer.toString("base64");
	const dataUrl = `data:${mime};base64,${b64}`;

	const body = {
		model: OPENAI_MODEL,
		response_format: { type: "json_object" as const },
		messages: [
			{
				role: "user" as const,
				content: [
					{
						type: "text" as const,
						text:
							"You are helping import Malaysian mosque/surau donation QR listings. " +
							"Read the image: it may show a DuitNow QR and text/signage with the institution name. " +
							"Return JSON only with keys: name (string, official institution name in Malay or English as shown), " +
							'category_hint (one of: "masjid", "surau", "tahfiz", "kebajikan", "lain-lain", or null if unclear), ' +
							"notes (short string or null). " +
							"If the name is not visible, guess from context or use a short descriptive title. " +
							"Do not include newlines in name.",
					},
					{
						type: "image_url" as const,
						image_url: { url: dataUrl },
					},
				],
			},
		],
	};

	const payload = JSON.stringify(body);

	for (let attempt = 0; attempt < OPENAI_MAX_ATTEMPTS; attempt++) {
		const res = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: payload,
		});

		if (res.status === 429) {
			const errText = await res.text();
			const fromApi = parseOpenAiRetryAfterMs(errText);
			const waitMs = fromApi ?? Math.min(60_000, 2000 * 2 ** attempt);
			console.warn(
				`  OpenAI rate limit (429), waiting ${waitMs}ms (attempt ${attempt + 1}/${OPENAI_MAX_ATTEMPTS})`,
			);
			await sleep(waitMs);
			continue;
		}

		if (!res.ok) {
			const errText = await res.text();
			console.error("OpenAI error:", res.status, errText);
			return null;
		}

		const data = (await res.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		const raw = data.choices?.[0]?.message?.content;
		if (!raw) return null;

		try {
			const parsed = JSON.parse(raw) as VisionResult;
			if (typeof parsed.name !== "string" || !parsed.name.trim()) return null;
			return {
				name: parsed.name.trim(),
				category_hint: parsed.category_hint ?? null,
				notes: parsed.notes ?? null,
			};
		} catch {
			return null;
		}
	}

	console.error("OpenAI: exhausted retries after rate limits.");
	return null;
}

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

function parseArgs(argv: string[]) {
	let dryRun = false;
	let limit: number | undefined;
	let inputDir = DEFAULT_INPUT;
	let quarantine = true;

	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--dry-run") dryRun = true;
		else if (a === "--no-quarantine") quarantine = false;
		else if (a === "--limit" && argv[i + 1]) {
			limit = Number.parseInt(argv[i + 1], 10);
			i++;
		} else if (a === "--input" && argv[i + 1]) {
			inputDir = path.resolve(argv[i + 1]);
			i++;
		}
	}

	return { dryRun, limit, inputDir, quarantine };
}

type ReportEntry = {
	file: string;
	status: "inserted" | "skipped" | "error";
	detail?: string;
	institutionId?: number;
	qrPrefix?: string;
	name?: string;
	needsManualReview?: boolean;
};

function moveToQuarantine(
	src: string,
	sub: "no-qr" | "duplicate",
	inputDir: string,
) {
	const dir = path.join(inputDir, "_quarantine", sub);
	fs.mkdirSync(dir, { recursive: true });
	const dest = path.join(dir, path.basename(src));
	fs.renameSync(src, dest);
}

function mimeForPath(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	if (ext === ".png") return "image/png";
	if (ext === ".webp") return "image/webp";
	return "image/jpeg";
}

async function main() {
	const { dryRun, limit, inputDir, quarantine } = parseArgs(
		process.argv.slice(2),
	);

	const connectionString = env.DATABASE_URL;
	const pool = new Pool({ connectionString });
	const db = drizzle(pool);

	console.log("Walter QR bulk import");
	console.log("====================");
	console.log(`Input:   ${inputDir}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Report:  ${REPORT_PATH}\n`);

	if (!fs.existsSync(inputDir)) {
		console.error(`Input directory does not exist: ${inputDir}`);
		process.exit(1);
	}

	const allFiles = fs
		.readdirSync(inputDir)
		.filter((f) => {
			const lower = f.toLowerCase();
			return (
				(lower.endsWith(".jpeg") ||
					lower.endsWith(".jpg") ||
					lower.endsWith(".png")) &&
				!f.startsWith(".")
			);
		})
		.sort();

	const files = typeof limit === "number" ? allFiles.slice(0, limit) : allFiles;

	const [existingQrRows, existingSlugRows] = await Promise.all([
		db
			.select({ qrContent: institutionsTable.qrContent })
			.from(institutionsTable)
			.where(isNotNull(institutionsTable.qrContent)),
		db.select({ slug: institutionsTable.slug }).from(institutionsTable),
	]);

	const existingQr = new Set(
		existingQrRows
			.map((r) => r.qrContent?.trim())
			.filter((s): s is string => Boolean(s)),
	);
	const usedSlugs = new Set(existingSlugRows.map((r) => r.slug));

	const report: ReportEntry[] = [];
	const contributorId = env.BULK_IMPORT_CONTRIBUTOR_ID ?? null;

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		if (!file) continue;
		const prog = `[${i + 1}/${files.length}]`;
		const fullPath = path.join(inputDir, file);

		let buffer: Buffer;
		try {
			buffer = fs.readFileSync(fullPath);
		} catch (e) {
			report.push({
				file,
				status: "error",
				detail: e instanceof Error ? e.message : String(e),
			});
			console.log(`${prog} Error reading ${file}`);
			continue;
		}

		const qrContent = await decodeQrFromBuffer(buffer);
		if (!qrContent) {
			report.push({ file, status: "skipped", detail: "no_qr_decoded" });
			console.log(`${prog} Skip (no QR): ${file}`);
			if (quarantine) {
				try {
					moveToQuarantine(fullPath, "no-qr", inputDir);
				} catch (e) {
					console.warn("  quarantine failed:", e);
				}
			}
			continue;
		}

		if (existingQr.has(qrContent)) {
			report.push({
				file,
				status: "skipped",
				detail: "duplicate_qr_in_db",
				qrPrefix: qrContent.slice(0, 24),
			});
			console.log(`${prog} Skip (duplicate QR): ${file}`);
			if (quarantine) {
				try {
					moveToQuarantine(fullPath, "duplicate", inputDir);
				} catch (e) {
					console.warn("  quarantine failed:", e);
				}
			}
			continue;
		}

		const mime = mimeForPath(fullPath);
		await sleep(OPENAI_DELAY_MS);
		const vision = await extractInstitutionWithOpenAI(buffer, mime);
		if (!vision) {
			report.push({
				file,
				status: "error",
				detail: "openai_failed",
				qrPrefix: qrContent.slice(0, 24),
			});
			console.log(`${prog} Skip (OpenAI failed): ${file}`);
			continue;
		}

		const category = resolveCategory(vision.name, vision.category_hint);
		const baseSlug = slugify(vision.name);
		if (!baseSlug) {
			report.push({
				file,
				status: "error",
				detail: "empty_slug",
				qrPrefix: qrContent.slice(0, 24),
			});
			console.log(`${prog} Skip (empty slug): ${vision.name}`);
			continue;
		}
		const slug = ensureUniqueSlug(baseSlug, usedSlugs);

		const geo = await geocodeMalaysiaInstitutionByName(vision.name);
		await sleep(GEOCODE_DELAY_MS);

		if (!geo) {
			report.push({
				file,
				status: "error",
				detail: "geocode_failed",
				name: vision.name,
				qrPrefix: qrContent.slice(0, 24),
			});
			console.log(`${prog} Skip (geocode failed): ${vision.name}`);
			continue;
		}

		let address = geo.address;
		if (!address) {
			const g = await reverseGeocodeWithGoogle(geo.coords[0], geo.coords[1]);
			if (g) address = g;
			else {
				const rev = await reverseGeocodeInstitution(
					geo.coords[0],
					geo.coords[1],
				);
				address = rev?.addressLine ?? null;
			}
		}

		const needsManualReview =
			geo.needsManualReview || Boolean(vision.notes?.match(/manual|review/i));

		if (dryRun) {
			console.log(`${prog} Dry-run OK: ${vision.name} → ${slug}`);
			report.push({
				file,
				status: "inserted",
				detail: "dry_run",
				name: vision.name,
				needsManualReview,
				qrPrefix: qrContent.slice(0, 24),
			});
			continue;
		}

		let qrImageUrl: string | null = null;
		try {
			qrImageUrl = await r2Storage.uploadFile(buffer, file);
		} catch (e) {
			report.push({
				file,
				status: "error",
				detail: `r2_upload: ${e instanceof Error ? e.message : String(e)}`,
				name: vision.name,
			});
			console.log(`${prog} R2 upload failed: ${file}`);
			continue;
		}

		try {
			const [{ id: newId }] = await db
				.insert(institutionsTable)
				.values({
					name: vision.name.slice(0, 255),
					slug,
					description: null,
					category,
					state: geo.state,
					city: geo.city.slice(0, 100),
					address: address ?? null,
					qrImage: qrImageUrl,
					qrContent,
					supportedPayment: [
						isToyyibpay(qrContent) ? "toyyibpay" : "duitnow",
					] as const,
					coords: geo.coords,
					socialMedia: null,
					status: "pending",
					contributorId,
					contributorRemarks: vision.notes ? vision.notes.slice(0, 2000) : null,
					sourceUrl: SOURCE_URL,
					reviewedBy: null,
					reviewedAt: null,
					adminNotes: needsManualReview
						? "Bulk import: verify location/category."
						: null,
					isVerified: false,
					isActive: true,
				})
				.returning({ id: institutionsTable.id });

			existingQr.add(qrContent);
			console.log(`${prog} Inserted id=${newId} ${vision.name}`);
			report.push({
				file,
				status: "inserted",
				institutionId: newId,
				name: vision.name,
				needsManualReview,
				qrPrefix: qrContent.slice(0, 24),
			});
		} catch (e) {
			report.push({
				file,
				status: "error",
				detail: e instanceof Error ? e.message : String(e),
				name: vision.name,
			});
			console.log(`${prog} DB insert failed: ${file}`, e);
		}
	}

	fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
	fs.writeFileSync(
		REPORT_PATH,
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				dryRun,
				inputDir,
				entries: report,
			},
			null,
			2,
		),
		"utf-8",
	);

	const inserted = report.filter((r) => r.status === "inserted").length;
	const skipped = report.filter((r) => r.status === "skipped").length;
	const errors = report.filter((r) => r.status === "error").length;

	console.log("\n=====================");
	console.log("Summary");
	console.log("=====================");
	console.log(`Inserted / dry-run: ${inserted}`);
	console.log(`Skipped: ${skipped}`);
	console.log(`Errors: ${errors}`);
	console.log(`Report written to ${REPORT_PATH}`);

	await pool.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
