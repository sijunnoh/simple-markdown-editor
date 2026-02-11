import { describe, it, expect } from "vitest";

/**
 * Tests for table menu logic used by useTableMenu.
 * Tests the pure logic patterns without DOM/React dependencies.
 */
describe("use-table-menu", () => {
	describe("table menu position calculation", () => {
		function calculateTableMenuPosition(
			tableRect: { right: number; top: number },
			paneRect: { top: number; bottom: number },
		): { x: number; y: number } | null {
			if (tableRect.top >= paneRect.bottom) {
				return null; // table below visible area
			}
			return {
				x: tableRect.right - 32,
				y: Math.max(tableRect.top + 4, paneRect.top + 4),
			};
		}

		it("should position menu at table right edge minus offset", () => {
			const pos = calculateTableMenuPosition(
				{ right: 500, top: 200 },
				{ top: 0, bottom: 800 },
			);
			expect(pos).toEqual({ x: 468, y: 204 });
		});

		it("should clamp y to pane top when table is near top", () => {
			const pos = calculateTableMenuPosition(
				{ right: 500, top: -10 },
				{ top: 0, bottom: 800 },
			);
			expect(pos).toEqual({ x: 468, y: 4 });
		});

		it("should return null when table is below visible area", () => {
			const pos = calculateTableMenuPosition(
				{ right: 500, top: 900 },
				{ top: 0, bottom: 800 },
			);
			expect(pos).toBeNull();
		});

		it("should handle table at exact pane boundary", () => {
			const pos = calculateTableMenuPosition(
				{ right: 500, top: 799 },
				{ top: 0, bottom: 800 },
			);
			expect(pos).toEqual({ x: 468, y: 803 });
		});

		it("should handle scrolled pane with offset top", () => {
			const pos = calculateTableMenuPosition(
				{ right: 600, top: 100 },
				{ top: 50, bottom: 500 },
			);
			expect(pos).toEqual({ x: 568, y: 104 });
		});

		it("should use pane top when table top is above pane", () => {
			const pos = calculateTableMenuPosition(
				{ right: 600, top: 30 },
				{ top: 50, bottom: 500 },
			);
			expect(pos).toEqual({ x: 568, y: 54 });
		});
	});

	describe("table visibility detection", () => {
		function isTableVisible(
			tableRect: { top: number; bottom: number },
			paneRect: { top: number; bottom: number },
		): boolean {
			return tableRect.top < paneRect.bottom && tableRect.bottom > paneRect.top;
		}

		it("should detect fully visible table", () => {
			expect(isTableVisible(
				{ top: 100, bottom: 300 },
				{ top: 0, bottom: 800 },
			)).toBe(true);
		});

		it("should detect partially visible table (top clipped)", () => {
			expect(isTableVisible(
				{ top: -50, bottom: 100 },
				{ top: 0, bottom: 800 },
			)).toBe(true);
		});

		it("should detect partially visible table (bottom clipped)", () => {
			expect(isTableVisible(
				{ top: 700, bottom: 900 },
				{ top: 0, bottom: 800 },
			)).toBe(true);
		});

		it("should not detect table completely above pane", () => {
			expect(isTableVisible(
				{ top: -200, bottom: -10 },
				{ top: 0, bottom: 800 },
			)).toBe(false);
		});

		it("should not detect table completely below pane", () => {
			expect(isTableVisible(
				{ top: 900, bottom: 1100 },
				{ top: 0, bottom: 800 },
			)).toBe(false);
		});

		it("should handle exact boundary (top equals bottom)", () => {
			expect(isTableVisible(
				{ top: 0, bottom: 800 },
				{ top: 0, bottom: 800 },
			)).toBe(true);
		});
	});

	describe("editor pane click detection", () => {
		function shouldInsertParagraph(
			lastNodeType: string,
			lastNodeTextLength: number,
		): boolean {
			return lastNodeType !== "paragraph" || lastNodeTextLength > 0;
		}

		it("should insert paragraph when last node is heading", () => {
			expect(shouldInsertParagraph("heading", 5)).toBe(true);
		});

		it("should insert paragraph when last node is non-empty paragraph", () => {
			expect(shouldInsertParagraph("paragraph", 10)).toBe(true);
		});

		it("should not insert paragraph when last node is empty paragraph", () => {
			expect(shouldInsertParagraph("paragraph", 0)).toBe(false);
		});

		it("should insert paragraph when last node is code block", () => {
			expect(shouldInsertParagraph("codeBlock", 20)).toBe(true);
		});

		it("should insert paragraph when last node is table", () => {
			expect(shouldInsertParagraph("table", 0)).toBe(true);
		});

		it("should insert paragraph when last node is image", () => {
			expect(shouldInsertParagraph("image", 0)).toBe(true);
		});
	});

	describe("link click prevention logic", () => {
		function shouldPreventLinkClick(
			targetTagName: string,
			isInsideProseMirror: boolean,
		): boolean {
			return targetTagName === "A" && isInsideProseMirror;
		}

		it("should prevent link click inside ProseMirror", () => {
			expect(shouldPreventLinkClick("A", true)).toBe(true);
		});

		it("should not prevent link click outside ProseMirror", () => {
			expect(shouldPreventLinkClick("A", false)).toBe(false);
		});

		it("should not prevent non-link click inside ProseMirror", () => {
			expect(shouldPreventLinkClick("SPAN", true)).toBe(false);
		});

		it("should not prevent non-link click outside ProseMirror", () => {
			expect(shouldPreventLinkClick("DIV", false)).toBe(false);
		});
	});
});
