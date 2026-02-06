import { describe, it, expect } from "vitest";
import { buildNodeToLineMapping, findMappingForLine } from "../../src/webview/hooks/use-split-highlight";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

// Helper to create a mock ProseMirror node
function mockNode(typeName: string, textContent: string): any {
	return {
		type: { name: typeName },
		textContent,
		nodeSize: textContent.length + 2, // ProseMirror adds 2 for open/close tokens
	};
}

// Helper to create a mock ProseMirror doc with forEach
function mockDoc(nodes: ReturnType<typeof mockNode>[]): ProseMirrorNode {
	return {
		forEach: (callback: (node: any, offset: number, index: number) => void) => {
			let offset = 0;
			nodes.forEach((node, index) => {
				callback(node, offset, index);
				offset += node.nodeSize;
			});
		},
	} as unknown as ProseMirrorNode;
}

describe("buildNodeToLineMapping", () => {
	it("should map heading to single line", () => {
		const doc = mockDoc([
			mockNode("heading", "Title"),
		]);
		const markdown = "# Title";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 0 }]);
	});

	it("should map heading + paragraph", () => {
		const doc = mockDoc([
			mockNode("heading", "Title"),
			mockNode("paragraph", "Some text here"),
		]);
		const markdown = "# Title\n\nSome text here";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([
			{ start: 0, end: 0 },  // # Title
			{ start: 2, end: 2 },  // Some text here (line 2, skipping blank line 1)
		]);
	});

	it("should map fenced code block", () => {
		const doc = mockDoc([
			mockNode("codeBlock", "const x = 1;"),
		]);
		const markdown = "```js\nconst x = 1;\n```";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 2 }]);
	});

	it("should map code block with multiple lines", () => {
		const doc = mockDoc([
			mockNode("codeBlock", "line1\nline2\nline3"),
		]);
		const markdown = "```\nline1\nline2\nline3\n```";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 4 }]);
	});

	it("should map bullet list as single entry", () => {
		const doc = mockDoc([
			mockNode("bulletList", "item 1item 2item 3"),
		]);
		const markdown = "- item 1\n- item 2\n- item 3";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 2 }]);
	});

	it("should map ordered list as single entry", () => {
		const doc = mockDoc([
			mockNode("orderedList", "firstsecond"),
		]);
		const markdown = "1. first\n2. second";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 1 }]);
	});

	it("should map task list as single entry", () => {
		const doc = mockDoc([
			mockNode("taskList", "task atask b"),
		]);
		const markdown = "- [ ] task a\n- [x] task b";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 1 }]);
	});

	it("should map blockquote", () => {
		const doc = mockDoc([
			mockNode("blockquote", "quoted line 1quoted line 2"),
		]);
		const markdown = "> quoted line 1\n> quoted line 2";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 1 }]);
	});

	it("should map table", () => {
		const doc = mockDoc([
			mockNode("table", "H1H2D1D2"),
		]);
		const markdown = "| H1 | H2 |\n| -- | -- |\n| D1 | D2 |";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 2 }]);
	});

	it("should map horizontal rule to single line", () => {
		const doc = mockDoc([
			mockNode("horizontalRule", ""),
		]);
		const markdown = "---";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 0 }]);
	});

	it("should map image to single line", () => {
		const doc = mockDoc([
			mockNode("image", ""),
		]);
		const markdown = "![alt](./photo.png)";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 0 }]);
	});

	it("should skip empty paragraphs (around images)", () => {
		const doc = mockDoc([
			mockNode("paragraph", ""),  // empty paragraph before image
			mockNode("image", ""),
			mockNode("paragraph", ""),  // empty paragraph after image
		]);
		const markdown = "![alt](./photo.png)";
		const mapping = buildNodeToLineMapping(doc, markdown);

		// Empty paragraphs should not consume lines
		expect(mapping).toHaveLength(3);
		expect(mapping[0]).toEqual({ start: 0, end: 0 }); // empty para (no consumption)
		expect(mapping[1]).toEqual({ start: 0, end: 0 }); // image
		expect(mapping[2]).toEqual({ start: 0, end: 0 }); // empty para (no consumption)
	});

	it("should correctly map after empty paragraphs around image", () => {
		const doc = mockDoc([
			mockNode("heading", "Title"),
			mockNode("paragraph", ""),   // empty paragraph
			mockNode("image", ""),
			mockNode("paragraph", ""),   // empty paragraph
			mockNode("paragraph", "After image"),
		]);
		const markdown = "# Title\n\n![alt](./photo.png)\n\nAfter image";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(5);
		expect(mapping[0]).toEqual({ start: 0, end: 0 }); // # Title
		expect(mapping[1]).toEqual({ start: 0, end: 0 }); // empty para
		expect(mapping[2]).toEqual({ start: 2, end: 2 }); // image (line 2)
		expect(mapping[3]).toEqual({ start: 2, end: 2 }); // empty para
		expect(mapping[4]).toEqual({ start: 4, end: 4 }); // After image (line 4)
	});

	it("should skip blank lines between blocks", () => {
		const doc = mockDoc([
			mockNode("paragraph", "First"),
			mockNode("paragraph", "Second"),
		]);
		const markdown = "First\n\nSecond";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([
			{ start: 0, end: 0 },
			{ start: 2, end: 2 },
		]);
	});

	it("should handle multi-line paragraph", () => {
		const doc = mockDoc([
			mockNode("paragraph", "Line one line two"),
		]);
		const markdown = "Line one\nline two";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 1 }]);
	});

	it("should handle complex document with mixed node types", () => {
		const doc = mockDoc([
			mockNode("heading", "Title"),
			mockNode("paragraph", "Intro text"),
			mockNode("bulletList", "abc"),
			mockNode("codeBlock", "code"),
			mockNode("paragraph", "End"),
		]);
		const markdown = "# Title\n\nIntro text\n\n- a\n- b\n- c\n\n```\ncode\n```\n\nEnd";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(5);
		expect(mapping[0]).toEqual({ start: 0, end: 0 });   // # Title
		expect(mapping[1]).toEqual({ start: 2, end: 2 });   // Intro text
		expect(mapping[2]).toEqual({ start: 4, end: 6 });   // - a, - b, - c
		expect(mapping[3]).toEqual({ start: 8, end: 10 });  // ``` code ```
		expect(mapping[4]).toEqual({ start: 12, end: 12 }); // End
	});

	it("should handle empty document", () => {
		const doc = mockDoc([]);
		const markdown = "";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([]);
	});

	it("should correctly map a full realistic document", () => {
		// Simulate a real document with all node types:
		//   heading, paragraph (with link), empty para, image, empty para,
		//   heading, bulletList, orderedList, taskList,
		//   blockquote, codeBlock, table, horizontalRule, paragraph
		const doc = mockDoc([
			mockNode("heading", "My Document"),                                         // 0
			mockNode("paragraph", "Introduction with a link to example."),              // 1
			mockNode("paragraph", ""),                                                  // 2 (empty, before image)
			mockNode("image", ""),                                                      // 3
			mockNode("paragraph", ""),                                                  // 4 (empty, after image)
			mockNode("heading", "Features"),                                            // 5
			mockNode("bulletList", "Bold textItalic textInline code"),                  // 6
			mockNode("orderedList", "First stepSecond step"),                            // 7
			mockNode("taskList", "Task donePending task"),                               // 8
			mockNode("blockquote", "This is a quotewith two lines"),                    // 9
			mockNode("codeBlock", "const x = 1;\nconst y = 2;"),                        // 10
			mockNode("table", "NameAgeAlice30"),                                         // 11
			mockNode("horizontalRule", ""),                                               // 12
			mockNode("paragraph", "Final paragraph with **bold** and *italic* text."),   // 13
		]);

		const markdown = [
			"# My Document",                                          // line 0
			"",                                                        // line 1
			"Introduction with a [link](https://example.com) to example.", // line 2
			"",                                                        // line 3
			"![screenshot](./images/demo.png)",                        // line 4
			"",                                                        // line 5
			"## Features",                                             // line 6
			"",                                                        // line 7
			"- Bold text",                                             // line 8
			"- *Italic* text",                                         // line 9
			"- `Inline code`",                                         // line 10
			"",                                                        // line 11
			"1. First step",                                           // line 12
			"2. Second step",                                          // line 13
			"",                                                        // line 14
			"- [ ] Task done",                                         // line 15
			"- [x] Pending task",                                      // line 16
			"",                                                        // line 17
			"> This is a quote",                                       // line 18
			"> with two lines",                                        // line 19
			"",                                                        // line 20
			"```javascript",                                           // line 21
			"const x = 1;",                                            // line 22
			"const y = 2;",                                            // line 23
			"```",                                                     // line 24
			"",                                                        // line 25
			"| Name  | Age |",                                         // line 26
			"| ----- | --- |",                                         // line 27
			"| Alice | 30  |",                                         // line 28
			"",                                                        // line 29
			"---",                                                     // line 30
			"",                                                        // line 31
			"Final paragraph with **bold** and *italic* text.",        // line 32
		].join("\n");

		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(14);

		// heading: "# My Document"
		expect(mapping[0]).toEqual({ start: 0, end: 0 });

		// paragraph: "Introduction with a link..."
		expect(mapping[1]).toEqual({ start: 2, end: 2 });

		// empty paragraph (before image) - should not consume lines
		expect(mapping[2]).toEqual({ start: 2, end: 2 });

		// image: "![screenshot](./images/demo.png)"
		expect(mapping[3]).toEqual({ start: 4, end: 4 });

		// empty paragraph (after image) - should not consume lines
		expect(mapping[4]).toEqual({ start: 4, end: 4 });

		// heading: "## Features"
		expect(mapping[5]).toEqual({ start: 6, end: 6 });

		// bulletList: 3 items on lines 8-10
		expect(mapping[6]).toEqual({ start: 8, end: 10 });

		// orderedList: 2 items on lines 12-13
		expect(mapping[7]).toEqual({ start: 12, end: 13 });

		// taskList: 2 items on lines 15-16
		expect(mapping[8]).toEqual({ start: 15, end: 16 });

		// blockquote: 2 lines on 18-19
		expect(mapping[9]).toEqual({ start: 18, end: 19 });

		// codeBlock: lines 21-24 (```javascript ... ```)
		expect(mapping[10]).toEqual({ start: 21, end: 24 });

		// table: lines 26-28 (header + separator + data)
		expect(mapping[11]).toEqual({ start: 26, end: 28 });

		// horizontalRule: line 30
		expect(mapping[12]).toEqual({ start: 30, end: 30 });

		// paragraph: "Final paragraph..."
		expect(mapping[13]).toEqual({ start: 32, end: 32 });
	});

	it("should allow findMappingForLine to locate any line in realistic document", () => {
		// Same document as above, verify reverse lookup works
		const mapping = [
			{ start: 0, end: 0 },    // 0: heading
			{ start: 2, end: 2 },    // 1: paragraph
			{ start: 2, end: 2 },    // 2: empty para
			{ start: 4, end: 4 },    // 3: image
			{ start: 4, end: 4 },    // 4: empty para
			{ start: 6, end: 6 },    // 5: heading
			{ start: 8, end: 10 },   // 6: bulletList
			{ start: 12, end: 13 },  // 7: orderedList
			{ start: 15, end: 16 },  // 8: taskList
			{ start: 18, end: 19 },  // 9: blockquote
			{ start: 21, end: 24 },  // 10: codeBlock
			{ start: 26, end: 28 },  // 11: table
			{ start: 30, end: 30 },  // 12: horizontalRule
			{ start: 32, end: 32 },  // 13: paragraph
		];

		// Heading line → block 0
		expect(findMappingForLine(mapping, 0)).toBe(0);

		// Paragraph with link → block 1 (or 2 since empty para has same range)
		expect(findMappingForLine(mapping, 2)).toBe(1);

		// Image line → block 3 (or 4 since empty para has same range)
		expect(findMappingForLine(mapping, 4)).toBe(3);

		// Second heading → block 5
		expect(findMappingForLine(mapping, 6)).toBe(5);

		// Middle of bullet list → block 6
		expect(findMappingForLine(mapping, 9)).toBe(6);

		// First item of ordered list → block 7
		expect(findMappingForLine(mapping, 12)).toBe(7);

		// Task list → block 8
		expect(findMappingForLine(mapping, 16)).toBe(8);

		// Blockquote second line → block 9
		expect(findMappingForLine(mapping, 19)).toBe(9);

		// Inside code block → block 10
		expect(findMappingForLine(mapping, 22)).toBe(10);

		// Table separator row → block 11
		expect(findMappingForLine(mapping, 27)).toBe(11);

		// Horizontal rule → block 12
		expect(findMappingForLine(mapping, 30)).toBe(12);

		// Final paragraph → block 13
		expect(findMappingForLine(mapping, 32)).toBe(13);

		// Blank lines between blocks → -1
		expect(findMappingForLine(mapping, 1)).toBe(-1);   // between heading and paragraph
		expect(findMappingForLine(mapping, 11)).toBe(-1);  // between bulletList and orderedList
		expect(findMappingForLine(mapping, 20)).toBe(-1);  // between blockquote and codeBlock

		// Beyond last line → last block
		expect(findMappingForLine(mapping, 50)).toBe(13);
	});

	it("should handle loose bullet list (blank lines between items)", () => {
		const doc = mockDoc([
			mockNode("heading", "Bullet List"),
			mockNode("bulletList", "First itemSecond itemNested itemAnother nestedThird item"),
			mockNode("heading", "Numbered List"),
			mockNode("orderedList", "Step oneStep twoStep three"),
		]);
		const markdown = [
			"### Bullet List",          // line 0
			"",                          // line 1
			"- First item",              // line 2
			"- Second item",             // line 3
			"  - Nested item",           // line 4
			"  - Another nested",        // line 5
			"",                          // line 6 (loose list blank line)
			"- Third item",              // line 7
			"",                          // line 8
			"### Numbered List",         // line 9
			"",                          // line 10
			"1. Step one",               // line 11
			"2. Step two",               // line 12
			"3. Step three",             // line 13
		].join("\n");
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(4);
		expect(mapping[0]).toEqual({ start: 0, end: 0 });   // ### Bullet List
		expect(mapping[1]).toEqual({ start: 2, end: 7 });   // bullet list (including Third item after blank)
		expect(mapping[2]).toEqual({ start: 9, end: 9 });   // ### Numbered List
		expect(mapping[3]).toEqual({ start: 11, end: 13 }); // ordered list
	});

	it("should handle loose ordered list (blank lines between items)", () => {
		const doc = mockDoc([
			mockNode("orderedList", "FirstSecondThird"),
		]);
		const markdown = "1. First\n\n2. Second\n\n3. Third";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 4 }]);
	});

	it("should not cross list types when looking ahead past blank lines", () => {
		const doc = mockDoc([
			mockNode("bulletList", "Bullet item"),
			mockNode("orderedList", "Ordered item"),
		]);
		const markdown = "- Bullet item\n\n1. Ordered item";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(2);
		expect(mapping[0]).toEqual({ start: 0, end: 0 }); // bullet list stops, doesn't consume ordered
		expect(mapping[1]).toEqual({ start: 2, end: 2 }); // ordered list
	});

	it("should handle inline badge images extracted as block images", () => {
		// When TipTap has inline: false for images, patterns like [![badge](img)](link)
		// inside a paragraph cause ProseMirror to split into fragments + block images
		const doc = mockDoc([
			mockNode("heading", "b2b"),                     // from <h1>b2b</h1>
			mockNode("paragraph", "master "),               // first fragment
			mockNode("image", ""),                          // extracted badge image
			mockNode("paragraph", " dev "),                 // second fragment
			mockNode("image", ""),                          // extracted badge image
			mockNode("paragraph", " preview "),             // third fragment
			mockNode("image", ""),                          // extracted badge image
			mockNode("paragraph", "This is a description."),// next real paragraph
		]);
		const markdown = [
			"<h1>b2b</h1>",                                        // line 0
			"",                                                     // line 1
			"`master` [![Badge](img)](link) `dev` [![Badge](img)](link) `preview` [![Badge](img)](link)", // line 2
			"",                                                     // line 3
			"This is a description.",                                // line 4
		].join("\n");

		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(8);
		// heading maps to the HTML heading line
		expect(mapping[0]).toEqual({ start: 0, end: 0 });
		// all badge fragments + images map to the badge line
		expect(mapping[1]).toEqual({ start: 2, end: 2 }); // "master " paragraph
		expect(mapping[2]).toEqual({ start: 2, end: 2 }); // first phantom image
		expect(mapping[3]).toEqual({ start: 2, end: 2 }); // " dev " fragment
		expect(mapping[4]).toEqual({ start: 2, end: 2 }); // second phantom image
		expect(mapping[5]).toEqual({ start: 2, end: 2 }); // " preview " fragment
		expect(mapping[6]).toEqual({ start: 2, end: 2 }); // third phantom image
		// real paragraph maps to its own line
		expect(mapping[7]).toEqual({ start: 4, end: 4 });
	});

	it("should handle mixed phantom and real images", () => {
		// A document with both inline-extracted images (phantom) and real block images
		const doc = mockDoc([
			mockNode("paragraph", "Text with badge"),       // fragment consuming badge line
			mockNode("image", ""),                          // phantom image (no matching line)
			mockNode("paragraph", ""),                      // empty para before real image
			mockNode("image", ""),                          // real block image
			mockNode("paragraph", ""),                      // empty para after real image
			mockNode("paragraph", "After image"),           // normal paragraph
		]);
		const markdown = [
			"Text with [![badge](img)](link) inline",       // line 0
			"",                                             // line 1
			"![real-image](photo.png)",                     // line 2
			"",                                             // line 3
			"After image",                                  // line 4
		].join("\n");

		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(6);
		expect(mapping[0]).toEqual({ start: 0, end: 0 }); // paragraph with badge text
		expect(mapping[1]).toEqual({ start: 0, end: 0 }); // phantom image
		expect(mapping[2]).toEqual({ start: 0, end: 0 }); // empty para
		expect(mapping[3]).toEqual({ start: 2, end: 2 }); // real image (line starts with ![)
		expect(mapping[4]).toEqual({ start: 2, end: 2 }); // empty para
		expect(mapping[5]).toEqual({ start: 4, end: 4 }); // normal paragraph
	});

	it("should handle nodes when markdown lines run out", () => {
		// More ProseMirror nodes than markdown can account for
		const doc = mockDoc([
			mockNode("paragraph", "Hello"),
			mockNode("paragraph", "Extra node"),
			mockNode("paragraph", "Another extra"),
		]);
		const markdown = "Hello";

		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(3);
		expect(mapping[0]).toEqual({ start: 0, end: 0 });
		// Extra nodes map to last known range
		expect(mapping[1]).toEqual({ start: 0, end: 0 });
		expect(mapping[2]).toEqual({ start: 0, end: 0 });
	});

	it("should map multi-line math block ($$...$$)", () => {
		const doc = mockDoc([
			mockNode("mathBlock", "\\sum_{i=1}^n i"),
		]);
		const markdown = "$$\n\\sum_{i=1}^n i\n$$";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 2 }]);
	});

	it("should map single-line math block", () => {
		const doc = mockDoc([
			mockNode("mathBlock", "E=mc^2"),
		]);
		const markdown = "$$E=mc^2$$";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 0 }]);
	});

	it("should map frontmatter block (---...---)", () => {
		const doc = mockDoc([
			mockNode("frontmatter", "title: Test\nauthor: me"),
		]);
		const markdown = "---\ntitle: Test\nauthor: me\n---";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toEqual([{ start: 0, end: 3 }]);
	});

	it("should map frontmatter followed by content", () => {
		const doc = mockDoc([
			mockNode("frontmatter", "title: Test"),
			mockNode("heading", "Hello"),
			mockNode("paragraph", "World"),
		]);
		const markdown = "---\ntitle: Test\n---\n\n# Hello\n\nWorld";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(3);
		expect(mapping[0]).toEqual({ start: 0, end: 2 }); // ---\ntitle: Test\n---
		expect(mapping[1]).toEqual({ start: 4, end: 4 }); // # Hello
		expect(mapping[2]).toEqual({ start: 6, end: 6 }); // World
	});

	it("should map math block between other blocks", () => {
		const doc = mockDoc([
			mockNode("paragraph", "Before math"),
			mockNode("mathBlock", "\\frac{a}{b}"),
			mockNode("paragraph", "After math"),
		]);
		const markdown = "Before math\n\n$$\n\\frac{a}{b}\n$$\n\nAfter math";
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(3);
		expect(mapping[0]).toEqual({ start: 0, end: 0 }); // Before math
		expect(mapping[1]).toEqual({ start: 2, end: 4 }); // $$\n...\n$$
		expect(mapping[2]).toEqual({ start: 6, end: 6 }); // After math
	});

	it("should map document with frontmatter + math + other blocks", () => {
		const doc = mockDoc([
			mockNode("frontmatter", "title: Doc"),
			mockNode("heading", "Math Section"),
			mockNode("paragraph", "Euler's identity:"),
			mockNode("mathBlock", "e^{i\\pi} + 1 = 0"),
			mockNode("paragraph", "End"),
		]);
		const markdown = [
			"---",                    // line 0
			"title: Doc",             // line 1
			"---",                    // line 2
			"",                       // line 3
			"# Math Section",         // line 4
			"",                       // line 5
			"Euler's identity:",      // line 6
			"",                       // line 7
			"$$",                     // line 8
			"e^{i\\pi} + 1 = 0",     // line 9
			"$$",                     // line 10
			"",                       // line 11
			"End",                    // line 12
		].join("\n");
		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(5);
		expect(mapping[0]).toEqual({ start: 0, end: 2 });   // frontmatter
		expect(mapping[1]).toEqual({ start: 4, end: 4 });   // heading
		expect(mapping[2]).toEqual({ start: 6, end: 6 });   // paragraph
		expect(mapping[3]).toEqual({ start: 8, end: 10 });  // math block
		expect(mapping[4]).toEqual({ start: 12, end: 12 }); // End
	});

	it("should not false-positive fragment detection for unrelated paragraphs", () => {
		// Two unrelated paragraphs - second should NOT be treated as fragment of first
		const doc = mockDoc([
			mockNode("paragraph", "apple banana cherry"),
			mockNode("paragraph", "date fig grape"),
		]);
		const markdown = "apple banana cherry\n\ndate fig grape";

		const mapping = buildNodeToLineMapping(doc, markdown);

		expect(mapping).toHaveLength(2);
		expect(mapping[0]).toEqual({ start: 0, end: 0 });
		expect(mapping[1]).toEqual({ start: 2, end: 2 }); // should map to own line, not line 0
	});
});

