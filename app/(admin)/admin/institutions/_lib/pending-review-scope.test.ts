import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	getPendingListHref,
	getPendingReviewHref,
	shouldIncludeAutomated,
} from "./pending-review-scope";

describe("pending review scope", () => {
	it("hides automated imports when the URL does not opt in", () => {
		assert.equal(shouldIncludeAutomated(undefined), false);
		assert.equal(shouldIncludeAutomated("false"), false);
		assert.equal(shouldIncludeAutomated(["true"]), false);
	});

	it("includes automated imports when the URL explicitly opts in", () => {
		assert.equal(shouldIncludeAutomated("true"), true);
	});

	it("preserves the default scope without a query parameter", () => {
		assert.equal(getPendingListHref(false), "/admin/institutions/pending");
		assert.equal(
			getPendingReviewHref(42, false),
			"/admin/institutions/pending/42",
		);
	});

	it("carries the include-automated scope through list and detail URLs", () => {
		assert.equal(
			getPendingListHref(true),
			"/admin/institutions/pending?includeAutomated=true",
		);
		assert.equal(
			getPendingReviewHref(42, true),
			"/admin/institutions/pending/42?includeAutomated=true",
		);
	});
});
