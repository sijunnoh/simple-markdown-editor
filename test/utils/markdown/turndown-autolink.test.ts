import { describe, it, expect } from "vitest";
import { turndown, roundTrip } from "./setup";

describe("turndown autolink stripping", () => {
	describe("stripAutolinkedNonUrls rule", () => {
		it("should strip autolinked .md filenames", () => {
			const html = '<h1><a href="http://CLAUDE.md">CLAUDE.md</a></h1>';
			expect(turndown.turndown(html)).toBe("# CLAUDE.md");
		});

		it("should strip autolinked README.md", () => {
			const html = '<p><a href="http://README.md">README.md</a></p>';
			expect(turndown.turndown(html).trim()).toBe("README.md");
		});

		it("should strip autolinked example.com", () => {
			const html = '<p><a href="http://example.com">example.com</a></p>';
			expect(turndown.turndown(html).trim()).toBe("example.com");
		});

		it("should strip autolinked package.json", () => {
			const html = '<p><a href="http://package.json">package.json</a></p>';
			expect(turndown.turndown(html).trim()).toBe("package.json");
		});

		it("should preserve real https links", () => {
			const html = '<p><a href="https://example.com">https://example.com</a></p>';
			expect(turndown.turndown(html).trim()).toBe("[https://example.com](https://example.com)");
		});

		it("should preserve real http links", () => {
			const html = '<p><a href="http://google.com/search?q=test">http://google.com/search?q=test</a></p>';
			expect(turndown.turndown(html).trim()).toBe("[http://google.com/search?q=test](http://google.com/search?q=test)");
		});

		it("should preserve markdown-style links with display text", () => {
			const html = '<p><a href="https://google.com">Google</a></p>';
			expect(turndown.turndown(html).trim()).toBe("[Google](https://google.com)");
		});

		it("should preserve links where text differs from href", () => {
			const html = '<p><a href="https://github.com/user/repo">Visit repo</a></p>';
			expect(turndown.turndown(html).trim()).toBe("[Visit repo](https://github.com/user/repo)");
		});

		it("should handle autolinked text inside heading", () => {
			const html = '<h2><a href="http://test.md">test.md</a></h2>';
			expect(turndown.turndown(html)).toBe("## test.md");
		});

		it("should handle mixed content with autolinked and real links", () => {
			const html = '<p><a href="http://CLAUDE.md">CLAUDE.md</a> and <a href="https://example.com">https://example.com</a></p>';
			const result = turndown.turndown(html).trim();
			expect(result).toContain("CLAUDE.md");
			expect(result).not.toContain("[CLAUDE.md]");
			expect(result).toContain("[https://example.com](https://example.com)");
		});
	});

	describe("roundtrip: md → HTML → md preserves content", () => {
		it("should preserve heading with .md filename", () => {
			expect(roundTrip("# CLAUDE.md")).toBe("# CLAUDE.md");
		});

		it("should preserve heading with normal text", () => {
			expect(roundTrip("# Hello World")).toBe("# Hello World");
		});

		it("should preserve body text with filenames", () => {
			const md = "CLAUDE.md README.md package.json app.tsx";
			expect(roundTrip(md)).toBe(md);
		});

		it("should preserve markdown link syntax", () => {
			expect(roundTrip("[Google](https://google.com)")).toBe("[Google](https://google.com)");
		});

		it("should preserve bare https URL as link", () => {
			const result = roundTrip("https://example.com");
			expect(result).toContain("https://example.com");
		});

		it("should preserve inline URL in text", () => {
			const result = roundTrip("Visit https://github.com/user/repo for details.");
			expect(result).toContain("https://github.com/user/repo");
			expect(result).toContain("Visit");
			expect(result).toContain("for details.");
		});

		it("should not corrupt domain-like text without protocol", () => {
			expect(roundTrip("example.com")).toBe("example.com");
		});

		it("should not corrupt dotted abbreviations", () => {
			const result = roundTrip("e.g. this works");
			expect(result).toBe("e.g. this works");
		});
	});
});
