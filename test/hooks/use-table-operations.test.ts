import { describe, it, expect } from "vitest";

/**
 * Tests for table operations logic used by useTableOperations.
 * Tests the pure logic patterns without DOM/React dependencies.
 */
describe("use-table-operations", () => {
	describe("context menu position boundary check", () => {
		const menuWidth = 180;
		const menuHeight = 280;

		function calculateMenuPosition(
			clientX: number,
			clientY: number,
			innerWidth: number,
			innerHeight: number,
		): { x: number; y: number } {
			const x = Math.min(clientX, innerWidth - menuWidth - 10);
			const y = Math.min(clientY, innerHeight - menuHeight - 10);
			return { x, y };
		}

		it("should use click position when within bounds", () => {
			const pos = calculateMenuPosition(100, 200, 1024, 768);
			expect(pos.x).toBe(100);
			expect(pos.y).toBe(200);
		});

		it("should clamp x when near right edge", () => {
			const pos = calculateMenuPosition(900, 200, 1024, 768);
			expect(pos.x).toBe(1024 - 180 - 10); // 834
			expect(pos.y).toBe(200);
		});

		it("should clamp y when near bottom edge", () => {
			const pos = calculateMenuPosition(100, 600, 1024, 768);
			expect(pos.x).toBe(100);
			expect(pos.y).toBe(768 - 280 - 10); // 478
		});

		it("should clamp both x and y when near corner", () => {
			const pos = calculateMenuPosition(950, 700, 1024, 768);
			expect(pos.x).toBe(834);
			expect(pos.y).toBe(478);
		});

		it("should handle zero position", () => {
			const pos = calculateMenuPosition(0, 0, 1024, 768);
			expect(pos.x).toBe(0);
			expect(pos.y).toBe(0);
		});

		it("should handle exact boundary position", () => {
			const pos = calculateMenuPosition(834, 478, 1024, 768);
			expect(pos.x).toBe(834);
			expect(pos.y).toBe(478);
		});
	});

	describe("isInFirstRow logic", () => {
		// Simulate the row-finding logic from isInFirstRow
		function findRowIndex(
			nodes: { name: string; depth: number }[],
			parentIndex: number,
		): number | null {
			for (const node of nodes) {
				if (node.name === "tableRow") {
					return parentIndex;
				}
			}
			return null;
		}

		it("should return 0 for first row", () => {
			const nodes = [{ name: "tableRow", depth: 2 }];
			expect(findRowIndex(nodes, 0)).toBe(0);
		});

		it("should return index for other rows", () => {
			const nodes = [{ name: "tableRow", depth: 2 }];
			expect(findRowIndex(nodes, 2)).toBe(2);
		});

		it("should return null when no tableRow found", () => {
			const nodes = [{ name: "paragraph", depth: 1 }];
			expect(findRowIndex(nodes, 0)).toBeNull();
		});
	});

	describe("cell type determination", () => {
		function shouldConvertToHeader(rowIndex: number): boolean {
			return rowIndex === 0;
		}

		function getCellTypeName(toHeader: boolean): string {
			return toHeader ? "tableHeader" : "tableCell";
		}

		it("should convert first row to header", () => {
			expect(shouldConvertToHeader(0)).toBe(true);
			expect(getCellTypeName(true)).toBe("tableHeader");
		});

		it("should not convert other rows to header", () => {
			expect(shouldConvertToHeader(1)).toBe(false);
			expect(shouldConvertToHeader(5)).toBe(false);
		});

		it("should return tableCell for non-header", () => {
			expect(getCellTypeName(false)).toBe("tableCell");
		});
	});

	describe("add row above first row behavior", () => {
		// When adding row above first row, the new row becomes header
		// and the old first row becomes data cells
		interface RowConversion {
			rowIndex: number;
			toHeader: boolean;
		}

		function getConversionsForAddAbove(wasInFirstRow: boolean): RowConversion[] {
			if (!wasInFirstRow) {
				return [];
			}
			return [
				{ rowIndex: 0, toHeader: true },  // New first row -> header
				{ rowIndex: 1, toHeader: false },  // Old first row -> data
			];
		}

		it("should convert both rows when adding above first row", () => {
			const conversions = getConversionsForAddAbove(true);
			expect(conversions).toHaveLength(2);
			expect(conversions[0]).toEqual({ rowIndex: 0, toHeader: true });
			expect(conversions[1]).toEqual({ rowIndex: 1, toHeader: false });
		});

		it("should not convert rows when adding above non-first row", () => {
			const conversions = getConversionsForAddAbove(false);
			expect(conversions).toHaveLength(0);
		});
	});

	describe("delete first row behavior", () => {
		function getConversionsForDeleteRow(wasInFirstRow: boolean): { rowIndex: number; toHeader: boolean }[] {
			if (!wasInFirstRow) {
				return [];
			}
			return [{ rowIndex: 0, toHeader: true }];
		}

		it("should convert new first row to header after deleting first row", () => {
			const conversions = getConversionsForDeleteRow(true);
			expect(conversions).toHaveLength(1);
			expect(conversions[0]).toEqual({ rowIndex: 0, toHeader: true });
		});

		it("should not convert any rows when deleting non-first row", () => {
			const conversions = getConversionsForDeleteRow(false);
			expect(conversions).toHaveLength(0);
		});
	});
});
