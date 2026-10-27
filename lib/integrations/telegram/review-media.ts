import sharp from "sharp";
import { env } from "@/env";
export const MAX_REVIEW_IMAGE_BYTES = 10 * 1024 * 1024;
export async function readLimitedImage(response: Response): Promise<Buffer> {
	if (!response.ok || !response.body)
		throw new Error("Image download unavailable");
	if (Number(response.headers.get("content-length")) > MAX_REVIEW_IMAGE_BYTES)
		throw new Error("Image exceeds 10 MB");
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			size += value.length;
			if (size > MAX_REVIEW_IMAGE_BYTES) throw new Error("Image exceeds 10 MB");
			chunks.push(value);
		}
	} finally {
		await reader.cancel();
	}
	return Buffer.concat(chunks);
}
export async function validateReviewImage(buffer: Buffer) {
	if (!buffer.length || buffer.length > MAX_REVIEW_IMAGE_BYTES)
		throw new Error("Invalid image size");
	const meta = await sharp(buffer, { limitInputPixels: 20_000_000 }).metadata();
	if (
		!["jpeg", "png", "webp"].includes(meta.format ?? "") ||
		(meta.pages ?? 1) > 1
	)
		throw new Error("Use a single JPEG, PNG or WebP image");
	return meta.format as "jpeg" | "png" | "webp";
}
export async function fetchReviewImage(url: string) {
	const parsed = new URL(url);
	if (
		parsed.protocol !== "https:" ||
		parsed.origin !== new URL(env.R2_PUBLIC_URL).origin
	)
		throw new Error("Image origin is not allowed");
	const buffer = await readLimitedImage(
		await fetch(parsed, {
			redirect: "error",
			signal: AbortSignal.timeout(15_000),
		}),
	);
	await validateReviewImage(buffer);
	return buffer;
}
