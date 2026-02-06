import { describe, it, expect } from "vitest";
import { normalizeContent } from "../../src/webview/hooks/use-markdown-sync";

describe("use-markdown-sync", () => {
	describe("normalizeContent", () => {
		it("should handle empty string", () => {
			expect(normalizeContent("")).toBe("");
		});

		it("should handle null/undefined gracefully", () => {
			expect(normalizeContent(null as unknown as string)).toBe("");
			expect(normalizeContent(undefined as unknown as string)).toBe("");
		});

		it("should convert \\r\\n to \\n", () => {
			expect(normalizeContent("a\r\nb\r\nc")).toBe("a\nb\nc");
		});

		it("should preserve \\n line endings", () => {
			expect(normalizeContent("a\nb\nc")).toBe("a\nb\nc");
		});

		it("should trim whitespace", () => {
			expect(normalizeContent("  hello  ")).toBe("hello");
		});

		it("should trim leading/trailing newlines", () => {
			expect(normalizeContent("\n\nhello\n\n")).toBe("hello");
		});

		it("should preserve internal whitespace", () => {
			expect(normalizeContent("hello   world")).toBe("hello   world");
		});

		it("should normalize mixed line endings", () => {
			expect(normalizeContent("a\r\nb\nc\r\n")).toBe("a\nb\nc");
		});

		it("should detect identical content after normalization", () => {
			const a = "# Title\r\n\r\nContent\r\n";
			const b = "# Title\n\nContent\n";
			expect(normalizeContent(a)).toBe(normalizeContent(b));
		});

		it("should detect different content", () => {
			expect(normalizeContent("hello")).not.toBe(normalizeContent("world"));
		});

		it("should handle unicode content", () => {
			expect(normalizeContent("한글\r\n테스트")).toBe("한글\n테스트");
		});

		it("should handle content with only whitespace", () => {
			expect(normalizeContent("   \n  \r\n  ")).toBe("");
		});

		it("should handle markdown with code blocks", () => {
			const md = "```js\r\nconst x = 1;\r\n```";
			expect(normalizeContent(md)).toBe("```js\nconst x = 1;\n```");
		});
	});
});
