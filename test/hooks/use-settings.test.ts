import { describe, it, expect } from "vitest";
import { HEADING_SIZE_PRESETS, getHeadingSizes, DEFAULT_SETTINGS } from "../../src/webview/hooks/use-settings";

describe("HEADING_SIZE_PRESETS", () => {
	it("should have small, medium, and large presets", () => {
		expect(HEADING_SIZE_PRESETS).toHaveProperty("small");
		expect(HEADING_SIZE_PRESETS).toHaveProperty("medium");
		expect(HEADING_SIZE_PRESETS).toHaveProperty("large");
	});

	it("should have h1 through h5 sizes for each preset", () => {
		for (const preset of ["small", "medium", "large"] as const) {
			const sizes = HEADING_SIZE_PRESETS[preset];
			expect(sizes).toHaveProperty("h1");
			expect(sizes).toHaveProperty("h2");
			expect(sizes).toHaveProperty("h3");
			expect(sizes).toHaveProperty("h4");
			expect(sizes).toHaveProperty("h5");
		}
	});

	it("should have sizes in descending order (h1 > h2 > h3 > h4 > h5)", () => {
		for (const preset of ["small", "medium", "large"] as const) {
			const sizes = HEADING_SIZE_PRESETS[preset];
			const values = [sizes.h1, sizes.h2, sizes.h3, sizes.h4, sizes.h5].map(parseFloat);
			for (let i = 0; i < values.length - 1; i++) {
				expect(values[i]).toBeGreaterThanOrEqual(values[i + 1]);
			}
		}
	});

	it("should have large preset sizes >= medium >= small for each heading level", () => {
		const levels = ["h1", "h2", "h3", "h4", "h5"] as const;
		for (const level of levels) {
			const small = parseFloat(HEADING_SIZE_PRESETS.small[level]);
			const medium = parseFloat(HEADING_SIZE_PRESETS.medium[level]);
			const large = parseFloat(HEADING_SIZE_PRESETS.large[level]);
			expect(large).toBeGreaterThanOrEqual(medium);
			expect(medium).toBeGreaterThanOrEqual(small);
		}
	});
});

describe("getHeadingSizes", () => {
	it("should return correct sizes for each preset", () => {
		expect(getHeadingSizes("small")).toEqual(HEADING_SIZE_PRESETS.small);
		expect(getHeadingSizes("medium")).toEqual(HEADING_SIZE_PRESETS.medium);
		expect(getHeadingSizes("large")).toEqual(HEADING_SIZE_PRESETS.large);
	});

	it("should fall back to medium for unknown preset", () => {
		// @ts-expect-error testing invalid input
		expect(getHeadingSizes("unknown")).toEqual(HEADING_SIZE_PRESETS.medium);
	});
});

describe("DEFAULT_SETTINGS", () => {
	it("should have expected default values", () => {
		expect(DEFAULT_SETTINGS.imageDirectory).toBe("./images");
		expect(DEFAULT_SETTINGS.emDelimiter).toBe("*");
		expect(DEFAULT_SETTINGS.strongDelimiter).toBe("**");
		expect(DEFAULT_SETTINGS.headingSizePreset).toBe("medium");
		expect(DEFAULT_SETTINGS.indentationStyle).toBe("2spaces");
	});
});
