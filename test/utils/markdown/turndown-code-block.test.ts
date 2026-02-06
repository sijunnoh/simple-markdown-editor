import { describe, it, expect } from "vitest";
import { turndown } from "./setup";

describe("turndown code block rule", () => {
	it("should convert code block with language", () => {
		const html = `
			<pre><code class="language-javascript">const x = 1;</code></pre>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("```javascript");
		expect(result).toContain("const x = 1;");
		expect(result).toContain("```");
	});

	it("should convert code block without language", () => {
		const html = `
			<pre><code>plain code</code></pre>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("```");
		expect(result).toContain("plain code");
	});

	it("should convert code block wrapper with language", () => {
		const html = `
			<div class="code-block-wrapper">
				<pre><code class="language-python">print("hello")</code></pre>
			</div>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("```python");
		expect(result).toContain('print("hello")');
	});
});