describe("findMappingForLine", () => {
	const mapping = [
		{ start: 0, end: 0 },   // block 0: line 0
		{ start: 2, end: 2 },   // block 1: line 2
		{ start: 4, end: 6 },   // block 2: lines 4-6
		{ start: 8, end: 10 },  // block 3: lines 8-10
	];

	it("should find correct block for single-line mapping", () => {
		expect(findMappingForLine(mapping, 0)).toBe(0);
		expect(findMappingForLine(mapping, 2)).toBe(1);
	});

	it("should find correct block for multi-line mapping", () => {
		expect(findMappingForLine(mapping, 4)).toBe(2);
		expect(findMappingForLine(mapping, 5)).toBe(2);
		expect(findMappingForLine(mapping, 6)).toBe(2);
	});

	it("should return last block for line beyond last mapping", () => {
		expect(findMappingForLine(mapping, 15)).toBe(3);
	});

	it("should return -1 for line in gap between blocks", () => {
		// Line 1 is between block 0 (line 0) and block 1 (line 2) - it's a blank line
		expect(findMappingForLine(mapping, 1)).toBe(-1);
	});

	it("should return -1 for empty mapping", () => {
		expect(findMappingForLine([], 0)).toBe(-1);
	});

	it("should handle line at start of multi-line block", () => {
		expect(findMappingForLine(mapping, 8)).toBe(3);
	});

	it("should handle line at end of multi-line block", () => {
		expect(findMappingForLine(mapping, 10)).toBe(3);
	});

	it("should find correct block for math and frontmatter entries", () => {
		const mathFmMapping = [
			{ start: 0, end: 2 },   // block 0: frontmatter (lines 0-2)
			{ start: 4, end: 4 },   // block 1: heading (line 4)
			{ start: 6, end: 8 },   // block 2: math block (lines 6-8)
			{ start: 10, end: 10 }, // block 3: paragraph (line 10)
		];

		// Frontmatter opening ---
		expect(findMappingForLine(mathFmMapping, 0)).toBe(0);
		// Frontmatter content
		expect(findMappingForLine(mathFmMapping, 1)).toBe(0);
		// Frontmatter closing ---
		expect(findMappingForLine(mathFmMapping, 2)).toBe(0);
		// Blank line between frontmatter and heading
		expect(findMappingForLine(mathFmMapping, 3)).toBe(-1);
		// Heading
		expect(findMappingForLine(mathFmMapping, 4)).toBe(1);
		// Math block opening $$
		expect(findMappingForLine(mathFmMapping, 6)).toBe(2);
		// Math block content
		expect(findMappingForLine(mathFmMapping, 7)).toBe(2);
		// Math block closing $$
		expect(findMappingForLine(mathFmMapping, 8)).toBe(2);
		// Paragraph
		expect(findMappingForLine(mathFmMapping, 10)).toBe(3);
	});
});
