import assert from "node:assert/strict";
import { test } from "node:test";
import { questSubmitSchema } from "@/app/quest/_lib/schema";

test("questMosqueId must be all digits", () => {
	assert.equal(
		questSubmitSchema.safeParse({ questMosqueId: "12junk" }).success,
		false,
	);
	const parsed = questSubmitSchema.safeParse({ questMosqueId: "12" });
	assert.ok(parsed.success);
	assert.equal(parsed.data.questMosqueId, 12);
});

test("sourceUrl must be http or https", () => {
	assert.equal(
		questSubmitSchema.safeParse({ questMosqueId: "1", sourceUrl: "ftp://x" })
			.success,
		false,
	);
	const parsed = questSubmitSchema.safeParse({
		questMosqueId: "1",
		sourceUrl: "https://example.com/post",
	});
	assert.ok(parsed.success);
	assert.equal(parsed.data.sourceUrl, "https://example.com/post");
});

test("empty optional fields become undefined", () => {
	const parsed = questSubmitSchema.safeParse({
		questMosqueId: "1",
		sourceUrl: "",
		qrContent: "  ",
	});
	assert.ok(parsed.success);
	assert.equal(parsed.data.sourceUrl, undefined);
	assert.equal(parsed.data.qrContent, undefined);
});
