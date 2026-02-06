import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../../../src/webview/utils/markdown/parser";

describe("parseMarkdown", () => {
	const baseUri = "vscode-webview://abc123/workspace";

	describe("basic markdown parsing", () => {
		it("should parse headings", () => {
			const result = parseMarkdown("# Hello", baseUri);
			expect(result).toContain("<h1>");
			expect(result).toContain("Hello");
		});

		it("should parse multiple heading levels", () => {
			const md = "# H1\n## H2\n### H3";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<h1>");
			expect(result).toContain("<h2>");
			expect(result).toContain("<h3>");
		});

		it("should parse bold text", () => {
			const result = parseMarkdown("**bold**", baseUri);
			expect(result).toContain("<strong>");
			expect(result).toContain("bold");
		});

		it("should parse italic text", () => {
			const result = parseMarkdown("*italic*", baseUri);
			expect(result).toContain("<em>");
			expect(result).toContain("italic");
		});

		it("should parse links", () => {
			const result = parseMarkdown("[link](https://example.com)", baseUri);
			expect(result).toContain("<a");
			expect(result).toContain("https://example.com");
		});

		it("should parse bullet lists", () => {
			const md = "- item1\n- item2\n- item3";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<ul>");
			expect(result).toContain("<li>");
			expect(result).toContain("item1");
		});

		it("should parse ordered lists", () => {
			const md = "1. first\n2. second\n3. third";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<ol>");
			expect(result).toContain("first");
		});

		it("should parse code blocks with language", () => {
			const md = "```javascript\nconsole.log('hello');\n```";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<code");
			expect(result).toContain("console.log");
		});

		it("should parse inline code", () => {
			const result = parseMarkdown("`code`", baseUri);
			expect(result).toContain("<code>");
			expect(result).toContain("code");
		});

		it("should parse blockquotes", () => {
			const result = parseMarkdown("> quote", baseUri);
			expect(result).toContain("<blockquote>");
			expect(result).toContain("quote");
		});

		it("should parse horizontal rules", () => {
			const result = parseMarkdown("---", baseUri);
			expect(result).toContain("<hr");
		});
	});

	describe("task list transformation", () => {
		it("should transform unchecked task list items to TipTap format", () => {
			const md = "- [ ] unchecked task";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain('data-type="taskItem"');
			expect(result).toContain('data-checked="false"');
			expect(result).toContain("unchecked task");
		});

		it("should transform checked task list items to TipTap format", () => {
			const md = "- [x] checked task";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain('data-type="taskItem"');
			expect(result).toContain('data-checked="true"');
			expect(result).toContain("checked task");
		});

		it("should transform mixed task list items", () => {
			const md = "- [x] done\n- [ ] todo\n- [x] also done";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain('data-type="taskList"');
			const checkedCount = (result.match(/data-checked="true"/g) || []).length;
			const uncheckedCount = (result.match(/data-checked="false"/g) || []).length;
			expect(checkedCount).toBe(2);
			expect(uncheckedCount).toBe(1);
		});

		it("should wrap task list in ul with data-type=taskList", () => {
			const md = "- [ ] task";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain('data-type="taskList"');
		});

		it("should not transform regular lists", () => {
			const md = "- regular item\n- another item";
			const result = parseMarkdown(md, baseUri);
			expect(result).not.toContain("data-type");
			expect(result).not.toContain("data-checked");
		});
	});

	describe("image path transformation", () => {
		it("should transform relative image paths to webview URIs", () => {
			const md = "![alt](./image.png)";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<img");
			expect(result).toContain(baseUri);
		});

		it("should preserve absolute URLs", () => {
			const md = "![alt](https://example.com/image.png)";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("https://example.com/image.png");
		});
	});

	describe("GFM features", () => {
		it("should parse tables", () => {
			const md = "| A | B |\n| - | - |\n| 1 | 2 |";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("<table>");
			expect(result).toContain("<th>");
			expect(result).toContain("<td>");
		});

		it("should parse strikethrough", () => {
			const result = parseMarkdown("~~deleted~~", baseUri);
			expect(result).toContain("<del>");
			expect(result).toContain("deleted");
		});
	});

	describe("frontmatter parsing", () => {
		it("should parse frontmatter at start of document", () => {
			const md = "---\ntitle: Test\nauthor: me\n---\n\n# Hello";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("frontmatter-block");
			expect(result).toContain("data-content");
			expect(result).toContain("title: Test");
		});

		it("should not parse --- in middle of document as frontmatter", () => {
			const md = "# Title\n\n---\n\nSome text";
			const result = parseMarkdown(md, baseUri);
			expect(result).not.toContain("frontmatter-block");
			expect(result).toContain("<hr");
		});

		it("should handle frontmatter with special characters", () => {
			const md = '---\ntitle: "Hello <World>"\n---\n\nContent';
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("frontmatter-block");
			expect(result).toContain("&lt;World&gt;");
		});

		it("should handle empty frontmatter", () => {
			const md = "---\n\n---\n\nContent";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("Content");
		});
	});

	describe("math inline parsing", () => {
		it("should parse inline math", () => {
			const md = "The formula $E=mc^2$ is famous";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("math-inline");
			expect(result).toContain('data-latex="E=mc^2"');
		});

		it("should not parse dollar amounts as math", () => {
			const md = "The price is $100 and $200";
			const result = parseMarkdown(md, baseUri);
			expect(result).not.toContain("math-inline");
			expect(result).toContain("$100");
		});

		it("should not parse dollar with trailing space as math", () => {
			const md = "Cost is $ 50 per item";
			const result = parseMarkdown(md, baseUri);
			expect(result).not.toContain("math-inline");
		});

		it("should parse math with LaTeX commands", () => {
			const md = "Formula: $\\frac{a}{b}$";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("math-inline");
		});

		it("should handle multiple inline math in one line", () => {
			const md = "$a^2$ plus $b^2$ equals $c^2$";
			const result = parseMarkdown(md, baseUri);
			const count = (result.match(/math-inline/g) || []).length;
			expect(count).toBe(3);
		});
	});

	describe("math block parsing", () => {
		it("should parse block math", () => {
			const md = "$$\n\\sum_{i=1}^n i\n$$";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("math-block");
			expect(result).toContain("data-latex");
		});

		it("should parse block math on single line", () => {
			const md = "$$E=mc^2$$";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("math-block");
		});

		it("should handle block math with multiple lines", () => {
			const md = "$$\na = b\nc = d\n$$";
			const result = parseMarkdown(md, baseUri);
			expect(result).toContain("math-block");
		});
	});

	describe("edge cases", () => {
		it("should handle empty string", () => {
			const result = parseMarkdown("", baseUri);
			expect(result).toBe("");
		});

		it("should handle plain text", () => {
			const result = parseMarkdown("just text", baseUri);
			expect(result).toContain("just text");
		});

		it("should handle empty baseUri", () => {
			const result = parseMarkdown("# Hello", "");
			expect(result).toContain("<h1>");
		});
	});
});
