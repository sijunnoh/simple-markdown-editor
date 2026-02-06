import { describe, it, expect } from "vitest";
import { turndown } from "./setup";

describe("turndown image rule", () => {
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

		const lines = result.split("\n").filter(l => l.trim() !== "");
		const imageLine = lines.find(l => l.includes("![pic]"));
		expect(imageLine).toBeDefined();

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
