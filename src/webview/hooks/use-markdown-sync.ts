import { useRef, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { ViewMode } from "../types";
import { untransformImagePaths } from "../utils/image-paths";
import { turndown } from "../utils/markdown/turndown-config";
import { parseMarkdown } from "../utils/markdown/parser";
import { normalizeContent } from "../utils/normalize";

/** Debounce delay (ms) for syncing editor changes to VS Code */
const SYNC_DEBOUNCE_MS = 100;

interface UseMarkdownSyncOptions {
	editor: Editor | null;
	markdown: string;
	setMarkdown: (md: string) => void;
	viewMode: ViewMode;
	baseUri: string;
	vscode: { postMessage: (message: unknown) => void };
}

export interface MarkdownSyncRefs {
	baseUriRef: React.RefObject<string>;
	isUpdatingFromExtension: React.RefObject<boolean>;
	isComposing: React.RefObject<boolean>;
	isTextareaFocused: React.RefObject<boolean>;
	isSaving: React.RefObject<boolean>;
	isEditorEditing: React.RefObject<boolean>;
	lastSyncedMarkdownRef: React.RefObject<string>;
}

export function useMarkdownSync({
	editor,
	markdown,
	setMarkdown,
	viewMode,
	baseUri,
	vscode,
}: UseMarkdownSyncOptions) {
	// Core refs
	const baseUriRef = useRef<string>("");
	const lastSyncedMarkdownRef = useRef<string>("");

	// Guard refs - simplified
	const isUpdatingFromExtension = useRef(false);
	const isComposing = useRef(false);
	const isTextareaFocused = useRef(false);

	// Legacy refs for interface compatibility (can be removed later)
	const isSaving = useRef(false);
	const isEditorEditing = useRef(false);

	// Debounce ref
	const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Sync baseUri ref
	useEffect(() => {
		baseUriRef.current = baseUri;
	}, [baseUri]);

	// Send markdown to VS Code (with dedup)
	const syncToVSCode = useCallback((md: string) => {
		if (normalizeContent(md) !== normalizeContent(lastSyncedMarkdownRef.current)) {
			lastSyncedMarkdownRef.current = md;
			vscode.postMessage({ type: "edit", content: md });
		}
	}, [vscode]);

	// Handle editor onUpdate - convert HTML to markdown
	const handleEditorUpdate = useCallback(
		(editorInstance: Editor) => {
			// Skip if this update is from extension or during composition
			if (isUpdatingFromExtension.current || isComposing.current || isTextareaFocused.current) {
				return;
			}

			// Debounce the update
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
			}

			updateTimeoutRef.current = setTimeout(() => {
				const html = editorInstance.getHTML();
				let md = turndown.turndown(html);
				if (baseUriRef.current) {
					md = untransformImagePaths(md, baseUriRef.current);
				}
				setMarkdown(md);
				syncToVSCode(md);
			}, SYNC_DEBOUNCE_MS);
		},
		[setMarkdown, syncToVSCode],
	);

	// Handle IME composition events for TipTap editor
	useEffect(() => {
		const handleCompositionStart = (e: CompositionEvent) => {
			const target = e.target as HTMLElement;
			if (target.closest(".ProseMirror")) {
				isComposing.current = true;
			}
		};

		const handleCompositionEnd = (e: CompositionEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest(".ProseMirror")) {
				return;
			}

			isComposing.current = false;
			if (editor && !editor.isDestroyed) {
				setTimeout(() => {
					const html = editor.getHTML();
					let md = turndown.turndown(html);
					if (baseUriRef.current) {
						md = untransformImagePaths(md, baseUriRef.current);
					}
					setMarkdown(md);
					syncToVSCode(md);
				}, 50);
			}
		};

		document.addEventListener("compositionstart", handleCompositionStart);
		document.addEventListener("compositionend", handleCompositionEnd);

		return () => {
			document.removeEventListener("compositionstart", handleCompositionStart);
			document.removeEventListener("compositionend", handleCompositionEnd);
		};
	}, [editor, setMarkdown, syncToVSCode]);

	// Handle source textarea change
	const handleSourceChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newMarkdown = e.target.value;
			setMarkdown(newMarkdown);

			// Sync to editor in split view (only if not composing)
			if (!isComposing.current && editor && viewMode === "split") {
				isUpdatingFromExtension.current = true;
				const html = parseMarkdown(newMarkdown, baseUri);
				editor.commands.setContent(html);
				setTimeout(() => {
					isUpdatingFromExtension.current = false;
				}, 50);
			}

			// Debounce sync to VS Code
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
			}
			updateTimeoutRef.current = setTimeout(() => {
				syncToVSCode(newMarkdown);
			}, SYNC_DEBOUNCE_MS);
		},
		[editor, viewMode, baseUri, setMarkdown, syncToVSCode],
	);

	// Handle source textarea composition end
	const handleSourceCompositionEnd = useCallback(
		(e: React.CompositionEvent<HTMLTextAreaElement>) => {
			const newMarkdown = e.currentTarget.value;
			setMarkdown(newMarkdown);
			isComposing.current = false;

			// Sync to editor in split view
			if (editor && viewMode === "split" && !editor.isDestroyed) {
				isUpdatingFromExtension.current = true;
				const html = parseMarkdown(newMarkdown, baseUri);
				editor.commands.setContent(html);
				setTimeout(() => {
					isUpdatingFromExtension.current = false;
				}, 50);
			}

			syncToVSCode(newMarkdown);
		},
		[editor, viewMode, baseUri, setMarkdown, syncToVSCode],
	);

	// Handle source textarea focus/blur
	const handleSourceFocus = useCallback(() => {
		isTextareaFocused.current = true;
	}, []);

	const handleSourceBlur = useCallback(() => {
		isTextareaFocused.current = false;
		// Final sync to editor on blur
		if (editor && viewMode === "split" && !editor.isDestroyed) {
			isUpdatingFromExtension.current = true;
			const html = parseMarkdown(markdown, baseUri);
			editor.commands.setContent(html);
			queueMicrotask(() => {
				isUpdatingFromExtension.current = false;
			});
		}
	}, [editor, viewMode, markdown, baseUri]);

	// Handle source textarea composition start
	const handleSourceCompositionStart = useCallback(() => {
		isComposing.current = true;
	}, []);

	// Sync editor content when switching to editor/split view
	useEffect(() => {
		if ((viewMode === "editor" || viewMode === "split") && editor && !editor.isDestroyed) {
			isUpdatingFromExtension.current = true;
			const html = parseMarkdown(markdown, baseUri);
			editor.commands.setContent(html);
			lastSyncedMarkdownRef.current = markdown;
			queueMicrotask(() => {
				isUpdatingFromExtension.current = false;
			});
		}
	}, [viewMode]); // Only trigger on view mode change

	return {
		refs: {
			baseUriRef,
			isUpdatingFromExtension,
			isComposing,
			isTextareaFocused,
			isSaving,
			isEditorEditing,
			lastSyncedMarkdownRef,
			updateTimeoutRef,
		},
		handleEditorUpdate,
		handleSourceChange,
		handleSourceCompositionEnd,
		handleSourceCompositionStart,
		handleSourceFocus,
		handleSourceBlur,
	};
}
