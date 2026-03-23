import {
	BinaryBitmap,
	HybridBinarizer,
	QRCodeReader,
	RGBLuminanceSource,
} from "@zxing/library";
import sharp from "sharp";

/**
 * Decode QR code content from an image buffer using sharp + @zxing/library.
 *
 * Uses sharp to convert the image to raw RGBA pixel data, then strips the alpha
 * channel to produce RGB data compatible with @zxing/library's RGBLuminanceSource.
 * This approach is more reliable than browser-side canvas decoding because sharp
 * preserves full image fidelity without browser rendering variance.
 *
 * @returns The decoded QR text, or null if decoding fails.
 */
export async function decodeQrFromBuffer(
	buffer: Buffer,
): Promise<string | null> {
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

		return result?.getText() ?? null;
	} catch {
		return null;
	}
}
