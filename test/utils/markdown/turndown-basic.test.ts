import { describe, it, expect } from "vitest";
import { turndown } from "./setup";

describe("turndown basic rules", () => {
	describe("preserveParagraphs rule", () => {
		it("should add double newline after paragraph", () => {
			const html = `<p>First paragraph</p><p>Second paragraph</p>`;
			const result = turndown.turndown(html);

			expect(result).toContain("First paragraph");
			expect(result).toContain("Second paragraph");
			expect(result).toMatch(/First paragraph\n\nSecond paragraph/);
		});

		it("should not add extra newlines for paragraphs inside list items", () => {
			const html = `<ul><li><p>List item text</p></li></ul>`;
			const result = turndown.turndown(html);

			expect(result).toContain("- List item text");
		});
	});

	describe("listItem rule", () => {
		it("should convert bullet list items with single space", () => {
			const html = `<ul><li>Item 1</li><li>Item 2</li></ul>`;
			const result = turndown.turndown(html);

			expect(result).toContain("- Item 1");
			expect(result).toContain("- Item 2");
		});

		it("should convert ordered list items", () => {
			const html = `<ol><li>First</li><li>Second</li></ol>`;
			const result = turndown.turndown(html);

			expect(result).toContain("1. First");
			expect(result).toContain("2. Second");
		});

		it("should handle ordered list with start attribute", () => {
			const html = `<ol start="5"><li>Fifth</li><li>Sixth</li></ol>`;
			const result = turndown.turndown(html);

			expect(result).toContain("5. Fifth");
			expect(result).toContain("6. Sixth");
		});
	});

	describe("blockquote", () => {
		it("should convert blockquote", () => {
			const html = `<blockquote><p>Quoted text</p></blockquote>`;
			const result = turndown.turndown(html);

			expect(result).toContain("> Quoted text");
		});
	});

	describe("horizontalRule", () => {
		it("should convert hr to ---", () => {
			const html = `<p>Before</p><hr><p>After</p>`;
			const result = turndown.turndown(html);

			expect(result).toContain("---");
		});
	});
});
