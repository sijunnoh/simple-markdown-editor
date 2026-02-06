import { describe, it, expect } from "vitest";
import { clampTableDimensions, MODAL_DEFAULTS } from "../../src/webview/hooks/use-modals";

describe("clampTableDimensions", () => {
	it("should parse valid row and col strings", () => {
		const result = clampTableDimensions("5", "4");
		expect(result).toEqual({ rows: 5, cols: 4 });
	});

	it("should treat 0 as falsy and default to 3", () => {
		const result = clampTableDimensions("0", "0");
		expect(result.rows).toBe(3);
		expect(result.cols).toBe(3);
	});

	it("should clamp rows to minimum 1 for negative values", () => {
		const result = clampTableDimensions("-1", "3");
		expect(result.rows).toBe(1);
	});

	it("should clamp rows to maximum 20", () => {
		const result = clampTableDimensions("50", "3");
		expect(result.rows).toBe(20);
	});

	it("should clamp cols to minimum 1 for negative values", () => {
		const result = clampTableDimensions("3", "-1");
		expect(result.cols).toBe(1);
	});

	it("should clamp cols to maximum 10", () => {
		const result = clampTableDimensions("3", "15");
		expect(result.cols).toBe(10);
	});

	it("should default to 3 for non-numeric rows", () => {
		const result = clampTableDimensions("abc", "3");
		expect(result.rows).toBe(3);
	});

	it("should default to 3 for non-numeric cols", () => {
		const result = clampTableDimensions("3", "xyz");
		expect(result.cols).toBe(3);
	});

	it("should default to 3 for empty strings", () => {
		const result = clampTableDimensions("", "");
		expect(result).toEqual({ rows: 3, cols: 3 });
	});

	it("should handle negative numbers", () => {
		const result = clampTableDimensions("-5", "-3");
		expect(result.rows).toBe(1);
		expect(result.cols).toBe(1);
	});

	it("should handle decimal strings by truncating", () => {
		const result = clampTableDimensions("3.7", "4.2");
		expect(result).toEqual({ rows: 3, cols: 4 });
	});
});

describe("MODAL_DEFAULTS", () => {
	it("should have empty string defaults for text fields", () => {
		expect(MODAL_DEFAULTS.linkUrl).toBe("");
		expect(MODAL_DEFAULTS.linkText).toBe("");
		expect(MODAL_DEFAULTS.imageUrl).toBe("");
		expect(MODAL_DEFAULTS.imageAlt).toBe("");
	});

	it("should default table to 3x3", () => {
		expect(MODAL_DEFAULTS.tableRows).toBe("3");
		expect(MODAL_DEFAULTS.tableCols).toBe("3");
	});
});
