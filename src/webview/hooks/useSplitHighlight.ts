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
 * Find which mapping entry contains a given line number
 */
export function findMappingForLine(mapping: LineRange[], line: number): number {
	for (let i = 0; i < mapping.length; i++) {
		if (line >= mapping[i].start && line <= mapping[i].end) {
			return i;
		}
	}
	if (mapping.length > 0 && line > mapping[mapping.length - 1].end) {
		return mapping.length - 1;
	}
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

		// Find which top-level node contains the cursor
		let blockIndex = -1;
		editor.state.doc.forEach((node, offset, index) => {
			const nodeEnd = offset + node.nodeSize;
			if (from >= offset && from <= nodeEnd) {
				blockIndex = index;
			}
		});

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
		const textBeforeCursor = markdown.substring(0, cursorPos);
		const lineNumber = textBeforeCursor.split("\n").length - 1;

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
			setTimeout(() => {
				if (lastFocusRef.current !== "source") {
					setHighlight({ sourceLines: null, editorBlockIndex: null });
				}
			}, 100);
		};

		editor.on("blur", handleBlur);
		return () => {
			editor.off("blur", handleBlur);
		};
	}, [editor]);

	return {
		sourceLines: highlight.sourceLines,
		editorBlockIndex: highlight.editorBlockIndex,
		updateFromSource,
	};
}
