import { describe, it, expect } from "vitest";
import {
	escapeRegex,
	findTextMatches,
	replaceMatch,
	replaceAllMatches,
} from "../search";

describe("escapeRegex", () => {
	it("should escape dot", () => {
		expect(escapeRegex("file.txt")).toBe("file\\.txt");
	});

	it("should escape asterisk", () => {
		expect(escapeRegex("a*b")).toBe("a\\*b");
	});

	it("should escape plus", () => {
		expect(escapeRegex("a+b")).toBe("a\\+b");
	});

	it("should escape question mark", () => {
		expect(escapeRegex("why?")).toBe("why\\?");
	});

	it("should escape caret and dollar", () => {
		expect(escapeRegex("^start$end")).toBe("\\^start\\$end");
	});

	it("should escape curly braces", () => {
		expect(escapeRegex("{a}")).toBe("\\{a\\}");
	});

	it("should escape parentheses", () => {
		expect(escapeRegex("(group)")).toBe("\\(group\\)");
	});

	it("should escape pipe", () => {
		expect(escapeRegex("a|b")).toBe("a\\|b");
	});

	it("should escape square brackets", () => {
		expect(escapeRegex("[abc]")).toBe("\\[abc\\]");
	});

	it("should escape backslash", () => {
		expect(escapeRegex("a\\b")).toBe("a\\\\b");
	});

	it("should escape multiple special characters", () => {
		expect(escapeRegex("file.*(test)?")).toBe("file\\.\\*\\(test\\)\\?");
	});

	it("should not modify normal text", () => {
		expect(escapeRegex("hello world")).toBe("hello world");
	});

	it("should handle empty string", () => {
		expect(escapeRegex("")).toBe("");
	});

	it("should handle CJK characters", () => {
		expect(escapeRegex("한글테스트")).toBe("한글테스트");
	});
});

describe("findTextMatches", () => {
	it("should return empty array for empty search term", () => {
		expect(findTextMatches("", "hello world")).toEqual([]);
	});

	it("should find single match", () => {
		const matches = findTextMatches("world", "hello world");
		expect(matches).toEqual([{ from: 6, to: 11 }]);
	});

	it("should find multiple matches", () => {
		const matches = findTextMatches("ab", "ab cd ab ef ab");
		expect(matches).toEqual([
			{ from: 0, to: 2 },
			{ from: 6, to: 8 },
			{ from: 12, to: 14 },
		]);
	});

	it("should be case insensitive", () => {
		const matches = findTextMatches("hello", "Hello HELLO hello");
		expect(matches).toHaveLength(3);
	});

	it("should handle special regex characters in search term", () => {
		const matches = findTextMatches("file.txt", "open file.txt here");
		expect(matches).toEqual([{ from: 5, to: 13 }]);

		// Should NOT match "filextxt" (dot should be literal)
		const noMatch = findTextMatches("file.txt", "filextxt");
		expect(noMatch).toEqual([]);
	});

	it("should handle parentheses in search term", () => {
		const matches = findTextMatches("(test)", "call (test) here");
		expect(matches).toEqual([{ from: 5, to: 11 }]);
	});

	it("should return empty array when no match", () => {
		expect(findTextMatches("xyz", "hello world")).toEqual([]);
	});

	it("should handle overlapping potential matches", () => {
		// "aa" in "aaa" should find 2 matches at pos 0 and 1? No, regex is non-overlapping
		const matches = findTextMatches("aa", "aaa");
		// regex.exec advances lastIndex, so only 1 match at pos 0
		expect(matches).toHaveLength(1);
		expect(matches[0]).toEqual({ from: 0, to: 2 });
	});

	it("should find matches across lines", () => {
		const matches = findTextMatches("hello", "hello\nworld\nhello");
		expect(matches).toHaveLength(2);
		expect(matches[0]).toEqual({ from: 0, to: 5 });
		expect(matches[1]).toEqual({ from: 12, to: 17 });
	});

	it("should handle CJK search", () => {
		const matches = findTextMatches("테스트", "이것은 테스트입니다 테스트 완료");
		expect(matches).toHaveLength(2);
	});

	it("should handle markdown content", () => {
		const md = "# Title\n\nSome **bold** text\n\n- list item";
		const matches = findTextMatches("bold", md);
		expect(matches).toHaveLength(1);
	});
});

describe("replaceMatch", () => {
	it("should replace a match in text", () => {
		const result = replaceMatch("hello world", { from: 6, to: 11 }, "earth");
		expect(result).toBe("hello earth");
	});

	it("should replace at start of text", () => {
		const result = replaceMatch("hello world", { from: 0, to: 5 }, "hi");
		expect(result).toBe("hi world");
	});

	it("should replace at end of text", () => {
		const result = replaceMatch("hello world", { from: 6, to: 11 }, "there");
		expect(result).toBe("hello there");
	});

	it("should handle replacement with different length", () => {
		const result = replaceMatch("abc", { from: 1, to: 2 }, "xyz");
		expect(result).toBe("axyzc");
	});

	it("should handle empty replacement", () => {
		const result = replaceMatch("hello world", { from: 5, to: 6 }, "");
		expect(result).toBe("helloworld");
	});

	it("should handle replacement in markdown", () => {
		const md = "# Title\n\nSome text here";
		// "Some" starts at index 9 (after "# Title\n\n"), ends at 13
		const result = replaceMatch(md, { from: 9, to: 13 }, "More");
		expect(result).toBe("# Title\n\nMore text here");
	});
});

describe("replaceAllMatches", () => {
	it("should replace all occurrences", () => {
		const result = replaceAllMatches("aa bb aa cc aa", "aa", "xx");
		expect(result).toBe("xx bb xx cc xx");
	});

	it("should be case insensitive", () => {
		const result = replaceAllMatches("Hello hello HELLO", "hello", "hi");
		expect(result).toBe("hi hi hi");
	});

	it("should return original text for empty term", () => {
		expect(replaceAllMatches("hello", "", "x")).toBe("hello");
	});

	it("should handle special regex characters in search term", () => {
		const result = replaceAllMatches("file.txt and file.txt", "file.txt", "doc.md");
		expect(result).toBe("doc.md and doc.md");
	});

	it("should handle replacement with empty string", () => {
		const result = replaceAllMatches("remove this word this", "this", "");
		expect(result).toBe("remove  word ");
	});

	it("should handle no matches", () => {
		const result = replaceAllMatches("hello world", "xyz", "abc");
		expect(result).toBe("hello world");
	});

	it("should handle markdown content", () => {
		const md = "# Title\n\nold text and old stuff";
		const result = replaceAllMatches(md, "old", "new");
		expect(result).toBe("# Title\n\nnew text and new stuff");
	});
});
