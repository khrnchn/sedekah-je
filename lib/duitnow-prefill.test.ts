import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readDuitNowPrefill } from "./duitnow-prefill";

const field = (tag: string, value: string) =>
	`${tag}${String(new TextEncoder().encode(value).length).padStart(2, "0")}${value}`;
const payload = (name: string, city: string) =>
	`${field("00", "01")}${field("53", "458")}${field("58", "MY")}${field("59", name)}${field("60", city)}${field("63", "A1B2")}`;

describe("readDuitNowPrefill", () => {
	it("fills name and category from the recipient name", () => {
		assert.deepEqual(
			readDuitNowPrefill(payload("MASJID AL-FALAH SHAH ALA", "SHAH ALAM")),
			{
				name: "Masjid Al-Falah Shah Ala",
				category: "masjid",
				state: undefined,
			},
		);
	});

	it("maps surau and tahfiz keywords", () => {
		assert.equal(
			readDuitNowPrefill(payload("SURAU AL-IKHLASIAH", "AMPANG"))?.category,
			"surau",
		);
		assert.equal(
			readDuitNowPrefill(payload("MAAHAD TAHFIZ AN-NUR", "KAJANG"))?.category,
			"tahfiz",
		);
		assert.equal(
			readDuitNowPrefill(payload("MSJD JAMEK TMN PCH PRIMA", "PUCHONG"))
				?.category,
			"masjid",
		);
	});

	it("uses tag 60 only when it is a state", () => {
		assert.equal(
			readDuitNowPrefill(payload("MASJID NURUL AMAN", "SABAH"))?.state,
			"Sabah",
		);
		assert.equal(
			readDuitNowPrefill(payload("MASJID NURUL AMAN", "Penang"))?.state,
			"Pulau Pinang",
		);
		assert.equal(
			readDuitNowPrefill(payload("MASJID NURUL AMAN", "MY"))?.state,
			undefined,
		);
	});

	it("skips personal account names", () => {
		assert.equal(readDuitNowPrefill(payload("AHMAD BIN ALI", "MY")), null);
		assert.deepEqual(readDuitNowPrefill(payload("AHMAD BIN ALI", "JOHOR")), {
			name: undefined,
			category: undefined,
			state: "Johor",
		});
	});

	it("returns null for payloads that are not TLV", () => {
		assert.equal(
			readDuitNowPrefill("https://toyyibpay.com/Derma-Masjid"),
			null,
		);
		assert.equal(readDuitNowPrefill("5930MASJID"), null);
	});
});
