import { describe, it, expect } from "vitest";
import { turndown, roundTrip } from "./setup";

describe("turndown math inline rule", () => {
	it("should convert math-inline span to dollar syntax", () => {
		const html = `<span class="math-inline" data-latex="E=mc^2">E=mc^2</span>`;
		const result = turndown.turndown(html);

		expect(result).toBe("$E=mc^2$");
	});

	it("should handle LaTeX with special characters", () => {
		const html = `<span class="math-inline" data-latex="\\frac{a}{b}">\\frac{a}{b}</span>`;
		const result = turndown.turndown(html);

		expect(result).toContain("$\\frac{a}{b}$");
	});

	it("should handle math inline within paragraph", () => {
		const html = `<p>The formula <span class="math-inline" data-latex="x^2">x^2</span> is simple</p>`;
		const result = turndown.turndown(html);

		expect(result).toContain("$x^2$");
		expect(result).toContain("The formula");
		expect(result).toContain("is simple");
	});
});

describe("turndown math block rule", () => {
	it("should convert math-block div to double dollar syntax", () => {
		const html = `<div class="math-block" data-latex="\\sum_{i=1}^n i">\\sum_{i=1}^n i</div>`;
		const result = turndown.turndown(html);

		expect(result).toContain("$$");
		expect(result).toContain("\\sum_{i=1}^n i");
	});

	it("should wrap block math with newlines", () => {
		const html = `<p>Before</p><div class="math-block" data-latex="x=y">x=y</div><p>After</p>`;
		const result = turndown.turndown(html);

		expect(result).toContain("$$\nx=y\n$$");
	});

	it("should handle multi-line latex", () => {
		const html = `<div class="math-block" data-latex="a = b\nc = d">a = b\nc = d</div>`;
		const result = turndown.turndown(html);

		expect(result).toContain("a = b\nc = d");
		expect(result).toContain("$$");
	});
});

describe("turndown math round-trip", () => {
	it("should preserve inline math through round-trip", () => {
		const md = "The formula $E=mc^2$ is famous";
		const result = roundTrip(md);

		expect(result).toContain("$E=mc^2$");
	});

	it("should preserve block math through round-trip", () => {
		const md = "$$\n\\sum_{i=1}^n i\n$$";
		const result = roundTrip(md);

		expect(result).toContain("$$");
		expect(result).toContain("\\sum_{i=1}^n i");
	});
});
