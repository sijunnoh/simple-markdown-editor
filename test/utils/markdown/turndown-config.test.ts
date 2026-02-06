import { describe, it, expect } from "vitest";
import { marked } from "marked";
import { turndown } from "../../../src/webview/utils/markdown/turndown-config";

// Configure marked same as parser.ts
marked.setOptions({ gfm: true, breaks: false });

describe("turndownConfig", () => {
	describe("table rule", () => {
		it("should convert simple table with thead/tbody structure", () => {
			const html = `
				<table>
					<thead>
						<tr><th>Header 1</th><th>Header 2</th></tr>
					</thead>
					<tbody>
						<tr><td>Cell 1</td><td>Cell 2</td></tr>
						<tr><td>Cell 3</td><td>Cell 4</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("| Header 1");
			expect(result).toContain("| Header 2");
			expect(result).toContain("| Cell 1");
			expect(result).toContain("| Cell 2");
			expect(result).toContain("| Cell 3");
			expect(result).toContain("| Cell 4");
			// Should have separator row
			expect(result).toMatch(/\|[\s-]+\|[\s-]+\|/);
		});

		it("should convert TipTap-style table (tbody only, no thead)", () => {
			// TipTap generates tables without thead - all rows in tbody
			const html = `
				<table>
					<tbody>
						<tr><th>Header 1</th><th>Header 2</th></tr>
						<tr><td>Cell 1</td><td>Cell 2</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("| Header 1");
			expect(result).toContain("| Header 2");
			expect(result).toContain("| Cell 1");
			expect(result).toContain("| Cell 2");
		});

		it("should NOT duplicate rows when table has tbody only", () => {
			// This was a bug - first row was added as both header and body
			const html = `
				<table>
					<tbody>
						<tr><th>H1</th><th>H2</th></tr>
						<tr><td>D1</td><td>D2</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			// Count occurrences of H1 - should be exactly 1
			const h1Count = (result.match(/H1/g) || []).length;
			expect(h1Count).toBe(1);

			// Count occurrences of D1 - should be exactly 1
			const d1Count = (result.match(/D1/g) || []).length;
			expect(d1Count).toBe(1);
		});

		it("should handle table after header row deletion (all td cells)", () => {
			// After deleting header row, all cells become td
			const html = `
				<table>
					<tbody>
						<tr><td>Row 1 Col 1</td><td>Row 1 Col 2</td></tr>
						<tr><td>Row 2 Col 1</td><td>Row 2 Col 2</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			// First row should be treated as header (markdown requirement)
			expect(result).toContain("| Row 1 Col 1");
			expect(result).toContain("| Row 2 Col 1");

			// Should NOT have duplicate rows
			const row1Count = (result.match(/Row 1 Col 1/g) || []).length;
			expect(row1Count).toBe(1);
		});

		it("should handle table with mixed th and td in body rows", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>Header</th><th>Value</th></tr>
						<tr><th>Name</th><td>John</td></tr>
						<tr><th>Age</th><td>30</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("| Header");
			expect(result).toContain("| Name");
			expect(result).toContain("| John");
			expect(result).toContain("| Age");
			expect(result).toContain("| 30");
		});

		it("should handle empty cells", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>A</th><th>B</th></tr>
						<tr><td></td><td>Data</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("| A");
			expect(result).toContain("| B");
			expect(result).toContain("| Data");
		});

		it("should handle single row table", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>Only Header</th><th>Row</th></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("| Only Header");
			expect(result).toContain("| Row");
			// Should still have separator
			expect(result).toMatch(/\|[\s-]+\|/);
		});

		it("should preserve whitespace-trimmed content", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>  Padded  </th><th>Content</th></tr>
						<tr><td>  Data  </td><td>Here</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			// Content should be trimmed
			expect(result).toContain("| Padded");
			expect(result).toContain("| Data");
		});

		it("should preserve bold formatting in table cells", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>Header</th><th>Value</th></tr>
						<tr><td><strong>Bold text</strong></td><td>Normal</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("**Bold text**");
			expect(result).toContain("| Normal");
		});

		it("should preserve italic formatting in table cells", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>Header</th><th>Value</th></tr>
						<tr><td><em>Italic text</em></td><td>Normal</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("*Italic text*");
		});

		it("should preserve code formatting in table cells", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>Header</th><th>Value</th></tr>
						<tr><td><code>inline code</code></td><td>Normal</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("`inline code`");
		});

		it("should preserve strikethrough formatting in table cells", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>Header</th><th>Value</th></tr>
						<tr><td><s>strikethrough</s></td><td>Normal</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("~~strikethrough~~");
		});

		it("should preserve links in table cells", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>Header</th><th>Value</th></tr>
						<tr><td><a href="https://example.com">Link text</a></td><td>Normal</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("[Link text](https://example.com)");
		});

		it("should preserve mixed formatting in table cells", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>Header</th><th>Value</th></tr>
						<tr><td><strong>Bold</strong> and <em>italic</em></td><td>Normal</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("**Bold**");
			expect(result).toContain("*italic*");
		});

		it("should preserve formatting in header cells", () => {
			const html = `
				<table>
					<tbody>
						<tr><th><strong>Bold Header</strong></th><th>Normal Header</th></tr>
						<tr><td>Data 1</td><td>Data 2</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("**Bold Header**");
		});

		it("should handle 3-column table", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>A</th><th>B</th><th>C</th></tr>
						<tr><td>1</td><td>2</td><td>3</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			const lines = result.trim().split("\n").filter(l => l.includes("|"));
			// header + separator + 1 data row = 3 lines
			expect(lines.length).toBe(3);
			// Each line should have 3 columns (4 pipes)
			for (const line of lines) {
				const pipeCount = (line.match(/\|/g) || []).length;
				expect(pipeCount).toBe(4);
			}
		});

		it("should handle table with CJK content", () => {
			const html = `
				<table>
					<tbody>
						<tr><th>이름</th><th>나이</th></tr>
						<tr><td>김철수</td><td>30</td></tr>
					</tbody>
				</table>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("| 이름");
			expect(result).toContain("| 김철수");
			expect(result).toContain("| 30");
		});
	});

	describe("table round-trip (markdown → HTML → markdown)", () => {
		function roundTrip(md: string): string {
			const html = marked.parse(md, { async: false }) as string;
			return turndown.turndown(html).trim();
		}

		it("should preserve bold in table cells", () => {
			const md = `| Header | Value |
| --- | --- |
| **bold text** | normal |`;
			const result = roundTrip(md);

			expect(result).toContain("**bold text**");
			expect(result).toContain("normal");
		});

		it("should preserve italic in table cells", () => {
			const md = `| Header | Value |
| --- | --- |
| *italic text* | normal |`;
			const result = roundTrip(md);

			expect(result).toContain("*italic text*");
		});

		it("should preserve inline code in table cells", () => {
			const md = `| Header | Value |
| --- | --- |
| \`code here\` | normal |`;
			const result = roundTrip(md);

			expect(result).toContain("`code here`");
		});

		it("should preserve strikethrough in table cells", () => {
			const md = `| Header | Value |
| --- | --- |
| ~~deleted~~ | normal |`;
			const result = roundTrip(md);

			expect(result).toContain("~~deleted~~");
		});

		it("should preserve links in table cells", () => {
			const md = `| Header | Value |
| --- | --- |
| [link](https://example.com) | normal |`;
			const result = roundTrip(md);

			expect(result).toContain("[link](https://example.com)");
		});

		it("should preserve mixed formatting in table cells", () => {
			const md = `| Name | Description |
| --- | --- |
| **bold** and *italic* | \`code\` and ~~strike~~ |`;
			const result = roundTrip(md);

			expect(result).toContain("**bold**");
			expect(result).toContain("*italic*");
			expect(result).toContain("`code`");
			expect(result).toContain("~~strike~~");
		});

		it("should preserve table structure after round-trip", () => {
			const md = `| A | B | C |
| --- | --- | --- |
| 1 | 2 | 3 |
| 4 | 5 | 6 |`;
			const result = roundTrip(md);

			// Should have 4 lines with pipes (header + separator + 2 data rows)
			const tableLines = result.split("\n").filter(l => l.includes("|"));
			expect(tableLines.length).toBe(4);

			// Content should be preserved
			expect(result).toContain("| A");
			expect(result).toContain("| 1");
			expect(result).toContain("| 6");
		});

		it("should preserve formatting in header cells after round-trip", () => {
			const md = `| **Bold Header** | *Italic Header* |
| --- | --- |
| data 1 | data 2 |`;
			const result = roundTrip(md);

			expect(result).toContain("**Bold Header**");
			expect(result).toContain("*Italic Header*");
		});
	});

	describe("task list rule", () => {
		it("should convert unchecked task item", () => {
			const html = `
				<ul data-type="taskList">
					<li data-type="taskItem">
						<input type="checkbox">
						<span>Task content</span>
					</li>
				</ul>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("- [ ]");
		});

		it("should convert checked task item", () => {
			const html = `
				<ul data-type="taskList">
					<li data-type="taskItem">
						<input type="checkbox" checked>
						<span>Done task</span>
					</li>
				</ul>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("- [x]");
		});

		it("should convert task item with data-checked attribute (TipTap format)", () => {
			const html = `
				<ul data-type="taskList">
					<li data-type="taskItem" data-checked="true">
						<label><input type="checkbox"><span></span></label>
						<div>Checked task</div>
					</li>
				</ul>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("- [x]");
			expect(result).toContain("Checked task");
		});

		it("should convert unchecked task item with data-checked attribute (TipTap format)", () => {
			const html = `
				<ul data-type="taskList">
					<li data-type="taskItem" data-checked="false">
						<label><input type="checkbox"><span></span></label>
						<div>Unchecked task</div>
					</li>
				</ul>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("- [ ]");
			expect(result).toContain("Unchecked task");
		});

		it("should convert GFM/marked format task list (unchecked)", () => {
			const html = `
				<ul>
					<li><input type="checkbox" disabled> Buy groceries</li>
				</ul>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("- [ ]");
			expect(result).toContain("Buy groceries");
		});

		it("should convert GFM/marked format task list (checked)", () => {
			const html = `
				<ul>
					<li><input type="checkbox" checked disabled> Completed task</li>
				</ul>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("- [x]");
			expect(result).toContain("Completed task");
		});
	});

	describe("code block rule", () => {
		it("should convert code block with language", () => {
			const html = `
				<pre><code class="language-javascript">const x = 1;</code></pre>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("```javascript");
			expect(result).toContain("const x = 1;");
			expect(result).toContain("```");
		});

		it("should convert code block without language", () => {
			const html = `
				<pre><code>plain code</code></pre>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("```");
			expect(result).toContain("plain code");
		});

		it("should convert code block wrapper with language", () => {
			const html = `
				<div class="code-block-wrapper">
					<pre><code class="language-python">print("hello")</code></pre>
				</div>
			`;
			const result = turndown.turndown(html);

			expect(result).toContain("```python");
			expect(result).toContain('print("hello")');
		});
	});

	describe("blockImage rule", () => {
		it("should preserve width attribute in HTML format", () => {
			const html = `<img src="./image.png" alt="test" width="200">`;
			const result = turndown.turndown(html);

			expect(result).toContain('width="200"');
			expect(result).toContain('src="./image.png"');
		});

		it("should convert image without width to markdown syntax", () => {
			const html = `<img src="./image.png" alt="test image">`;
			const result = turndown.turndown(html);

			expect(result).toContain("![test image](./image.png)");
		});

		it("should wrap image without width in newlines", () => {
			const html = `<p>before</p><img src="./photo.png" alt="pic"><p>after</p>`;
			const result = turndown.turndown(html);

			// Image should be on its own line, separated from surrounding content
			const lines = result.split("\n").filter(l => l.trim() !== "");
			const imageLine = lines.find(l => l.includes("![pic]"));
			expect(imageLine).toBeDefined();

			// before and after should be separate from image
			const beforeLine = lines.find(l => l.includes("before"));
			const afterLine = lines.find(l => l.includes("after"));
			expect(beforeLine).toBeDefined();
			expect(afterLine).toBeDefined();
			expect(beforeLine).not.toContain("![");
			expect(afterLine).not.toContain("![");
		});

		it("should wrap image with width in newlines", () => {
			const html = `<p>text</p><img src="./img.png" alt="" width="300"><p>more</p>`;
			const result = turndown.turndown(html);

			const lines = result.split("\n").filter(l => l.trim() !== "");
			const imgLine = lines.find(l => l.includes("img src"));
			expect(imgLine).toBeDefined();

			// text and more should be on separate lines
			const textLine = lines.find(l => l.includes("text"));
			expect(textLine).not.toContain("<img");
		});

		it("should handle image with empty alt text", () => {
			const html = `<img src="./photo.png" alt="">`;
			const result = turndown.turndown(html);

			expect(result).toContain("![](./photo.png)");
		});

		it("should handle image with no alt attribute", () => {
			const html = `<img src="./photo.png">`;
			const result = turndown.turndown(html);

			expect(result).toContain("![](./photo.png)");
		});
	});

	describe("preserveParagraphs rule", () => {
		it("should add double newline after paragraph", () => {
			const html = `<p>First paragraph</p><p>Second paragraph</p>`;
			const result = turndown.turndown(html);

			expect(result).toContain("First paragraph");
			expect(result).toContain("Second paragraph");
			// Paragraphs should be separated by blank line
			expect(result).toMatch(/First paragraph\n\nSecond paragraph/);
		});

		it("should not add extra newlines for paragraphs inside list items", () => {
			const html = `<ul><li><p>List item text</p></li></ul>`;
			const result = turndown.turndown(html);

			// Should be a clean list item, not double-spaced
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
