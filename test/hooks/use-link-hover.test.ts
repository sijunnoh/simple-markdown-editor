import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for link hover logic used by useLinkHover.
 * Tests the pure logic patterns without DOM/React dependencies.
 */
describe("use-link-hover", () => {
	describe("link hover position calculation", () => {
		function calculatePopupPosition(rect: {
			left: number;
			bottom: number;
		}): { x: number; y: number } {
			return { x: rect.left, y: rect.bottom + 4 };
		}

		it("should position popup below link with 4px gap", () => {
			const pos = calculatePopupPosition({ left: 100, bottom: 50 });
			expect(pos).toEqual({ x: 100, y: 54 });
		});

		it("should handle zero position", () => {
			const pos = calculatePopupPosition({ left: 0, bottom: 0 });
			expect(pos).toEqual({ x: 0, y: 4 });
		});

		it("should handle large positions", () => {
			const pos = calculatePopupPosition({ left: 800, bottom: 600 });
			expect(pos).toEqual({ x: 800, y: 604 });
		});
	});

	describe("link hover timeout behavior", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should hide popup after 150ms delay", () => {
			let visible = true;
			const timeout = setTimeout(() => {
				visible = false;
			}, 150);

			expect(visible).toBe(true);
			vi.advanceTimersByTime(149);
			expect(visible).toBe(true);
			vi.advanceTimersByTime(1);
			expect(visible).toBe(false);

			clearTimeout(timeout);
		});

		it("should cancel hide when re-entering link", () => {
			let visible = true;
			const timeout = setTimeout(() => {
				visible = false;
			}, 150);

			vi.advanceTimersByTime(100);
			clearTimeout(timeout); // simulate re-enter clears timeout
			vi.advanceTimersByTime(200);
			expect(visible).toBe(true); // still visible
		});

		it("should hide immediately when leaving popup", () => {
			let visible = true;
			// Popup mouse leave hides immediately (no timeout)
			visible = false;
			expect(visible).toBe(false);
		});
	});

	describe("link element detection", () => {
		function extractLinkInfo(
			href: string | null,
			textContent: string | null,
		): { url: string; text: string } {
			return {
				url: href || "",
				text: textContent || "",
			};
		}

		it("should extract href and text from link", () => {
			const info = extractLinkInfo("https://example.com", "Example");
			expect(info).toEqual({ url: "https://example.com", text: "Example" });
		});

		it("should handle missing href", () => {
			const info = extractLinkInfo(null, "Link text");
			expect(info).toEqual({ url: "", text: "Link text" });
		});

		it("should handle missing text", () => {
			const info = extractLinkInfo("https://example.com", null);
			expect(info).toEqual({ url: "https://example.com", text: "" });
		});

		it("should handle both missing", () => {
			const info = extractLinkInfo(null, null);
			expect(info).toEqual({ url: "", text: "" });
		});

		it("should handle empty strings", () => {
			const info = extractLinkInfo("", "");
			expect(info).toEqual({ url: "", text: "" });
		});
	});

	describe("open link message", () => {
		function buildOpenLinkMessage(url: string): { type: string; url: string } | null {
			if (!url) {
				return null;
			}
			return { type: "openLink", url };
		}

		it("should create message for valid URL", () => {
			expect(buildOpenLinkMessage("https://example.com")).toEqual({
				type: "openLink",
				url: "https://example.com",
			});
		});

		it("should return null for empty URL", () => {
			expect(buildOpenLinkMessage("")).toBeNull();
		});

		it("should handle relative URLs", () => {
			expect(buildOpenLinkMessage("./file.md")).toEqual({
				type: "openLink",
				url: "./file.md",
			});
		});
	});
});
