import { describe, it, expect } from "vitest";
import { turndown } from "../turndownConfig";

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
	});

	describe("image with width rule", () => {
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
	});
});
