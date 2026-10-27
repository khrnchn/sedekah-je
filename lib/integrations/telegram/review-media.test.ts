import assert from "node:assert/strict";
import { test } from "node:test";
import { QRCodeSVG } from "qrcode.react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { recoverQrFromBuffer } from "@/lib/qr-decode";
import { makePayload } from "./__fixtures__/review-records";
import { createTelegramBotClient } from "./bot-api";
import { readLimitedImage, validateReviewImage } from "./review-media";

test("QR recovery decodes a poster and fails safely on a blank bounded image", async () => {
	const payload = makePayload();
	const svg = renderToStaticMarkup(
		createElement(QRCodeSVG, {
			value: payload,
			size: 420,
			includeMargin: true,
		}),
	);
	const png = await sharp(Buffer.from(svg)).png().toBuffer();
	const poster = await sharp({
		create: { width: 900, height: 1200, channels: 3, background: "#bbb" },
	})
		.composite([{ input: png, left: 230, top: 650 }])
		.png()
		.toBuffer();
	assert.equal(await recoverQrFromBuffer(poster), payload);
	const blank = await sharp({
		create: { width: 32, height: 32, channels: 3, background: "white" },
	})
		.png()
		.toBuffer();
	assert.equal(await recoverQrFromBuffer(blank), null);
});
test("review downloads validate bytes, declared size and streamed size", async () => {
	await assert.rejects(() => validateReviewImage(Buffer.from("not an image")));
	await assert.rejects(
		() =>
			readLimitedImage(
				new Response("small", { headers: { "content-length": "20000000" } }),
			),
		/10 MB/,
	);
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(new Uint8Array(10 * 1024 * 1024 + 1));
			controller.close();
		},
	});
	await assert.rejects(() => readLimitedImage(new Response(stream)), /10 MB/);
	const image = await sharp({
		create: { width: 4, height: 4, channels: 3, background: "white" },
	})
		.png()
		.toBuffer();
	assert.equal(await validateReviewImage(image), "png");
});
test("Telegram getFile download uses trusted file endpoint and validates image bytes", async () => {
	const image = await sharp({
		create: { width: 4, height: 4, channels: 3, background: "white" },
	})
		.png()
		.toBuffer();
	const original = globalThis.fetch;
	let calls = 0;
	globalThis.fetch = async (url, init) => {
		calls++;
		if (calls === 1) {
			assert.match(
				String(url),
				/^https:\/\/api.telegram.org\/botfake-token\/getFile$/,
			);
			assert.match(String(init?.body), /test-photo/);
			return Response.json({
				ok: true,
				result: { file_path: "photos/test.png", file_size: image.length },
			});
		}
		assert.match(
			String(url),
			/^https:\/\/api.telegram.org\/file\/botfake-token\/photos\/test.png$/,
		);
		return new Response(image);
	};
	try {
		assert.deepEqual(
			await createTelegramBotClient("fake-token").downloadPhoto("test-photo"),
			image,
		);
	} finally {
		globalThis.fetch = original;
	}
});

test(
	"QR recovery preserves a small QR on a high-resolution poster",
	{ timeout: 20000 },
	async () => {
		const payload = makePayload();
		const svg = renderToStaticMarkup(
			createElement(QRCodeSVG, {
				value: payload,
				size: 180,
				includeMargin: true,
			}),
		);
		const qr = await sharp(Buffer.from(svg)).png().toBuffer();
		const poster = await sharp({
			create: { width: 6000, height: 3000, channels: 3, background: "white" },
		})
			.composite([{ input: qr, left: 4000, top: 1500 }])
			.png()
			.toBuffer();
		assert.equal(await recoverQrFromBuffer(poster), payload);
	},
);
