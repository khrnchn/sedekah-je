import { describe, expect, test } from "bun:test";
import {
	getFridayCampaignDateStringMYT,
	isFridayCampaignWindowActiveMYT,
} from "./friday-campaign";

describe("Friday campaign MYT window", () => {
	test("is inactive before Thursday 7 PM MYT", () => {
		const beforeWindow = new Date("2026-04-30T10:59:00.000Z");

		expect(isFridayCampaignWindowActiveMYT(beforeWindow)).toBe(false);
		expect(getFridayCampaignDateStringMYT(beforeWindow)).toBe(null);
	});

	test("starts on Thursday 7 PM MYT for the next Friday date", () => {
		const windowStart = new Date("2026-04-30T11:00:00.000Z");

		expect(isFridayCampaignWindowActiveMYT(windowStart)).toBe(true);
		expect(getFridayCampaignDateStringMYT(windowStart)).toBe("2026-05-01");
	});

	test("stays active until Friday 6:59 PM MYT", () => {
		const beforeWindowEnd = new Date("2026-05-01T10:59:00.000Z");

		expect(isFridayCampaignWindowActiveMYT(beforeWindowEnd)).toBe(true);
		expect(getFridayCampaignDateStringMYT(beforeWindowEnd)).toBe("2026-05-01");
	});

	test("is inactive from Friday 7 PM MYT", () => {
		const afterWindow = new Date("2026-05-01T11:00:00.000Z");

		expect(isFridayCampaignWindowActiveMYT(afterWindow)).toBe(false);
		expect(getFridayCampaignDateStringMYT(afterWindow)).toBe(null);
	});
});
