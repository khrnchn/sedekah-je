/**
 * Browser-side QR decoding, the counterpart to the sharp-based
 * decodeQrFromBuffer in qr-decode.ts.
 *
 * A single decode attempt fails on a lot of real submissions, so this walks a
 * ladder of strategies. Decoder order matters: qr-scanner preprocesses better
 * for the common failure shape, a small or offset QR photographed off a
 * noticeboard, and ZXing picks up cases qr-scanner refuses.
 *
 * Decode the ORIGINAL file. Re-encoding or downscaling first destroys the
 * module edges this depends on.
 */

const ZXING_NORMALIZE_TARGET = 800;

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Failed to load image"));
		img.src = src;
	});
}

function scaledCanvas(
	image: HTMLImageElement,
	width: number,
	height: number,
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (ctx) {
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "high";
		ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
	}
	return canvas;
}

function readScanResult(result: unknown): string | null {
	if (typeof result === "object" && result !== null && "data" in result) {
		const data = (result as { data?: unknown }).data;
		if (typeof data === "string") return data.trim() || null;
	}
	return String(result ?? "").trim() || null;
}

async function scanWithQrScanner(
	source: Blob | HTMLCanvasElement,
): Promise<string | null> {
	const QrScanner = (await import("qr-scanner")).default;
	const result = await QrScanner.scanImage(source, {
		returnDetailedScanResult: true,
	});
	return readScanResult(result);
}

/**
 * Try every strategy in turn, return the first hit, or null if all of them
 * fail. Never throws for an undecodable image.
 */
export async function decodeQrFromImageBlob(
	blob: Blob,
): Promise<string | null> {
	const objectUrl = URL.createObjectURL(blob);

	try {
		// 1. qr-scanner on the untouched blob.
		try {
			const hit = await scanWithQrScanner(blob);
			if (hit) return hit;
		} catch {
			// fall through
		}

		// 2. qr-scanner on a 2x upscale, which reduces aliasing on small QRs.
		try {
			const image = await loadImage(objectUrl);
			const hit = await scanWithQrScanner(
				scaledCanvas(image, image.width * 2, image.height * 2),
			);
			if (hit) return hit;
		} catch {
			// fall through
		}

		// 3-5. ZXing: the image element, native-size canvas, then normalized.
		try {
			const { BrowserQRCodeReader } = await import("@zxing/browser");
			const reader = new BrowserQRCodeReader();
			const image = await loadImage(objectUrl);

			const attempts: Array<() => Promise<string | null>> = [
				async () => {
					const r = await reader.decodeFromImageElement(image);
					return r?.getText()?.trim() ?? null;
				},
				async () => {
					const r = await reader.decodeFromCanvas(
						scaledCanvas(image, image.width, image.height),
					);
					return r?.getText()?.trim() ?? null;
				},
				async () => {
					// Scale toward 800px from either direction: upscale a tiny QR,
					// downscale an oversized photo.
					const { width, height } = image;
					const scale =
						width < ZXING_NORMALIZE_TARGET || height < ZXING_NORMALIZE_TARGET
							? Math.max(
									ZXING_NORMALIZE_TARGET / width,
									ZXING_NORMALIZE_TARGET / height,
								)
							: Math.min(
									ZXING_NORMALIZE_TARGET / width,
									ZXING_NORMALIZE_TARGET / height,
								);
					const r = await reader.decodeFromCanvas(
						scaledCanvas(
							image,
							Math.round(width * scale),
							Math.round(height * scale),
						),
					);
					return r?.getText()?.trim() ?? null;
				},
			];

			for (const attempt of attempts) {
				try {
					const hit = await attempt();
					if (hit) return hit;
				} catch {
					// try the next strategy
				}
			}
		} catch {
			// ZXing itself failed to load or the image would not decode
		}

		return null;
	} finally {
		URL.revokeObjectURL(objectUrl);
	}
}
