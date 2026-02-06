import { describe, it, expect, beforeEach } from "vitest";
import {
	turndown,
	updateTurndownOptions,
	getIndentString,
} from "../../../src/webview/utils/markdown/turndown-config";
import type { EditorSettings } from "../../../src/webview/types";

describe("turndown-config (updateTurndownOptions)", () => {
	const defaultSettings: EditorSettings = {
		imageDirectory: "images",
		emDelimiter: "*",
		strongDelimiter: "**",
		headingSizePreset: "medium",
		indentationStyle: "2spaces",
	};

	beforeEach(() => {
		// Reset to defaults
		updateTurndownOptions(defaultSettings);
	});

	describe("getIndentString", () => {
		it("should return tab for tabs style", () => {
			expect(getIndentString("tabs")).toBe("\t");
		});

		it("should return 2 spaces for 2spaces style", () => {
			expect(getIndentString("2spaces")).toBe("  ");
		});

		it("should return 4 spaces for 4spaces style", () => {
			expect(getIndentString("4spaces")).toBe("    ");
		});

		it("should default to 2 spaces for unknown style", () => {
			expect(getIndentString(undefined as unknown as EditorSettings["indentationStyle"])).toBe("  ");
		});
	});

	describe("updateTurndownOptions - emDelimiter", () => {
		it("should apply asterisk em delimiter", () => {
			updateTurndownOptions({ ...defaultSettings, emDelimiter: "*" });
			const result = turndown.turndown("<em>text</em>");
			expect(result).toBe("*text*");
		});

		it("should apply underscore em delimiter", () => {
			updateTurndownOptions({ ...defaultSettings, emDelimiter: "_" });
			const result = turndown.turndown("<em>text</em>");
			expect(result).toBe("_text_");
		});
	});

	describe("updateTurndownOptions - strongDelimiter", () => {
		it("should apply double asterisk strong delimiter", () => {
			updateTurndownOptions({ ...defaultSettings, strongDelimiter: "**" });
			const result = turndown.turndown("<strong>text</strong>");
			expect(result).toBe("**text**");
		});

		it("should apply double underscore strong delimiter", () => {
			updateTurndownOptions({ ...defaultSettings, strongDelimiter: "__" });
			const result = turndown.turndown("<strong>text</strong>");
			expect(result).toBe("__text__");
		});

		it("should also handle <b> tags", () => {
			updateTurndownOptions({ ...defaultSettings, strongDelimiter: "__" });
			const result = turndown.turndown("<b>text</b>");
			expect(result).toBe("__text__");
		});
	});

	describe("updateTurndownOptions - indentation effect on lists", () => {
		it("should use 2-space indentation for nested lists", () => {
			updateTurndownOptions({ ...defaultSettings, indentationStyle: "2spaces" });
			const html = "<ul><li>item<ul><li>nested</li></ul></li></ul>";
			const result = turndown.turndown(html);
			expect(result).toContain("  - nested");
		});

		it("should use 4-space indentation for nested lists", () => {
			updateTurndownOptions({ ...defaultSettings, indentationStyle: "4spaces" });
			const html = "<ul><li>item<ul><li>nested</li></ul></li></ul>";
			const result = turndown.turndown(html);
			expect(result).toContain("    - nested");
		});

		it("should use tab indentation for nested lists", () => {
			updateTurndownOptions({ ...defaultSettings, indentationStyle: "tabs" });
			const html = "<ul><li>item<ul><li>nested</li></ul></li></ul>";
			const result = turndown.turndown(html);
			expect(result).toContain("\t- nested");
		});
	});

	describe("combined settings", () => {
		it("should apply multiple settings at once", () => {
			updateTurndownOptions({
				...defaultSettings,
				emDelimiter: "_",
				strongDelimiter: "__",
				indentationStyle: "tabs",
			});

			const result = turndown.turndown("<em>italic</em> and <strong>bold</strong>");
			expect(result).toContain("_italic_");
			expect(result).toContain("__bold__");
		});
	});
});
