import { describe, it, expect } from "vitest";
import { roundTrip, turndown } from "./setup";

describe("turndown nested structures", () => {
	describe("blockquote with inline formatting", () => {
		it("should preserve bold inside blockquote", () => {
			const md = "> **bold text** inside quote";
			const result = roundTrip(md);
			expect(result).toContain("> **bold text**");
		});

		it("should preserve italic inside blockquote", () => {
			const md = "> *italic text* inside quote";
			const result = roundTrip(md);
			expect(result).toContain("> *italic text*");
		});

		it("should preserve inline code inside blockquote", () => {
			const md = "> Use `code` here";
			const result = roundTrip(md);
			expect(result).toContain("> ");
			expect(result).toContain("`code`");
		});

		it("should preserve link inside blockquote", () => {
			const md = "> Visit [example](https://example.com)";
			const result = roundTrip(md);
			expect(result).toContain("> ");
			expect(result).toContain("[example](https://example.com)");
		});
	});

	describe("list with inline formatting", () => {
		it("should preserve bold inside list item", () => {
			const md = "- **bold** item";
			const result = roundTrip(md);
			expect(result).toContain("- **bold** item");
		});

		it("should preserve inline code inside list item", () => {
			const md = "- Use `code` here";
			const result = roundTrip(md);
			expect(result).toContain("- Use `code` here");
		});

		it("should preserve link inside list item", () => {
			const md = "- Check [link](https://example.com)";
			const result = roundTrip(md);
			expect(result).toContain("[link](https://example.com)");
		});

		it("should handle ordered list with formatting", () => {
			const md = "1. **First** item\n2. *Second* item";
			const result = roundTrip(md);
			expect(result).toContain("1. **First** item");
			expect(result).toContain("2. *Second* item");
		});
	});

	describe("multi-line blockquote", () => {
		it("should preserve multi-line blockquote content", () => {
			// With breaks: false, multiple > lines in same block merge into one line
			const md = "> Line 1\n> Line 2\n> Line 3";
			const result = roundTrip(md);
			expect(result).toContain("> ");
			expect(result).toContain("Line 1");
			expect(result).toContain("Line 2");
			expect(result).toContain("Line 3");
		});
	});

	describe("heading with inline formatting", () => {
		it("should preserve bold in heading", () => {
			const md = "## **Bold** heading";
			const result = roundTrip(md);
			expect(result).toContain("## ");
			expect(result).toContain("Bold");
		});

		it("should preserve inline code in heading", () => {
			const md = "## The `code` heading";
			const result = roundTrip(md);
			expect(result).toContain("## ");
			expect(result).toContain("`code`");
		});
	});

	describe("task list items", () => {
		it("should preserve task list with mixed states", () => {
			const md = "- [x] Done task\n- [ ] Todo task";
			const result = roundTrip(md);
			expect(result).toContain("[x] Done task");
			expect(result).toContain("[ ] Todo task");
		});

		it("should preserve formatting inside task items", () => {
			const md = "- [x] **Bold** task";
			const result = roundTrip(md);
			expect(result).toContain("[x]");
			expect(result).toContain("Bold");
		});
	});

	describe("adjacent different block types", () => {
		it("should handle heading followed by list", () => {
			const md = "# Title\n\n- Item 1\n- Item 2";
			const result = roundTrip(md);
			expect(result).toContain("# Title");
			expect(result).toContain("- Item 1");
			expect(result).toContain("- Item 2");
		});

		it("should handle blockquote followed by code block", () => {
			const md = "> Quote\n\n```js\ncode\n```";
			const result = roundTrip(md);
			expect(result).toContain("> Quote");
			expect(result).toContain("```");
			expect(result).toContain("code");
		});

		it("should handle list followed by blockquote", () => {
			const md = "- Item 1\n- Item 2\n\n> Quote here";
			const result = roundTrip(md);
			expect(result).toContain("- Item 1");
			expect(result).toContain("> Quote here");
		});

		it("should handle paragraph between code blocks", () => {
			const md = "```\ncode1\n```\n\nMiddle text\n\n```\ncode2\n```";
			const result = roundTrip(md);
			expect(result).toContain("code1");
			expect(result).toContain("Middle text");
			expect(result).toContain("code2");
		});
	});

	describe("complex table content", () => {
		it("should preserve bold text in table cells", () => {
			const md = "| **Bold** | Normal |\n| --- | --- |\n| data | data |";
			const result = roundTrip(md);
			expect(result).toContain("**Bold**");
		});

		it("should preserve inline code in table cells", () => {
			const md = "| `code` | text |\n| --- | --- |\n| data | data |";
			const result = roundTrip(md);
			expect(result).toContain("`code`");
		});

		it("should preserve links in table cells", () => {
			const md = "| [link](https://example.com) | text |\n| --- | --- |\n| data | data |";
			const result = roundTrip(md);
			expect(result).toContain("[link](https://example.com)");
		});
	});
});
