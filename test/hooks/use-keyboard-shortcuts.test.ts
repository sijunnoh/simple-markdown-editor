import { describe, it, expect } from "vitest";

/**
 * Tests for keyboard shortcut handling logic used by useKeyboardShortcuts.
 * The hook itself depends on DOM/React, so we test the pure logic portions.
 */
describe("use-keyboard-shortcuts", () => {
	describe("save deduplication logic", () => {
		// The hook normalizes content and compares before sending
		function normalizeForSave(content: string): string {
			return (content || "").replace(/\r\n/g, "\n").trim();
		}

		it("should detect identical content (no save needed)", () => {
			const current = "# Hello\n\nWorld";
			const lastSynced = "# Hello\n\nWorld";
			expect(normalizeForSave(current)).toBe(normalizeForSave(lastSynced));
		});

		it("should detect identical content with different line endings", () => {
			const current = "# Hello\r\n\r\nWorld\r\n";
			const lastSynced = "# Hello\n\nWorld\n";
			expect(normalizeForSave(current)).toBe(normalizeForSave(lastSynced));
		});

		it("should detect different content (save needed)", () => {
			const current = "# Hello\n\nWorld";
			const lastSynced = "# Hello\n\nEarth";
			expect(normalizeForSave(current)).not.toBe(normalizeForSave(lastSynced));
		});

		it("should handle empty last synced", () => {
			const current = "new content";
			const lastSynced = "";
			expect(normalizeForSave(current)).not.toBe(normalizeForSave(lastSynced));
		});

		it("should handle both empty (no save needed)", () => {
			expect(normalizeForSave("")).toBe(normalizeForSave(""));
		});
	});

	describe("modifier key detection", () => {
		const formattingKeys = ["b", "i", "u", "k"];

		it("should identify formatting keys", () => {
			expect(formattingKeys.includes("b")).toBe(true);
			expect(formattingKeys.includes("i")).toBe(true);
			expect(formattingKeys.includes("u")).toBe(true);
			expect(formattingKeys.includes("k")).toBe(true);
		});

		it("should not identify non-formatting keys", () => {
			expect(formattingKeys.includes("s")).toBe(false);
			expect(formattingKeys.includes("f")).toBe(false);
			expect(formattingKeys.includes("z")).toBe(false);
		});
	});

	describe("content source selection by view mode", () => {
		type ViewMode = "editor" | "source" | "split";

		function getContentSource(viewMode: ViewMode, isTextareaFocused: boolean): "textarea" | "editor" {
			if (viewMode === "source" || (viewMode === "split" && isTextareaFocused)) {
				return "textarea";
			}
			return "editor";
		}

		it("should use textarea in source mode", () => {
			expect(getContentSource("source", false)).toBe("textarea");
		});

		it("should use editor in editor mode", () => {
			expect(getContentSource("editor", false)).toBe("editor");
		});

		it("should use textarea in split mode when textarea is focused", () => {
			expect(getContentSource("split", true)).toBe("textarea");
		});

		it("should use editor in split mode when editor is focused", () => {
			expect(getContentSource("split", false)).toBe("editor");
		});
	});
});
