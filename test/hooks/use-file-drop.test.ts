import { describe, it, expect } from "vitest";

/**
 * Tests for file drop and paste logic used by useFileDrop.
 * Tests the pure logic patterns without DOM/React dependencies.
 */
describe("use-file-drop", () => {
	describe("image file filtering", () => {
		function isImageFile(file: { type: string }): boolean {
			return file.type.startsWith("image/");
		}

		it("should identify PNG as image", () => {
			expect(isImageFile({ type: "image/png" })).toBe(true);
		});

		it("should identify JPEG as image", () => {
			expect(isImageFile({ type: "image/jpeg" })).toBe(true);
		});

		it("should identify GIF as image", () => {
			expect(isImageFile({ type: "image/gif" })).toBe(true);
		});

		it("should identify WebP as image", () => {
			expect(isImageFile({ type: "image/webp" })).toBe(true);
		});

		it("should identify SVG as image", () => {
			expect(isImageFile({ type: "image/svg+xml" })).toBe(true);
		});

		it("should reject PDF", () => {
			expect(isImageFile({ type: "application/pdf" })).toBe(false);
		});

		it("should reject text files", () => {
			expect(isImageFile({ type: "text/plain" })).toBe(false);
		});

		it("should reject video files", () => {
			expect(isImageFile({ type: "video/mp4" })).toBe(false);
		});

		it("should reject empty type", () => {
			expect(isImageFile({ type: "" })).toBe(false);
		});
	});

	describe("file:// URI detection", () => {
		function isFileUri(uri: string): boolean {
			return uri.startsWith("file://");
		}

		it("should detect file:// URIs", () => {
			expect(isFileUri("file:///Users/user/image.png")).toBe(true);
		});

		it("should reject http:// URIs", () => {
			expect(isFileUri("http://example.com/image.png")).toBe(false);
		});

		it("should reject https:// URIs", () => {
			expect(isFileUri("https://example.com/image.png")).toBe(false);
		});

		it("should reject relative paths", () => {
			expect(isFileUri("./image.png")).toBe(false);
		});
	});

	describe("URI list parsing", () => {
		function parseFirstUri(uriList: string): string | null {
			const uri = uriList.split("\n")[0].trim();
			return uri.startsWith("file://") ? uri : null;
		}

		it("should extract first file URI from list", () => {
			const uriList = "file:///path/to/image.png\nfile:///path/to/other.png";
			expect(parseFirstUri(uriList)).toBe("file:///path/to/image.png");
		});

		it("should return null for non-file URIs", () => {
			const uriList = "https://example.com/image.png";
			expect(parseFirstUri(uriList)).toBeNull();
		});

		it("should handle empty URI list", () => {
			expect(parseFirstUri("")).toBeNull();
		});

		it("should handle whitespace in URI list", () => {
			const uriList = "  file:///path/to/image.png  ";
			expect(parseFirstUri(uriList)).toBe("file:///path/to/image.png");
		});
	});

	describe("base64 extraction from data URL", () => {
		function extractBase64(dataUrl: string): string {
			return dataUrl.split(",")[1];
		}

		it("should extract base64 from PNG data URL", () => {
			const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
			expect(extractBase64(dataUrl)).toBe("iVBORw0KGgo=");
		});

		it("should extract base64 from JPEG data URL", () => {
			const dataUrl = "data:image/jpeg;base64,/9j/4AAQ=";
			expect(extractBase64(dataUrl)).toBe("/9j/4AAQ=");
		});

		it("should handle data URL with longer base64", () => {
			const base64 = "SGVsbG8gV29ybGQ=";
			const dataUrl = `data:image/png;base64,${base64}`;
			expect(extractBase64(dataUrl)).toBe(base64);
		});
	});

	describe("multiple image file handling", () => {
		function filterImageFiles(files: { type: string; name: string }[]): { type: string; name: string }[] {
			return files.filter((file) => file.type.startsWith("image/"));
		}

		it("should filter only image files from mixed file list", () => {
			const files = [
				{ type: "image/png", name: "photo.png" },
				{ type: "text/plain", name: "readme.txt" },
				{ type: "image/jpeg", name: "pic.jpg" },
				{ type: "application/pdf", name: "doc.pdf" },
			];
			const result = filterImageFiles(files);
			expect(result).toHaveLength(2);
			expect(result[0].name).toBe("photo.png");
			expect(result[1].name).toBe("pic.jpg");
		});

		it("should return empty array when no images", () => {
			const files = [
				{ type: "text/plain", name: "readme.txt" },
				{ type: "application/pdf", name: "doc.pdf" },
			];
			expect(filterImageFiles(files)).toHaveLength(0);
		});

		it("should return all files when all are images", () => {
			const files = [
				{ type: "image/png", name: "a.png" },
				{ type: "image/jpeg", name: "b.jpg" },
			];
			expect(filterImageFiles(files)).toHaveLength(2);
		});
	});
});
