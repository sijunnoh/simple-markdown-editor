import { describe, it, expect } from "vitest";
import { turndown, roundTrip } from "./setup";

describe("turndown table rule", () => {
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
		const html = `
			<table>
				<tbody>
					<tr><th>H1</th><th>H2</th></tr>
					<tr><td>D1</td><td>D2</td></tr>
				</tbody>
			</table>
		`;
		const result = turndown.turndown(html);

		const h1Count = (result.match(/H1/g) || []).length;
		expect(h1Count).toBe(1);

		const d1Count = (result.match(/D1/g) || []).length;
		expect(d1Count).toBe(1);
	});

	it("should handle table after header row deletion (all td cells)", () => {
		const html = `
			<table>
				<tbody>
					<tr><td>Row 1 Col 1</td><td>Row 1 Col 2</td></tr>
					<tr><td>Row 2 Col 1</td><td>Row 2 Col 2</td></tr>
				</tbody>
			</table>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("| Row 1 Col 1");
		expect(result).toContain("| Row 2 Col 1");

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
		expect(lines.length).toBe(3);
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

describe("turndown table round-trip", () => {
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

		const tableLines = result.split("\n").filter(l => l.includes("|"));
		expect(tableLines.length).toBe(4);

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
