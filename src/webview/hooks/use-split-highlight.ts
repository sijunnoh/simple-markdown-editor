import { useState, useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { ViewMode } from "../types";

interface UseSplitHighlightProps {
	editor: Editor | null;
	viewMode: ViewMode;
	markdown: string;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface HighlightState {
	sourceLines: { start: number; end: number } | null;
	editorBlockIndex: number | null;
}

export type LineRange = { start: number; end: number };

/**
 * Build a mapping from ProseMirror top-level node index to markdown line ranges.
 * Walks through the doc nodes in order and consumes matching lines from the markdown.
 */
export function buildNodeToLineMapping(doc: ProseMirrorNode, markdown: string): LineRange[] {
	const lines = markdown.split("\n");
	const mapping: LineRange[] = [];
	let currentLine = 0;

	// Track phantom nodes: inline images extracted as block by TipTap (inline: false)
	// so paragraph fragments from the same split are grouped together
	let phantomMode = false;
	// Count of inline image references in the most recently consumed paragraph lines.
	// Used to detect phantom image nodes that were extracted from inline context.
	let inlineImageCount = 0;

	const skipEmptyLines = () => {
		while (currentLine < lines.length && lines[currentLine].trim() === "") {
			currentLine++;
		}
	};

	doc.forEach((node) => {
		// Empty nodes (e.g., empty paragraphs inserted around images)
		// should not consume any markdown lines
		if (node.textContent.trim() === "" && node.type.name === "paragraph") {
			const prevEnd = mapping.length > 0 ? mapping[mapping.length - 1].end : 0;
			mapping.push({ start: prevEnd, end: prevEnd });
			return;
		}

		skipEmptyLines();

		// If we've run out of markdown lines, map remaining nodes to the last range
		if (currentLine >= lines.length) {
			const prevRange = mapping.length > 0 ? mapping[mapping.length - 1] : { start: 0, end: 0 };
			mapping.push({ start: prevRange.start, end: prevRange.end });
			return;
		}

		const startLine = currentLine;

		switch (node.type.name) {
			case "heading":
				// Heading is always a single line (handles both # heading and <h1>heading</h1>)
				if (currentLine < lines.length) {
					currentLine++;
				}
				phantomMode = false;
				inlineImageCount = 0;
				break;

			case "codeBlock":
				// Code blocks: ``` ... ```
				if (currentLine < lines.length && lines[currentLine].trim().startsWith("```")) {
					currentLine++; // opening ```
					while (currentLine < lines.length && !lines[currentLine].trim().startsWith("```")) {
						currentLine++;
					}
					if (currentLine < lines.length) {
						currentLine++; // closing ```
					}
				} else {
					// Indented code block or no fences found
					while (currentLine < lines.length && lines[currentLine].trim() !== "") {
						currentLine++;
					}
				}
				phantomMode = false;
				inlineImageCount = 0;
				break;

			case "bulletList":
			case "orderedList":
			case "taskList": {
				// Determine which markers to match for lookahead (avoid consuming a different list type)
				const isBulletType = node.type.name === "bulletList" || node.type.name === "taskList";
				const isOrderedType = node.type.name === "orderedList";
				// Consume all consecutive list lines (including indented continuation)
				// Also handles "loose lists" where blank lines separate items
				while (currentLine < lines.length) {
					const trimmed = lines[currentLine].trim();
					if (trimmed === "") {
						// Look ahead past blank lines to see if list continues (loose list)
						let lookAhead = currentLine + 1;
						while (lookAhead < lines.length && lines[lookAhead].trim() === "") {
							lookAhead++;
						}
						if (lookAhead < lines.length) {
							const nextTrimmed = lines[lookAhead].trim();
							const isMatchingItem =
								(isBulletType && /^[-*+]\s/.test(nextTrimmed)) ||
								(isOrderedType && /^\d+\.\s/.test(nextTrimmed));
							if (isMatchingItem) {
								currentLine = lookAhead;
								continue;
							}
						}
						break;
					}
					// List markers or indented continuation lines
					const isListItem = /^[-*+]\s/.test(trimmed) ||
						/^\d+\.\s/.test(trimmed) ||
						/^\[[ x]\]\s/.test(trimmed);
					const isIndented = /^\s+/.test(lines[currentLine]) && !trimmed.startsWith("```");
					if (isListItem || isIndented) {
						currentLine++;
					} else {
						break;
					}
				}
				phantomMode = false;
				inlineImageCount = 0;
				break;
			}

			case "blockquote":
				while (currentLine < lines.length && lines[currentLine].trim().startsWith(">")) {
					currentLine++;
				}
				phantomMode = false;
				inlineImageCount = 0;
				break;

			case "table":
				while (currentLine < lines.length) {
					const trimmed = lines[currentLine].trim();
					if (trimmed.startsWith("|") || /^[-|: ]+$/.test(trimmed)) {
						currentLine++;
					} else {
						break;
					}
				}
				phantomMode = false;
				inlineImageCount = 0;
				break;

			case "horizontalRule":
				// Single-line node: ---
				if (currentLine < lines.length) {
					currentLine++;
				}
				phantomMode = false;
				inlineImageCount = 0;
				break;

			case "mathBlock":
				// Math blocks: $$ ... $$
				if (currentLine < lines.length) {
					if (lines[currentLine].trim() === "$$") {
						// Multi-line: $$\n...\n$$
						currentLine++; // opening $$
						while (currentLine < lines.length && lines[currentLine].trim() !== "$$") {
							currentLine++;
						}
						if (currentLine < lines.length) {
							currentLine++; // closing $$
						}
					} else {
						// Single-line: $$...$$
						currentLine++;
					}
				}
				phantomMode = false;
				inlineImageCount = 0;
				break;

			case "frontmatter":
				// Frontmatter: ---\n...\n---
				if (currentLine < lines.length && lines[currentLine].trim() === "---") {
					currentLine++; // opening ---
					while (currentLine < lines.length && lines[currentLine].trim() !== "---") {
						currentLine++;
					}
					if (currentLine < lines.length) {
						currentLine++; // closing ---
					}
				}
				phantomMode = false;
				inlineImageCount = 0;
				break;

			case "image": {
				// Check if this image was extracted from an inline context
				// (e.g., [![badge](img)](link) inside a paragraph that was already consumed)
				if (inlineImageCount > 0) {
					inlineImageCount--;
					phantomMode = true;
					const prevRange = mapping.length > 0
						? mapping[mapping.length - 1]
						: { start: startLine, end: startLine };
					mapping.push({ start: prevRange.start, end: prevRange.end });
					return;
				}

				// Check if the current line actually contains a standalone image
				const trimmed = lines[currentLine]?.trim() ?? "";
				if (trimmed.startsWith("![") || trimmed.startsWith("<img")) {
					currentLine++;
					phantomMode = false;
				} else {
					// Image doesn't match any line - treat as phantom
					phantomMode = true;
					const prevRange = mapping.length > 0
						? mapping[mapping.length - 1]
						: { start: startLine, end: startLine };
					mapping.push({ start: prevRange.start, end: prevRange.end });
					return;
				}
				inlineImageCount = 0;
				break;
			}

			default: {
				// Check if this paragraph is a fragment from a split block
				// (happens when TipTap extracts inline images as block-level nodes,
				// splitting the surrounding paragraph into fragments)
				if (phantomMode && mapping.length > 0) {
					const prevRange = mapping[mapping.length - 1];
					const nodeText = node.textContent.trim();
					if (nodeText) {
						const prevLinesText = lines
							.slice(prevRange.start, prevRange.end + 1)
							.join(" ");
						if (prevLinesText.includes(nodeText)) {
							mapping.push({ start: prevRange.start, end: prevRange.end });
							return;
						}
					}
				}
				// Regular paragraph: consume until empty line
				phantomMode = false;
				while (currentLine < lines.length && lines[currentLine].trim() !== "") {
					currentLine++;
				}
				// Count inline image references in consumed lines for phantom detection
				const consumedText = lines.slice(startLine, currentLine).join("\n");
				const imgMatches = consumedText.match(/!\[|<img[\s>]/g);
				inlineImageCount = imgMatches ? imgMatches.length : 0;
				break;
			}
		}

		const endLine = Math.max(startLine, currentLine - 1);
		mapping.push({ start: startLine, end: endLine });
	});

	return mapping;
}

/**
 * Find which mapping entry contains a given line number.
 * Uses binary search (mapping start/end values are non-decreasing).
 */
export function findMappingForLine(mapping: LineRange[], line: number): number {
	const len = mapping.length;
	if (len === 0) return -1;
	if (line > mapping[len - 1].end) return len - 1;

	// Binary search: find the rightmost entry with start <= line
	let lo = 0;
	let hi = len;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (mapping[mid].start <= line) {
			lo = mid + 1;
		} else {
			hi = mid;
		}
	}
	// lo = first index where start > line; candidates are [0, lo-1]
	if (lo === 0) return -1;

	// Binary search within [0, lo-1]: find the first entry with end >= line
	let lo2 = 0;
	let hi2 = lo - 1;
	while (lo2 < hi2) {
		const mid = (lo2 + hi2) >>> 1;
		if (mapping[mid].end >= line) {
			hi2 = mid;
		} else {
			lo2 = mid + 1;
		}
	}

	if (mapping[lo2].end >= line && mapping[lo2].start <= line) return lo2;
	return -1;
}

/**
 * Hook for highlighting corresponding blocks in split view
 */
export function useSplitHighlight({
	editor,
	viewMode,
	markdown,
	textareaRef,
}: UseSplitHighlightProps) {
	const [highlight, setHighlight] = useState<HighlightState>({
		sourceLines: null,
		editorBlockIndex: null,
	});

	const mappingRef = useRef<LineRange[]>([]);
	const lastFocusRef = useRef<"editor" | "source" | null>(null);
	const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Update mapping when markdown or editor doc changes
	useEffect(() => {
		if (!editor) return;
		mappingRef.current = buildNodeToLineMapping(editor.state.doc, markdown);
	}, [editor, markdown]);

	// Handle editor selection change -> highlight source lines
	const updateFromEditor = useCallback(() => {
		if (!editor || viewMode !== "split") {
			setHighlight({ sourceLines: null, editorBlockIndex: null });
			return;
		}

		lastFocusRef.current = "editor";

		const { from } = editor.state.selection;

		// Find which top-level node contains the cursor using O(1) resolve
		const $pos = editor.state.doc.resolve(from);
		const blockIndex = $pos.index(0);

		if (blockIndex === -1 || blockIndex >= mappingRef.current.length) {
			setHighlight({ sourceLines: null, editorBlockIndex: null });
			return;
		}

		const sourceBlock = mappingRef.current[blockIndex];
		setHighlight({
			sourceLines: sourceBlock ? { start: sourceBlock.start, end: sourceBlock.end } : null,
			editorBlockIndex: null,
		});
	}, [editor, viewMode]);

	// Handle textarea cursor change -> highlight editor block
	const updateFromSource = useCallback(() => {
		if (!textareaRef.current || viewMode !== "split") {
			setHighlight({ sourceLines: null, editorBlockIndex: null });
			return;
		}

		lastFocusRef.current = "source";

		const textarea = textareaRef.current;
		const cursorPos = textarea.selectionStart;
		let lineNumber = 0;
		for (let i = 0; i < cursorPos; i++) {
			if (markdown.charCodeAt(i) === 10) lineNumber++;
		}

		const blockIndex = findMappingForLine(mappingRef.current, lineNumber);

		setHighlight({
			sourceLines: null,
			editorBlockIndex: blockIndex >= 0 ? blockIndex : null,
		});
	}, [markdown, viewMode, textareaRef]);

	// Clear highlight when leaving split view
	useEffect(() => {
		if (viewMode !== "split") {
			setHighlight({ sourceLines: null, editorBlockIndex: null });
		}
	}, [viewMode]);

	// Set up editor selection listener
	useEffect(() => {
		if (!editor) return;

		const handleSelectionUpdate = () => {
			if (editor.isFocused) {
				updateFromEditor();
			}
		};

		editor.on("selectionUpdate", handleSelectionUpdate);
		editor.on("focus", handleSelectionUpdate);

		return () => {
			editor.off("selectionUpdate", handleSelectionUpdate);
			editor.off("focus", handleSelectionUpdate);
		};
	}, [editor, updateFromEditor]);

	// Clear when editor loses focus
	useEffect(() => {
		if (!editor) return;

		const handleBlur = () => {
			if (blurTimeoutRef.current !== null) {
				clearTimeout(blurTimeoutRef.current);
			}
			blurTimeoutRef.current = setTimeout(() => {
				blurTimeoutRef.current = null;
				if (lastFocusRef.current !== "source") {
					setHighlight({ sourceLines: null, editorBlockIndex: null });
				}
			}, 100);
		};

		editor.on("blur", handleBlur);
		return () => {
			editor.off("blur", handleBlur);
			if (blurTimeoutRef.current !== null) {
				clearTimeout(blurTimeoutRef.current);
				blurTimeoutRef.current = null;
			}
		};
	}, [editor]);

	return {
		sourceLines: highlight.sourceLines,
		editorBlockIndex: highlight.editorBlockIndex,
		updateFromSource,
	};
}
