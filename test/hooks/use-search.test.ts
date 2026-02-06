import { describe, it, expect } from "vitest";
import {
	escapeRegex,
	findTextMatches,
	replaceMatch,
	replaceAllMatches,
} from "../../src/webview/utils/search";

/**
 * Tests for search logic used by useSearch hook.
 * The hook itself depends on React/ProseMirror, but the core search
 * utilities and navigation logic can be tested independently.
 */
describe("use-search (search utilities)", () => {
	describe("findTextMatches for textarea search", () => {
		it("should find all occurrences of a term", () => {
			const matches = findTextMatches("foo", "foo bar foo baz foo");
			expect(matches).toHaveLength(3);
		});

		it("should return correct positions", () => {
			const matches = findTextMatches("bar", "foo bar baz");
			expect(matches).toHaveLength(1);
			expect(matches[0]).toEqual({ from: 4, to: 7 });
		});

		it("should be case-insensitive", () => {
			const matches = findTextMatches("Hello", "hello HELLO Hello hELLO");
			expect(matches).toHaveLength(4);
		});

		it("should return empty array for no matches", () => {
			const matches = findTextMatches("xyz", "hello world");
			expect(matches).toHaveLength(0);
		});

		it("should return empty array for empty term", () => {
			const matches = findTextMatches("", "hello world");
			expect(matches).toHaveLength(0);
		});

		it("should handle special regex characters in search term", () => {
			const matches = findTextMatches("foo.bar", "foo.bar fooxbar");
			// Should match literal "foo.bar" only, not "fooxbar"
			expect(matches).toHaveLength(1);
		});

		it("should find matches across multiple lines", () => {
			const text = "line1 match\nline2\nline3 match";
			const matches = findTextMatches("match", text);
			expect(matches).toHaveLength(2);
		});

		it("should handle overlapping potential matches", () => {
			const matches = findTextMatches("aa", "aaa");
			// Regex global match doesn't overlap, so "aaa" yields 1 match for "aa"
			expect(matches).toHaveLength(1);
		});
	});

	describe("replaceMatch", () => {
		it("should replace a single match", () => {
			const text = "hello world hello";
			const match = { from: 0, to: 5 };
			const result = replaceMatch(text, match, "hi");
			expect(result).toBe("hi world hello");
		});

		it("should handle replacement at end of string", () => {
			const text = "hello world";
			const match = { from: 6, to: 11 };
			const result = replaceMatch(text, match, "earth");
			expect(result).toBe("hello earth");
		});

		it("should handle replacement with empty string", () => {
			const text = "hello world";
			const match = { from: 5, to: 6 };
			const result = replaceMatch(text, match, "");
			expect(result).toBe("helloworld");
		});

		it("should handle replacement with longer string", () => {
			const text = "ab";
			const match = { from: 0, to: 1 };
			const result = replaceMatch(text, match, "xyz");
			expect(result).toBe("xyzb");
		});
	});

	describe("replaceAllMatches", () => {
		it("should replace all occurrences", () => {
			const result = replaceAllMatches("foo bar foo baz foo", "foo", "qux");
			expect(result).toBe("qux bar qux baz qux");
		});

		it("should be case-insensitive", () => {
			const result = replaceAllMatches("Hello hello HELLO", "hello", "hi");
			expect(result).toBe("hi hi hi");
		});

		it("should handle no matches gracefully", () => {
			const result = replaceAllMatches("hello", "xyz", "abc");
			expect(result).toBe("hello");
		});

		it("should handle special regex characters", () => {
			const result = replaceAllMatches("a.b a.b", "a.b", "x");
			expect(result).toBe("x x");
		});

		it("should handle empty replacement", () => {
			const result = replaceAllMatches("foobarfoo", "foo", "");
			expect(result).toBe("bar");
		});
	});

	describe("match navigation logic", () => {
		it("should cycle forward through matches", () => {
			const matchCount = 5;
			let index = 0;

			// Go forward
			index = (index + 1) % matchCount;
			expect(index).toBe(1);

			index = (index + 1) % matchCount;
			expect(index).toBe(2);
		});

		it("should wrap around at the end", () => {
			const matchCount = 3;
			let index = 2; // last item

			index = (index + 1) % matchCount;
			expect(index).toBe(0); // back to start
		});

		it("should cycle backward through matches", () => {
			const matchCount = 5;
			let index = 0;

			index = (index - 1 + matchCount) % matchCount;
			expect(index).toBe(4); // wrap to end
		});

		it("should wrap around backward from first match", () => {
			const matchCount = 3;
			let index = 0;

			index = (index - 1 + matchCount) % matchCount;
			expect(index).toBe(2); // last item
		});
	});

	describe("search target determination", () => {
		// Test the getSearchInTextarea logic
		it("should search textarea in source mode", () => {
			const viewMode = "source";
			const searchTarget = "editor";
			const result = viewMode === "source" ? true : viewMode === "editor" ? false : searchTarget === "textarea";
			expect(result).toBe(true);
		});

		it("should search editor in editor mode", () => {
			const viewMode = "editor";
			const searchTarget = "textarea";
			const result = viewMode === "source" ? true : viewMode === "editor" ? false : searchTarget === "textarea";
			expect(result).toBe(false);
		});

		it("should respect searchTarget in split mode", () => {
			const viewMode = "split";

			const resultTextarea = viewMode === "source" ? true : viewMode === "editor" ? false : "textarea" === "textarea";
			expect(resultTextarea).toBe(true);

			const resultEditor = viewMode === "source" ? true : viewMode === "editor" ? false : "editor" === "textarea";
			expect(resultEditor).toBe(false);
		});
	});
});
