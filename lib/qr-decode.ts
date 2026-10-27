import jsQR from "jsqr";
import sharp from "sharp";

/**
 * Scale attempts, in measured order of effectiveness against real submissions.
 * Native first, then a 2x upscale for small or aliased QRs, then a downscale
 * for oversized poster photos, then a 3x upscale as a last resort.
 */
const SCALE_LADDER = [1, 2, 0.5, 3];

/** Skip a scale that would allocate an absurd raw RGBA buffer. */
const MAX_PIXELS = 40_000_000;

async function rgbaAtScale(
	buffer: Buffer,
	scale: number,
	width: number,
	height: number,
) {
	const targetWidth = Math.round(width * scale);
	const targetHeight = Math.round(height * scale);

	let pipeline = sharp(buffer).toColorspace("srgb");
	if (scale !== 1) {
		// Nearest keeps QR module edges square instead of blurring them.
		pipeline = pipeline.resize(targetWidth, targetHeight, {
			kernel: "nearest",
		});
	}

	const { data, info } = await pipeline
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	return {
		data: new Uint8ClampedArray(data),
		width: info.width,
		height: info.height,
	};
}

/**
 * Decode QR content from an image buffer.
 *
 * Uses jsQR rather than @zxing/library: measured against 15 real submitted
 * images, ZXing decoded 0 (with or without TRY_HARDER) while jsQR decoded 12
 * at native size and 14 across the scale ladder. Submissions are typically
 * phone photos of a poster where the QR is a small, slightly skewed region,
 * which is the case ZXing's plain QRCodeReader does not handle.
 *
 * @returns The decoded QR text, or null if every attempt fails.
 */
export const decodeQrFromBuffer = async (
	buffer: Buffer,
): Promise<string | null> => {
	let width: number | undefined;
	let height: number | undefined;
	try {
		const metadata = await sharp(buffer).metadata();
		width = metadata.width;
		height = metadata.height;
	} catch (err) {
		console.warn("QR decode failed to read metadata:", err);
		return null;
	}
	if (!width || !height) return null;

	for (const scale of SCALE_LADDER) {
		if (width * height * scale * scale > MAX_PIXELS) continue;
		try {
			const frame = await rgbaAtScale(buffer, scale, width, height);
			const hit = jsQR(frame.data, frame.width, frame.height, {
				inversionAttempts: "attemptBoth",
			});
			const text = hit?.data?.trim();
			if (text) return text;
		} catch {
			// try the next scale
		}
	}

	return null;
};

/** Bounded recovery for review: normal scales, contrast, then five overlapping crops. */
export async function recoverQrFromBuffer(
	buffer: Buffer,
): Promise<string | null> {
	const image = sharp(buffer, { limitInputPixels: 20_000_000 });
	const { width, height } = await image.metadata();
	if (!width || !height || width * height > 20_000_000) return null;
	// Resizing a large poster can erase a small, otherwise readable QR. Keep
	// one native attempt within the review pixel limit before reducing detail.
	if (width > 2000 || height > 2000) {
		const frame = await rgbaAtScale(buffer, 1, width, height);
		const hit = jsQR(frame.data, frame.width, frame.height, {
			inversionAttempts: "attemptBoth",
		});
		if (hit?.data?.trim()) return hit.data.trim();
	}
	// Cap the input to bound the number of raw pixels processed across attempts.
	const bounded = await image
		.resize({
			width: 2000,
			height: 2000,
			fit: "inside",
			withoutEnlargement: true,
		})
		.png()
		.toBuffer();
	const direct = await decodeQrFromBuffer(bounded);
	if (direct) return direct;
	const contrast = await sharp(bounded).normalize().sharpen().png().toBuffer();
	const hit = await decodeQrFromBuffer(contrast);
	if (hit) return hit;
	const meta = await sharp(bounded).metadata();
	const w = Math.floor((meta.width ?? 1) * 0.65),
		h = Math.floor((meta.height ?? 1) * 0.65);
	const right = (meta.width ?? 1) - w,
		bottom = (meta.height ?? 1) - h;
	for (const [left, top] of [
		[0, 0],
		[right, 0],
		[0, bottom],
		[right, bottom],
		[Math.floor(right / 2), Math.floor(bottom / 2)],
	]) {
		const crop = await sharp(bounded)
			.extract({ left, top, width: w, height: h })
			.normalize()
			.png()
			.toBuffer();
		const recovered = await decodeQrFromBuffer(crop);
		if (recovered) return recovered;
	}
	return null;
}
