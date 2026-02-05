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
		const startLine = currentLine;

		switch (node.type.name) {
			case "heading":
				// Heading is always a single line
				if (currentLine < lines.length) {
					currentLine++;
				}
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
				break;

			case "bulletList":
			case "orderedList":
			case "taskList":
				// Consume all consecutive list lines (including indented continuation)
				while (currentLine < lines.length) {
					const trimmed = lines[currentLine].trim();
					if (trimmed === "") break;
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
				break;

			case "blockquote":
				while (currentLine < lines.length && lines[currentLine].trim().startsWith(">")) {
					currentLine++;
				}
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
				break;

			case "horizontalRule":
			case "image":
				// Single-line nodes: ---, ![alt](url)
				if (currentLine < lines.length) {
					currentLine++;
				}
				break;

			default:
				// paragraph and other nodes: consume until empty line
				while (currentLine < lines.length && lines[currentLine].trim() !== "") {
					currentLine++;
				}
				break;
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
