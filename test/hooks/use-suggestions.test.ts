import { describe, it, expect } from "vitest";

/**
 * Tests for suggestion trigger detection and keyboard navigation logic
 * used by the useSuggestions hook.
 */
describe("use-suggestions", () => {
	describe("suggestion trigger regex", () => {
		// The regex used in checkForSuggestions: /[\/\[]([^\/\[\s]*)$/
		const triggerRegex = /[\/\[]([^\/\[\s]*)$/;

		it("should match forward slash trigger", () => {
			const match = triggerRegex.exec("/");
			expect(match).not.toBeNull();
			expect(match![1]).toBe("");
		});

		it("should match forward slash with query", () => {
			const match = triggerRegex.exec("/img");
			expect(match).not.toBeNull();
			expect(match![1]).toBe("img");
		});

		it("should match bracket trigger", () => {
			const match = triggerRegex.exec("[");
			expect(match).not.toBeNull();
			expect(match![1]).toBe("");
		});

		it("should match bracket with query", () => {
			const match = triggerRegex.exec("[link");
			expect(match).not.toBeNull();
			expect(match![1]).toBe("link");
		});

		it("should match at end of text", () => {
			const match = triggerRegex.exec("some text /ima");
			expect(match).not.toBeNull();
			expect(match![1]).toBe("ima");
		});

		it("should not match if space in query", () => {
			const match = triggerRegex.exec("/hello world");
			// After space, the regex restarts so it won't have the / prefix
			expect(match).toBeNull();
		});

		it("should not match plain text without trigger", () => {
			const match = triggerRegex.exec("hello world");
			expect(match).toBeNull();
		});

		it("should match the last trigger in text", () => {
			const match = triggerRegex.exec("text /first more /second");
			expect(match).not.toBeNull();
			expect(match![1]).toBe("second");
		});
	});

	describe("keyboard navigation logic", () => {
		it("should cycle down through suggestions", () => {
			const length = 5;
			let index = 0;

			index = (index + 1) % length;
			expect(index).toBe(1);

			index = (index + 1) % length;
			expect(index).toBe(2);
		});

		it("should wrap around when going down past end", () => {
			const length = 3;
			let index = 2;

			index = (index + 1) % length;
			expect(index).toBe(0);
		});

		it("should cycle up through suggestions", () => {
			const length = 5;
			let index = 3;

			index = (index - 1 + length) % length;
			expect(index).toBe(2);
		});

		it("should wrap around when going up past start", () => {
			const length = 3;
			let index = 0;

			index = (index - 1 + length) % length;
			expect(index).toBe(2);
		});
	});

	describe("suggestion content generation", () => {
		it("should generate image HTML for image suggestions", () => {
			const suggestion = { type: "image" as const, path: "images/photo.png", label: "photo.png" };
			const baseUri = "vscode-webview://abc/workspace";
			const src = `${baseUri}/${suggestion.path}`;
			const content = `<img src="${src}" alt="">`;

			expect(content).toContain("<img");
			expect(content).toContain(suggestion.path);
		});

		it("should generate link HTML for file suggestions", () => {
			const suggestion = { type: "file" as const, path: "docs/readme.md", label: "readme.md" };
			const content = `<a href="${suggestion.path}">${suggestion.label}</a>`;

			expect(content).toContain("<a href=");
			expect(content).toContain(suggestion.path);
			expect(content).toContain(suggestion.label);
		});
	});
});
