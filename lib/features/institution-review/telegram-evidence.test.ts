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
	reviewVersion,
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
test("physical mosque posters require explicit recipient and display evidence", () => {
	const row = makeRecord();
	assert.ok(
		telegramApprovalBlockers(row, []).some((b) => b.includes("recipient")),
	);
	row.reviewMetadata = {
		evidence: {
			version: reviewVersion(row),
			recipientInstitution: true,
			physicalDisplay: true,
		},
	};
	assert.deepEqual(telegramApprovalBlockers(row, []), []);
	const before = operationVersion(row);
	row.city = "Shah Alam";
	assert.notEqual(operationVersion(row), before);
	assert.ok(telegramApprovalBlockers(row, []).length);
});
test("NGO/tahfiz official graphics pass after ownership and official source confirmation", () => {
	for (const category of ["kebajikan", "tahfiz"] as const) {
		const row = makeRecord({ category });
		row.reviewMetadata = {
			evidence: {
				version: reviewVersion(row),
				recipientInstitution: true,
				officialSource: "https://official.example.test/donate",
			},
		};
		assert.deepEqual(telegramApprovalBlockers(row, []), []);
		row.category = "masjid";
		assert.ok(row.reviewMetadata.evidence);
		row.reviewMetadata.evidence.version = reviewVersion(row);
		assert.ok(
			telegramApprovalBlockers(row, []).some((b) => b.includes("physical")),
		);
	}
});
test("individual recipients, missing payload, checksum failure, holds and duplicates remain guarded", () => {
	const row = makeRecord({ qrContent: makePayload("AHMAD BIN ALI") });
	assert.ok(telegramApprovalBlockers(row, []).length > 0);
	row.qrContent = null;
	assert.ok(
		telegramApprovalBlockers(row, []).some((b) => b.includes("checksum")),
	);
	row.qrContent = makePayload();
	row.reviewMetadata = {
		held: true,
		evidence: {
			version: reviewVersion(row),
			recipientInstitution: true,
			physicalDisplay: true,
		},
	};
	assert.ok(telegramApprovalBlockers(row, []).some((b) => b.includes("held")));
	row.reviewMetadata.held = false;
	const duplicate = {
		...makeRecord({ id: 706, name: "Masjid UPM" }),
		reason: "similar_name" as const,
		version: "fixture-duplicate-v1",
	};
	assert.ok(
		telegramApprovalBlockers(row, [duplicate]).some((b) =>
			b.includes("duplicates"),
		),
	);
	row.reviewMetadata.differentInstitutions = {
		version: reviewVersion(row),
		ids: [706],
		versions: { "706": "fixture-duplicate-v1" },
	};
	assert.deepEqual(telegramApprovalBlockers(row, [duplicate]), []);
	assert.ok(
		telegramApprovalBlockers(row, [{ ...duplicate, reason: "exact_payload" }])
			.length > 0,
	);
});
