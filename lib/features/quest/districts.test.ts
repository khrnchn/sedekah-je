import assert from "node:assert/strict";
import { test } from "node:test";
import {
	districtAt,
	districtBoundary,
	districtByName,
	districtBySlug,
	QUEST_DISTRICTS,
} from "./districts";

test("QUEST_DISTRICTS lists the nine Selangor districts", () => {
	assert.deepEqual(
		QUEST_DISTRICTS.map((d) => d.slug),
		[
			"gombak",
			"hulu-langat",
			"hulu-selangor",
			"klang",
			"kuala-langat",
			"kuala-selangor",
			"petaling",
			"sabak-bernam",
			"sepang",
		],
	);
});

test("districtBySlug and districtByName resolve known districts only", () => {
	assert.deepEqual(districtBySlug("hulu-langat"), {
		slug: "hulu-langat",
		name: "Hulu Langat",
	});
	assert.equal(districtByName("Kuala Selangor")?.slug, "kuala-selangor");
	assert.equal(districtBySlug("kuala-lumpur"), null);
	assert.equal(districtByName("petaling"), null);
	assert.equal(districtBoundary("sepang")?.properties.name, "Sepang");
});

test("districtAt finds the district containing a point", () => {
	// Shah Alam
	assert.equal(districtAt(3.0733, 101.5185), "petaling");
	// Klang town
	assert.equal(districtAt(3.0449, 101.4456), "klang");
	// Kajang
	assert.equal(districtAt(2.9927, 101.7909), "hulu-langat");
	// KLIA
	assert.equal(districtAt(2.7456, 101.7099), "sepang");
	// Kuala Kubu Bharu
	assert.equal(districtAt(3.5663, 101.6589), "hulu-selangor");
	// Sabak
	assert.equal(districtAt(3.7686, 100.9877), "sabak-bernam");
});

test("districtAt returns null outside Selangor", () => {
	// KLCC, Kuala Lumpur is an enclave inside Selangor
	assert.equal(districtAt(3.1579, 101.7123), null);
	// Seremban
	assert.equal(districtAt(2.7259, 101.9378), null);
	// Open sea west of Klang
	assert.equal(districtAt(3.0, 100.9), null);
});
