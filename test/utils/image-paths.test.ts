import { describe, it, expect } from "vitest";
import {
	transformImagePaths,
	untransformImagePaths,
	toWebviewUri,
} from "../../src/webview/utils/image-paths";

describe("imagePaths", () => {
	const baseUri = "vscode-webview://abc123/workspace";

	describe("transformImagePaths", () => {
		it("should return html unchanged if no baseUri", () => {
			const html = '<img src="./image.png">';
			expect(transformImagePaths(html, "")).toBe(html);
		});

		it("should transform relative path starting with ./", () => {
			const html = '<img src="./images/photo.png">';
			const result = transformImagePaths(html, baseUri);
			expect(result).toBe(
				`<img src="${baseUri}/images/photo.png">`,
			);
		});

		it("should transform relative path without ./", () => {
			const html = '<img src="images/photo.png">';
			const result = transformImagePaths(html, baseUri);
			expect(result).toBe(`<img src="${baseUri}/images/photo.png">`);
		});

		it("should not transform http URLs", () => {
			const html = '<img src="https://example.com/image.png">';
			const result = transformImagePaths(html, baseUri);
			expect(result).toBe(html);
		});

		it("should not transform data URLs", () => {
			const html = '<img src="data:image/png;base64,abc123">';
			const result = transformImagePaths(html, baseUri);
			expect(result).toBe(html);
		});

		it("should not transform already transformed URLs", () => {
			const html = `<img src="vscode-webview-resource://abc/image.png">`;
			const result = transformImagePaths(html, baseUri);
			expect(result).toBe(html);
		});

		it("should handle multiple images", () => {
			const html = '<img src="./a.png"><img src="./b.png">';
			const result = transformImagePaths(html, baseUri);
			expect(result).toBe(
				`<img src="${baseUri}/a.png"><img src="${baseUri}/b.png">`,
			);
		});

		it("should preserve other attributes", () => {
			const html = '<img src="./image.png" alt="test" width="100">';
			const result = transformImagePaths(html, baseUri);
			expect(result).toBe(
				`<img src="${baseUri}/image.png" alt="test" width="100">`,
			);
		});
	});

	describe("untransformImagePaths", () => {
		it("should return markdown unchanged if no baseUri", () => {
			const md = "![alt](./image.png)";
			expect(untransformImagePaths(md, "")).toBe(md);
		});

		it("should transform webview URI back to relative path in markdown", () => {
			const md = `![alt](${baseUri}/images/photo.png)`;
			const result = untransformImagePaths(md, baseUri);
			expect(result).toBe("![alt](./images/photo.png)");
		});

		it("should transform webview URI back to relative path in HTML img", () => {
			const md = `<img src="${baseUri}/images/photo.png" alt="test">`;
			const result = untransformImagePaths(md, baseUri);
			expect(result).toBe('<img src="./images/photo.png" alt="test">');
		});

		it("should handle special regex characters in baseUri", () => {
			const specialBaseUri = "vscode-webview://abc.123+test";
			const md = `![alt](${specialBaseUri}/image.png)`;
			const result = untransformImagePaths(md, specialBaseUri);
			expect(result).toBe("![alt](./image.png)");
		});

		it("should handle multiple images", () => {
			const md = `![a](${baseUri}/a.png)\n![b](${baseUri}/b.png)`;
			const result = untransformImagePaths(md, baseUri);
			expect(result).toBe("![a](./a.png)\n![b](./b.png)");
		});
	});

	describe("toWebviewUri", () => {
		it("should return path unchanged if no baseUri", () => {
			expect(toWebviewUri("./image.png", "")).toBe("./image.png");
		});

		it("should return http URLs unchanged", () => {
			expect(toWebviewUri("https://example.com/img.png", baseUri)).toBe(
				"https://example.com/img.png",
			);
		});

		it("should return data URLs unchanged", () => {
			const dataUri = "data:image/png;base64,abc";
			expect(toWebviewUri(dataUri, baseUri)).toBe(dataUri);
		});

		it("should convert relative path to webview URI", () => {
			expect(toWebviewUri("./images/photo.png", baseUri)).toBe(
				`${baseUri}/images/photo.png`,
			);
		});

		it("should remove leading ./", () => {
			expect(toWebviewUri("./image.png", baseUri)).toBe(
				`${baseUri}/image.png`,
			);
		});

		it("should encode special characters in path segments", () => {
			expect(toWebviewUri("./my folder/photo 1.png", baseUri)).toBe(
				`${baseUri}/my%20folder/photo%201.png`,
			);
		});

		it("should handle path without ./", () => {
			expect(toWebviewUri("images/photo.png", baseUri)).toBe(
				`${baseUri}/images/photo.png`,
			);
		});
	});
});
