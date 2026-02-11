import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../../../src/webview/utils/markdown/parser";

describe("parseMarkdown mixed content", () => {
	const baseUri = "vscode-webview://abc123/workspace";

	describe("inline HTML mixed with markdown", () => {
		it("should handle HTML img inside markdown paragraph", () => {
			const md = 'Text with <img src="./image.png" alt="photo"> inside';
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<img");
			expect(result).toContain(baseUri);
			expect(result).toContain("Text with");
		});

		it("should handle HTML br tag", () => {
			const md = "Line one<br>Line two";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("Line one");
			expect(result).toContain("Line two");
		});

		it("should handle HTML bold mixed with markdown italic", () => {
			const md = "<b>bold</b> and *italic*";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("bold");
			expect(result).toContain("<em>");
		});
	});

	describe("complex inline combinations", () => {
		it("should handle bold inside link", () => {
			const md = "[**bold link**](https://example.com)";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<a");
			expect(result).toContain("<strong>");
			expect(result).toContain("bold link");
		});

		it("should handle code inside link", () => {
			const md = "[`code`](https://example.com)";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<a");
			expect(result).toContain("<code>");
		});

		it("should handle image inside link (badge pattern)", () => {
			const md = "[![badge](https://img.shields.io/badge.svg)](https://example.com)";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<a");
			expect(result).toContain("<img");
		});

		it("should handle strikethrough with bold", () => {
			const md = "~~**bold strikethrough**~~";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<del>");
			expect(result).toContain("<strong>");
		});

		it("should handle multiple inline styles in one paragraph", () => {
			const md = "**bold** and *italic* and `code` and ~~strike~~";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<strong>");
			expect(result).toContain("<em>");
			expect(result).toContain("<code>");
			expect(result).toContain("<del>");
		});
	});

	describe("math mixed with markdown", () => {
		it("should handle inline math next to bold text", () => {
			const md = "**Einstein's formula**: $E=mc^2$";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<strong>");
			expect(result).toContain("math-inline");
		});

		it("should handle block math after heading", () => {
			const md = "## Formula\n\n$$\nx = \\frac{-b}{2a}\n$$";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<h2>");
			expect(result).toContain("math-block");
		});

		it("should handle math inside list item", () => {
			const md = "- The formula $a^2 + b^2 = c^2$ is important";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<li>");
			expect(result).toContain("math-inline");
		});

		it("should not confuse dollar amounts near math", () => {
			const md = "Price is $100, but formula is $E=mc^2$";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("$100");
			expect(result).toContain("math-inline");
			const mathCount = (result.match(/math-inline/g) || []).length;
			expect(mathCount).toBe(1);
		});
	});

	describe("frontmatter with content", () => {
		it("should handle frontmatter followed by complex content", () => {
			const md = "---\ntitle: Test\n---\n\n# Heading\n\n- List item\n\n> Quote";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("frontmatter-block");
			expect(result).toContain("<h1>");
			expect(result).toContain("<li>");
			expect(result).toContain("<blockquote>");
		});

		it("should handle frontmatter followed by math", () => {
			const md = "---\ntitle: Math doc\n---\n\n$E=mc^2$";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("frontmatter-block");
			expect(result).toContain("math-inline");
		});
	});

	describe("edge cases", () => {
		it("should handle consecutive headings", () => {
			const md = "# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<h1>");
			expect(result).toContain("<h2>");
			expect(result).toContain("<h3>");
			expect(result).toContain("<h4>");
			expect(result).toContain("<h5>");
		});

		it("should handle code block with markdown-like content", () => {
			const md = "```\n# Not a heading\n**not bold**\n- not a list\n```";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("# Not a heading");
			// Should be inside code block, not parsed as markdown
			expect(result).not.toContain("<h1>");
		});

		it("should handle escaped markdown characters", () => {
			const md = "\\*not italic\\*";
			const result = parseMarkdown(md, baseUri);
			// Escaped asterisks should appear as literal text
			expect(result).toContain("*not italic*");
		});

		it("should handle very long paragraph", () => {
			const words = Array.from({ length: 200 }, (_, i) => `word${i}`);
			const md = words.join(" ");
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("word0");
			expect(result).toContain("word199");
		});

		it("should handle multiple blank lines between blocks", () => {
			const md = "# Title\n\n\n\nParagraph\n\n\n\n- List";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<h1>");
			expect(result).toContain("Paragraph");
			expect(result).toContain("<li>");
		});

		it("should handle table followed by code block", () => {
			const md = "| A | B |\n| - | - |\n| 1 | 2 |\n\n```js\nconst x = 1;\n```";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<table>");
			expect(result).toContain("<code");
			expect(result).toContain("const x = 1;");
		});

		it("should handle nested emphasis", () => {
			const md = "***bold and italic***";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<strong>");
			expect(result).toContain("<em>");
		});
	});
});
