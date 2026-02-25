import { describe, expect, it } from "bun:test";
import { buildStepsForRoute, getFallbackSelector } from "./steps";

describe("onboarding tour steps", () => {
	it("builds contribute steps with expected selectors and copy", () => {
		const steps = buildStepsForRoute("/contribute", 0);

		expect(steps).toHaveLength(3);
		expect(steps[0].element).toBe("[data-tour='contribute-location']");
		expect(steps[1].element).toBe("[data-tour='contribute-qr-upload']");
		expect(steps[2].element).toBe("[data-tour='contribute-submit']");
		expect(steps[0].popover?.title).toBe("Lokasi semasa");
	});

	it("uses fallback element resolver for rejected-step in my-contributions", () => {
		const [step] = buildStepsForRoute("/my-contributions", 2);
		expect(typeof step.element).toBe("function");

		const originalDocument = globalThis.document;
		const primaryEl = { id: "primary" };
		const fallbackEl = { id: "fallback" };
		const bodyEl = { id: "body" };

		try {
			globalThis.document = {
				querySelector(selector) {
					if (selector === "[data-tour='mycontrib-edit-rejected']")
						return primaryEl;
					if (selector === "[data-tour='mycontrib-tab-rejected']")
						return fallbackEl;
					return null;
				},
				body: bodyEl,
			};

			expect(step.element()).toBe(primaryEl);

			globalThis.document = {
				querySelector(selector) {
					if (selector === "[data-tour='mycontrib-edit-rejected']") return null;
					if (selector === "[data-tour='mycontrib-tab-rejected']")
						return fallbackEl;
					return null;
				},
				body: bodyEl,
			};

			expect(step.element()).toBe(fallbackEl);

			globalThis.document = {
				querySelector() {
					return null;
				},
				body: bodyEl,
			};

			expect(step.element()).toBe(bodyEl);
		} finally {
			globalThis.document = originalDocument;
		}
	});

	it("returns fallback selector only for tuple-based steps", () => {
		expect(getFallbackSelector("/my-contributions", 2)).toBe(
			"[data-tour='mycontrib-tab-rejected']",
		);
		expect(getFallbackSelector("/contribute", 0)).toBeUndefined();
	});
});
