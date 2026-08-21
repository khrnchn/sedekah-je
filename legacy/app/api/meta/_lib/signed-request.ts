import { createHmac, timingSafeEqual } from "node:crypto";

export type MetaSignedRequestPayload = {
	algorithm?: string;
	user_id?: string;
	app_scoped_user_id?: string;
	issued_at?: number;
	[key: string]: unknown;
};

function base64UrlToBuffer(value: string): Buffer {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const pad = normalized.length % 4;
	const padded = pad === 0 ? normalized : normalized + "=".repeat(4 - pad);
	return Buffer.from(padded, "base64");
}

export function verifyAndDecodeSignedRequest(
	signedRequest: string,
	appSecret: string,
): MetaSignedRequestPayload | null {
	const [encodedSig, encodedPayload] = signedRequest.split(".", 2);
	if (!encodedSig || !encodedPayload) return null;

	let payloadBuffer: Buffer;
	let expectedSig: Buffer;
	let providedSig: Buffer;

	try {
		payloadBuffer = base64UrlToBuffer(encodedPayload);
		expectedSig = createHmac("sha256", appSecret)
			.update(encodedPayload)
			.digest();
		providedSig = base64UrlToBuffer(encodedSig);
	} catch {
		return null;
	}

	if (
		expectedSig.length !== providedSig.length ||
		!timingSafeEqual(expectedSig, providedSig)
	) {
		return null;
	}

	try {
		const payload = JSON.parse(
			payloadBuffer.toString("utf8"),
		) as MetaSignedRequestPayload;
		const algorithm = String(payload.algorithm ?? "").toUpperCase();
		if (algorithm !== "HMAC-SHA256") return null;
		return payload;
	} catch {
		return null;
	}
}
