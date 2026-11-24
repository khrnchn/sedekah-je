import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const MAILERSEND_TEST_SECRET = "test_Am3L1GuOIc4blLUuHqAPxxwkZaJyEk8G";

export function verifyMailerSendSignature(
	body: string,
	signature: string | null,
	secret: string,
) {
	if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
	const expected = createHmac("sha256", secret).update(body, "utf8").digest();
	return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

const eventSchema = z.object({
	type: z.string(),
	created_at: z.string().datetime({ offset: true }),
	data: z.object({ message_id: z.string().min(1).max(255) }).optional(),
});

export function parseMailerSendEvent(body: string) {
	let raw: unknown;
	try {
		raw = JSON.parse(body);
	} catch {
		return null;
	}
	return eventSchema.safeParse(raw).data ?? null;
}
