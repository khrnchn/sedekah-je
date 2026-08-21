import { describe, expect, it } from "bun:test";
import {
	DEFAULT_EMBED_SIZE,
	DEFAULT_EMBED_THEME,
	parseEmbedSize,
	parseEmbedTheme,
} from "./embed";

describe("parseEmbedSize", () => {
	it("accepts the supported sizes", () => {
		expect(parseEmbedSize("sm")).toBe("sm");
		expect(parseEmbedSize("md")).toBe("md");
		expect(parseEmbedSize("lg")).toBe("lg");
	});

	it("falls back to the default for unknown or missing values", () => {
		expect(parseEmbedSize(undefined)).toBe(DEFAULT_EMBED_SIZE);
		expect(parseEmbedSize("")).toBe(DEFAULT_EMBED_SIZE);
		expect(parseEmbedSize("xl")).toBe(DEFAULT_EMBED_SIZE);
	});

	it("rejects inherited Object properties", () => {
		for (const key of ["constructor", "toString", "__proto__", "valueOf"]) {
			expect(parseEmbedSize(key)).toBe(DEFAULT_EMBED_SIZE);
		}
	});

	it("maps the legacy compact flag onto the small size", () => {
		expect(parseEmbedSize(undefined, "true")).toBe("sm");
		expect(parseEmbedSize(undefined, "false")).toBe(DEFAULT_EMBED_SIZE);
		expect(parseEmbedSize("lg", "true")).toBe("lg");
	});
});

describe("parseEmbedTheme", () => {
	it("accepts the supported themes and falls back otherwise", () => {
		expect(parseEmbedTheme("dark")).toBe("dark");
		expect(parseEmbedTheme("auto")).toBe("auto");
		expect(parseEmbedTheme("neon")).toBe(DEFAULT_EMBED_THEME);
		expect(parseEmbedTheme(undefined)).toBe(DEFAULT_EMBED_THEME);
		expect(parseEmbedTheme("constructor")).toBe(DEFAULT_EMBED_THEME);
	});
});
