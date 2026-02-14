/**
 * Classify QR code payment method by dominant color analysis
 *
 * - Boost QR: Red/white with heart logo -> supported_payment = ["boost"]
 * - DuitNow QR: Pink/magenta themed -> supported_payment = ["duitnow"]
 *
 * Usage: bun scripts/classify-qr-payment.ts [--dry-run]
 */

import { Pool } from "pg";
import sharp from "sharp";
import { env } from "../env";

const pool = new Pool({ connectionString: env.DATABASE_URL });
const DRY_RUN = process.argv.includes("--dry-run");
type InstitutionRow = {
	id: number;
	name: string;
	qr_image: string | null;
	supported_payment: string[] | null;
};

async function classifyImage(
	url: string | null,
): Promise<{ type: "boost" | "duitnow" | "unknown"; debug: string }> {
	if (!url) return { type: "unknown", debug: "missing qr_image" };

	const response = await fetch(url);
	if (!response.ok)
		return { type: "unknown", debug: `HTTP ${response.status}` };

	const buffer = Buffer.from(await response.arrayBuffer());

	// Resize to small for speed, get raw pixels
	const { data, info } = await sharp(buffer)
		.resize(100, 100, { fit: "cover" })
		.raw()
		.toBuffer({ resolveWithObject: true });

	// Sample only colored (non-white, non-black) pixels
	let redPixels = 0;
	let magentaPixels = 0;
	let totalColored = 0;

	for (let i = 0; i < data.length; i += info.channels) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		// Skip near-white and near-black pixels
		if (r > 220 && g > 220 && b > 220) continue;
		if (r < 30 && g < 30 && b < 30) continue;

		totalColored++;

		// Red pixel: high R, low G, low B (Boost red ~#E83A2A)
		if (r > 150 && g < 100 && b < 100) {
			redPixels++;
		}
		// Magenta/pink pixel: high R, low G, moderate-high B (DuitNow pink)
		if (r > 150 && g < 100 && b > 100) {
			magentaPixels++;
		}
	}

	const debug = `colored=${totalColored} red=${redPixels} magenta=${magentaPixels}`;

	if (totalColored === 0) return { type: "unknown", debug };

	const redRatio = redPixels / totalColored;
	const magentaRatio = magentaPixels / totalColored;

	if (redRatio > 0.1 && redRatio > magentaRatio) {
		return { type: "boost", debug: `${debug} redR=${redRatio.toFixed(2)}` };
	}
	if (magentaRatio > 0.1 && magentaRatio > redRatio) {
		return {
			type: "duitnow",
			debug: `${debug} magR=${magentaRatio.toFixed(2)}`,
		};
	}

	// Grayscale QR (black on white) - default to duitnow
	return { type: "duitnow", debug: `${debug} (grayscale)` };
}

async function main() {
	try {
		const { rows } = await pool.query<InstitutionRow>(
			"SELECT id, name, qr_image, supported_payment FROM institutions WHERE source_url LIKE '%RHB-PDF%' ORDER BY id",
		);

		console.log(
			`Analyzing ${rows.length} QR images...${DRY_RUN ? " (DRY RUN)" : ""}\n`,
		);

		const updates: { boost: number[]; duitnow: number[]; unknown: number[] } = {
			boost: [],
			duitnow: [],
			unknown: [],
		};

		for (const row of rows) {
			const { type, debug } = await classifyImage(row.qr_image);
			updates[type].push(row.id);

			const current = row.supported_payment?.[0] || "none";
			const changed = current !== type ? " *CHANGE*" : "";
			console.log(
				`[${row.id}] ${type.padEnd(7)} | ${row.name} (${debug})${changed}`,
			);
		}

		console.log("\n--- Summary ---");
		console.log(`Boost:   ${updates.boost.length}`);
		console.log(`DuitNow: ${updates.duitnow.length}`);
		console.log(`Unknown: ${updates.unknown.length}`);

		if (DRY_RUN) {
			console.log("\nDry run - no changes made.");
			return;
		}

		// Update Boost institutions
		if (updates.boost.length > 0) {
			const res = await pool.query(
				"UPDATE institutions SET supported_payment = '[\"boost\"]'::jsonb WHERE id = ANY($1::int[]) RETURNING id",
				[updates.boost],
			);
			console.log(`\nUpdated ${res.rowCount} institutions to Boost`);
		}

		// Update DuitNow institutions (keep as-is, but ensure correct)
		if (updates.duitnow.length > 0) {
			const res = await pool.query(
				"UPDATE institutions SET supported_payment = '[\"duitnow\"]'::jsonb WHERE id = ANY($1::int[]) RETURNING id",
				[updates.duitnow],
			);
			console.log(`Updated ${res.rowCount} institutions to DuitNow`);
		}

		if (updates.unknown.length > 0) {
			console.log(
				`\nWARNING: ${updates.unknown.length} images could not be classified`,
			);
		}
	} finally {
		await pool.end();
	}
}

main().catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
