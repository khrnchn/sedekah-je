import assert from "node:assert/strict";
import { test } from "node:test";
import { makePayload } from "./__fixtures__/review-records";
import {
	assessmentCardSummary,
	formatAssessmentReport,
	formatAssessmentUnavailable,
} from "./review-assessment-copy";

const assessment = {
	imageType: "physical_photo" as const,
	visibleInstitution: "Surau Ar Rahim",
	visibleLocation: "",
	recipientRelationship: "unclear" as const,
	conflicts: [
		"Locally decoded DuitNow recipient is unavailable or invalid; image text alone cannot confirm ownership.",
	],
	explanation: "A laminated QR is mounted above the surau sign.",
};

test("missing-QR report says what happened and which review action to take", () => {
	const text = formatAssessmentReport({
		id: 2943,
		name: "Surau Ar Rahim",
		category: "surau",
		qrContent: null,
		assessment,
	});
	assert.match(text, /#2943 · Surau Ar Rahim/);
	assert.match(text, /Needs a QR check before approval/);
	assert.match(text, /Payment recipient: Not verified/);
	assert.match(text, /Open \/find 2943 → Choose Retry\/replace QR/);
	assert.match(text, /Location shown: Not visible/);
	for (const jargon of [
		"physical_photo",
		"recipientRelationship",
		"Locally decoded",
		"Conflicts:",
	])
		assert.equal(text.includes(jargon), false);
	assert.match(assessmentCardSummary(assessment, null), /Check QR recipient/);
});

test("graphic and personal-recipient reports point to the right evidence", () => {
	const graphic = formatAssessmentReport({
		id: 91,
		name: "Maahad Amanah",
		category: "tahfiz",
		qrContent: makePayload("MAAHAD AMANAH"),
		assessment: {
			...assessment,
			imageType: "digital_artwork",
			recipientRelationship: "institution",
			conflicts: [],
		},
	});
	assert.match(graphic, /Digital graphic/);
	assert.match(graphic, /Check the official source URL/);
	const personal = formatAssessmentReport({
		id: 92,
		name: "Surau Amanah",
		category: "surau",
		qrContent: makePayload("PERSONAL ACCOUNT"),
		assessment: {
			...assessment,
			recipientRelationship: "individual",
			conflicts: ["Name differs"],
		},
	});
	assert.match(personal, /Do not approve a personal account/);
	assert.match(personal, /Other concerns: Name differs/);
	assert.match(
		formatAssessmentUnavailable(92),
		/review manually or choose Retry analysis/,
	);
});
