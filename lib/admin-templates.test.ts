import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRejectionReasonBucket } from "./admin-templates";

describe("getRejectionReasonBucket", () => {
	it("buckets duplicate rejections", () => {
		assert.equal(
			getRejectionReasonBucket(
				"Harap maaf, QR untuk masjid ini telah ada di website kami.",
			),
			"duplicate",
		);
		assert.equal(
			getRejectionReasonBucket("dah ada, duplicate entry"),
			"duplicate",
		);
	});

	it("buckets unclear QR rejections", () => {
		assert.equal(
			getRejectionReasonBucket(
				"Harap maaf, kandungan kod QR kurang jelas dan tidak dapat dibaca.",
			),
			"unclear_qr",
		);
	});

	it("buckets individual QR rejections", () => {
		assert.equal(
			getRejectionReasonBucket("QR code tidak dibenarkan atas nama individu"),
			"individual_qr",
		);
	});

	it("falls back to other for empty or unrecognized notes", () => {
		assert.equal(getRejectionReasonBucket(null), "other");
		assert.equal(getRejectionReasonBucket(""), "other");
		assert.equal(getRejectionReasonBucket("   "), "other");
		assert.equal(getRejectionReasonBucket("testing"), "other");
	});
});
