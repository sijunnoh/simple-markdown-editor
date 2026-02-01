import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { ViewMode } from "../types";
import { untransformImagePaths } from "../utils/imagePaths";
import { turndown } from "../utils/markdown/turndownConfig";
import type { MarkdownSyncRefs } from "./useMarkdownSync";

interface UseKeyboardShortcutsOptions {
	editor: Editor | null;
	viewMode: ViewMode;
	markdown: string;
	setMarkdown: (md: string) => void;
	refs: MarkdownSyncRefs;
	vscode: { postMessage: (message: unknown) => void };
}

export function useKeyboardShortcuts({
	editor,
	viewMode,
	markdown,
	setMarkdown,
	refs,
	vscode,
}: UseKeyboardShortcutsOptions) {
	const { baseUriRef, isComposing, isTextareaFocused, lastSyncedMarkdownRef } = refs;

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const isModKey = event.ctrlKey || event.metaKey;
			const formattingKeys = ["b", "i", "u", "k"];

			// Prevent VS Code from capturing formatting shortcuts
			if (isModKey && formattingKeys.includes(event.key.toLowerCase())) {
				event.stopPropagation();
				event.stopImmediatePropagation();
			}

			// Handle Cmd/Ctrl+S save
			if (isModKey && event.key.toLowerCase() === "s") {
				// Clear composing state on save
				isComposing.current = false;

				let md: string;
				if (viewMode === "source" || (viewMode === "split" && isTextareaFocused.current)) {
					// Get content from textarea
					const textarea = document.querySelector(
						".source-pane textarea",
					) as HTMLTextAreaElement;
					md = textarea?.value ?? markdown;
				} else if (editor && !editor.isDestroyed) {
					// Get content from editor
					const html = editor.getHTML();
					md = turndown.turndown(html);
					if (baseUriRef.current) {
						md = untransformImagePaths(md, baseUriRef.current);
					}
				} else {
					return;
				}

				// Update state
				setMarkdown(md);

				// Send to VS Code (with dedup check)
				const normalizedMd = md.replace(/\r\n/g, "\n").trim();
				const normalizedLast = (lastSyncedMarkdownRef.current || "").replace(/\r\n/g, "\n").trim();
				if (normalizedMd !== normalizedLast) {
					lastSyncedMarkdownRef.current = md;
					vscode.postMessage({ type: "edit", content: md });
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown, true);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [editor, viewMode, markdown, setMarkdown, refs, vscode]);
}
