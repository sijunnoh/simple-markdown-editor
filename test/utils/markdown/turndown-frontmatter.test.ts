import { describe, it, expect } from "vitest";
import { turndown, roundTrip } from "./setup";

describe("turndown frontmatter rule", () => {
	it("should convert frontmatter div to YAML block", () => {
		const html = `<div class="frontmatter-block" data-content="title: Test"><pre>title: Test</pre></div>`;
		const result = turndown.turndown(html);

		expect(result).toContain("---");
		expect(result).toContain("title: Test");
		expect(result).toMatch(/^---\ntitle: Test\n---/);
	});

	it("should handle multi-line frontmatter", () => {
		const html = `<div class="frontmatter-block" data-content="title: Test\nauthor: me"><pre>title: Test\nauthor: me</pre></div>`;
		const result = turndown.turndown(html);

		expect(result).toContain("title: Test");
		expect(result).toContain("author: me");
	});

	it("should handle escaped HTML entities in data-content", () => {
		const html = `<div class="frontmatter-block" data-content="title: &quot;Hello &lt;World&gt;&quot;"><pre>title: &quot;Hello &lt;World&gt;&quot;</pre></div>`;
		const result = turndown.turndown(html);

		expect(result).toContain('title: "Hello <World>"');
	});

	it("should handle frontmatter with only whitespace content", () => {
		const html = `<div class="frontmatter-block" data-content="draft: true"><pre>draft: true</pre></div>`;
		const result = turndown.turndown(html);

		expect(result).toMatch(/^---\ndraft: true\n---/);
	});
});

describe("turndown frontmatter round-trip", () => {
	it("should preserve frontmatter through round-trip", () => {
		const md = "---\ntitle: Test\nauthor: me\n---\n\n# Content";
		const result = roundTrip(md);

		expect(result).toContain("---\ntitle: Test\nauthor: me\n---");
		expect(result).toContain("# Content");
	});
});
