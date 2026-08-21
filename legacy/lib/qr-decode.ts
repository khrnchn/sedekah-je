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
 * Converts the image to sRGB colorspace first (handles grayscale inputs that
 * would otherwise produce 2-channel GA data), then adds alpha to guarantee
 * 4-channel RGBA output. Strips alpha to produce RGB data compatible with
 * @zxing/library's RGBLuminanceSource.
 *
 * @returns The decoded QR text, or null if decoding fails.
 */
export const decodeQrFromBuffer = async (
	buffer: Buffer,
): Promise<string | null> => {
	try {
		const { data, info } = await sharp(buffer)
			.toColorspace("srgb")
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });

		if (info.channels !== 4) {
			return null;
		}

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
		const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
		const reader = new QRCodeReader();
		const result = reader.decode(binaryBitmap);

		return result?.getText() ?? null;
	} catch (err) {
		console.warn("QR decode failed:", err);
		return null;
	}
};
