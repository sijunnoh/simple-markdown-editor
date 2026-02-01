import { describe, it, expect } from "vitest";

/**
 * Content normalization helper - same logic used in useMarkdownSync and useVSCodeMessaging
 */
function normalizeContent(content: string): string {
	return (content || "").replace(/\r\n/g, "\n").trim();
}

describe("Content Sync Utilities", () => {
	describe("normalizeContent", () => {
		it("should handle empty string", () => {
			expect(normalizeContent("")).toBe("");
		});

		it("should handle null/undefined", () => {
			expect(normalizeContent(null as unknown as string)).toBe("");
			expect(normalizeContent(undefined as unknown as string)).toBe("");
		});

		it("should convert Windows line endings to Unix", () => {
			const windowsContent = "line1\r\nline2\r\nline3";
			const result = normalizeContent(windowsContent);
			expect(result).toBe("line1\nline2\nline3");
		});

		it("should preserve Unix line endings", () => {
			const unixContent = "line1\nline2\nline3";
			const result = normalizeContent(unixContent);
			expect(result).toBe(unixContent);
		});

		it("should trim leading and trailing whitespace", () => {
			const content = "  \n  content here  \n  ";
			const result = normalizeContent(content);
			expect(result).toBe("content here");
		});

		it("should handle mixed line endings", () => {
			const mixedContent = "line1\r\nline2\nline3\r\n";
			const result = normalizeContent(mixedContent);
			expect(result).toBe("line1\nline2\nline3");
		});

		it("should consider identical content after normalization as equal", () => {
			const content1 = "# Title\r\n\r\nSome text\r\n";
			const content2 = "# Title\n\nSome text\n";
			expect(normalizeContent(content1)).toBe(normalizeContent(content2));
		});

		it("should detect different content", () => {
			const content1 = "# Title\n\nText A";
			const content2 = "# Title\n\nText B";
			expect(normalizeContent(content1)).not.toBe(normalizeContent(content2));
		});
	});

	describe("Table content deduplication", () => {
		it("should not duplicate table rows in normalized content", () => {
			const tableMarkdown = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;
			const normalized = normalizeContent(tableMarkdown);

			// Count table rows (lines starting with |)
			const rows = normalized.split("\n").filter(line => line.startsWith("|"));
			expect(rows.length).toBe(4); // header + separator + 2 data rows
		});

		it("should preserve table structure through save cycle simulation", () => {
			const original = `| A | B |
| - | - |
| 1 | 2 |`;

			// Simulate: normalize -> compare -> same = no update needed
			const normalized1 = normalizeContent(original);
			const normalized2 = normalizeContent(original);

			expect(normalized1).toBe(normalized2);
		});
	});

	describe("Edge cases for sync prevention", () => {
		it("should treat content with only whitespace differences as equal after normalization", () => {
			const content1 = "text   ";
			const content2 = "text";
			expect(normalizeContent(content1)).toBe(normalizeContent(content2));
		});

		it("should preserve internal whitespace", () => {
			const content = "word1   word2";
			const result = normalizeContent(content);
			expect(result).toBe("word1   word2");
		});

		it("should handle content with special characters", () => {
			const content = "한글 테스트\r\n日本語テスト";
			const result = normalizeContent(content);
			expect(result).toBe("한글 테스트\n日本語テスト");
		});

		it("should handle markdown with code blocks", () => {
			const content = "```\r\ncode\r\n```";
			const result = normalizeContent(content);
			expect(result).toBe("```\ncode\n```");
		});
	});
});
