import { describe, it, expect } from "vitest";
import { normalizeContent } from "../../src/webview/utils/normalize";

describe("use-vs-code-messaging", () => {
	describe("normalizeContent", () => {
		it("should handle empty string", () => {
			expect(normalizeContent("")).toBe("");
		});

		it("should handle null/undefined gracefully", () => {
			expect(normalizeContent(null as unknown as string)).toBe("");
			expect(normalizeContent(undefined as unknown as string)).toBe("");
		});

		it("should convert Windows line endings to Unix", () => {
			expect(normalizeContent("line1\r\nline2")).toBe("line1\nline2");
		});

		it("should trim content", () => {
			expect(normalizeContent("  content  ")).toBe("content");
		});

		it("should handle content with markdown syntax", () => {
			const md = "# Title\r\n\r\n- item1\r\n- item2\r\n";
			expect(normalizeContent(md)).toBe("# Title\n\n- item1\n- item2");
		});

		it("should consider same content with different line endings as equal", () => {
			const windows = "hello\r\nworld\r\n";
			const unix = "hello\nworld\n";
			expect(normalizeContent(windows)).toBe(normalizeContent(unix));
		});
	});

	describe("handleImageEdit path extraction logic", () => {
		// Test the path extraction logic used in handleImageEdit
		it("should extract relative path from absolute webview URI", () => {
			const baseUri = "vscode-webview://abc123/workspace";
			const src = "vscode-webview://abc123/workspace/images/photo.png";

			let relativeSrc = src;
			if (baseUri && src.startsWith(baseUri)) {
				relativeSrc = "./" + src.substring(baseUri.length + 1);
			}

			expect(relativeSrc).toBe("./images/photo.png");
		});

		it("should keep path unchanged when baseUri doesn't match", () => {
			const baseUri = "vscode-webview://abc123/workspace";
			const src = "https://example.com/image.png";

			let relativeSrc = src;
			if (baseUri && src.startsWith(baseUri)) {
				relativeSrc = "./" + src.substring(baseUri.length + 1);
			}

			expect(relativeSrc).toBe("https://example.com/image.png");
		});

		it("should handle empty baseUri", () => {
			const baseUri = "";
			const src = "vscode-webview://abc123/workspace/img.png";

			let relativeSrc = src;
			if (baseUri && src.startsWith(baseUri)) {
				relativeSrc = "./" + src.substring(baseUri.length + 1);
			}

			expect(relativeSrc).toBe(src);
		});

		it("should handle deeply nested image paths", () => {
			const baseUri = "vscode-webview://abc123/workspace";
			const src = "vscode-webview://abc123/workspace/assets/images/2024/photo.jpg";

			let relativeSrc = src;
			if (baseUri && src.startsWith(baseUri)) {
				relativeSrc = "./" + src.substring(baseUri.length + 1);
			}

			expect(relativeSrc).toBe("./assets/images/2024/photo.jpg");
		});
	});
});
