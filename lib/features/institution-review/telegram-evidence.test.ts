import assert from "node:assert/strict";
import { test } from "node:test";
import {
	makePayload,
	makeRecord,
} from "@/lib/integrations/telegram/__fixtures__/review-records";
import {
	compareRecipient,
	crc16,
	inspectDuitNow,
	metres,
	operationVersion,
	similarInstitutionNames,
	telegramApprovalBlockers,
} from "./telegram-evidence";

test("DuitNow validates TLV, required fields, duplicate tags, byte lengths and CRC", () => {
	assert.equal(inspectDuitNow(makePayload()).valid, true);
	assert.equal(inspectDuitNow(makePayload()).checksum, "valid");
	const oldIndicator = makePayload().slice(0, -4).replace("000202", "000201");
	assert.equal(inspectDuitNow(oldIndicator + crc16(oldIndicator)).valid, false);
	assert.equal(
		inspectDuitNow(makePayload("MASJID ÉHSAN")).recipient,
		"MASJID ÉHSAN",
	);
	assert.equal(
		inspectDuitNow(`${makePayload().slice(0, -4)}0000`).valid,
		false,
	);
	for (const invalid of [
		null,
		"",
		"https://example.test/pay",
		"000201000201",
		"5909short",
	])
		assert.equal(inspectDuitNow(invalid).valid, false);
});
test("name comparisons are conservative with abbreviations, generic and truncated labels", () => {
	assert.equal(
		compareRecipient("Masjid Kg. Amanah", "MASJID KAMPUNG AMANAH"),
		"name matches; confirm ownership",
	);
	assert.match(compareRecipient("Masjid Amanah", "MASJID"), /manual/);
	assert.match(
		compareRecipient("Masjid Al-Istiqlal", "MASJID AL ISTI"),
		/truncated/,
	);
	assert.equal(similarInstitutionNames("Masjid UPM", "Masjid UPM"), true);
	assert.ok(metres([3.1, 101.6], [3.1001, 101.6]) < 300);
});
test("pre-AI approval needs complete QR/location data but no evidence attestation", () => {
	const row = makeRecord();
	assert.deepEqual(telegramApprovalBlockers(row, []), []);
	for (const category of ["masjid", "surau", "kebajikan", "tahfiz"] as const) {
		assert.deepEqual(telegramApprovalBlockers({ ...row, category }, []), []);
	}
	for (const updates of [
		{ qrImage: null },
		{ qrContent: null },
		{ address: " " },
		{ coords: null },
	]) {
		assert.ok(telegramApprovalBlockers({ ...row, ...updates }, []).length);
	}
	const before = operationVersion(row);
	row.city = "Shah Alam";
	assert.notEqual(operationVersion(row), before);
	assert.deepEqual(telegramApprovalBlockers(row, []), []);
});
test("format, recipient and fuzzy duplicate warnings remain advisory for manual review", () => {
	const row = makeRecord({ qrContent: "https://example.test/payment" });
	assert.deepEqual(telegramApprovalBlockers(row, []), []);
	const duplicate = {
		...makeRecord({ id: 706 }),
		reason: "similar_name" as const,
	};
	assert.deepEqual(telegramApprovalBlockers(row, [duplicate]), []);
	assert.deepEqual(
		telegramApprovalBlockers(row, [{ ...duplicate, reason: "nearby" }]),
		[],
	);
});
test("holds and exact payload duplicates still block approval", () => {
	const row = makeRecord({ reviewMetadata: { held: true } });
	assert.ok(telegramApprovalBlockers(row, []).some((b) => b.includes("held")));
	row.reviewMetadata = null;
	const duplicate = {
		...makeRecord({ id: 706 }),
		reason: "exact_payload" as const,
	};
	assert.ok(
		telegramApprovalBlockers(row, [duplicate]).some((b) =>
			b.includes("Exact payload duplicate"),
		),
	);
});
