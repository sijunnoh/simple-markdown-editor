import { useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import type { ViewMode, ModalType, Suggestion } from "../types";
import { toWebviewUri } from "../utils/image-paths";
import { parseMarkdown } from "../utils/markdown/parser";
import type { MarkdownSyncRefs } from "./use-markdown-sync";

interface UseVSCodeMessagingOptions {
	editor: Editor | null;
	viewMode: ViewMode;
	baseUri: string;
	setBaseUri: (uri: string) => void;
	setMarkdown: (md: string) => void;
	setSuggestions: (suggestions: Suggestion[]) => void;
	setSuggestionVisible: (visible: boolean) => void;
	setSelectedIndex: (index: number) => void;
	setModalType: (type: ModalType) => void;
	setTableRows: (rows: string) => void;
	setTableCols: (cols: string) => void;
	refs: MarkdownSyncRefs;
	vscode: { postMessage: (message: unknown) => void };
	openLinkModalRef: React.MutableRefObject<(() => void) | null>;
}

// Normalize content for comparison
export function normalizeContent(content: string): string {
	return (content || "").replace(/\r\n/g, "\n").trim();
}

export function useVSCodeMessaging({
	editor,
	viewMode,
	baseUri,
	setBaseUri,
	setMarkdown,
	setSuggestions,
	setSuggestionVisible,
	setSelectedIndex,
	setModalType,
	setTableRows,
	setTableCols,
	refs,
	vscode,
	openLinkModalRef,
}: UseVSCodeMessagingOptions) {
	const {
		baseUriRef,
		isUpdatingFromExtension,
		isComposing,
		isTextareaFocused,
		lastSyncedMarkdownRef,
	} = refs;

	// Handle image edit from custom event
	const handleImageEdit = useCallback(
		(detail: { src: string; alt: string }) => {
			if (!editor) return;

			let relativeSrc = detail.src;
			if (baseUriRef.current && detail.src.startsWith(baseUriRef.current)) {
				relativeSrc =
					"./" + detail.src.substring(baseUriRef.current.length + 1);
			}

			return { relativeSrc, alt: detail.alt };
		},
		[editor, baseUriRef],
	);

	// Send ready message only once on mount
	useEffect(() => {
		vscode.postMessage({ type: "ready" });
	}, [vscode]);

	// Listen for messages from extension and custom events
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data;
			switch (message.type) {
				case "update": {
					const normalizedMsgContent = normalizeContent(message.content);
					const normalizedLastSynced = normalizeContent(lastSyncedMarkdownRef.current);

					// Skip if content is the same (dedup)
					if (normalizedMsgContent === normalizedLastSynced) {
						return;
					}

					// Skip during IME composition, textarea focus, or editor focus
					// This prevents flickering during save when editor has pending changes
					if (isComposing.current || isTextareaFocused.current || editor?.isFocused) {
						return;
					}

					// Update state
					setMarkdown(message.content);
					lastSyncedMarkdownRef.current = message.content;

					if (message.baseUri) {
						setBaseUri(message.baseUri);
						baseUriRef.current = message.baseUri;
					}

					// Update editor (if not in source-only view)
					if (editor && viewMode !== "source") {
						isUpdatingFromExtension.current = true;
						const html = parseMarkdown(message.content, message.baseUri || baseUri);
						editor.commands.setContent(html);
						setTimeout(() => {
							isUpdatingFromExtension.current = false;
						}, 50);
					}
					break;
				}
				case "suggestions":
					setSuggestions(message.suggestions);
					setSuggestionVisible(message.suggestions.length > 0);
					setSelectedIndex(0);
					break;
				case "imageSelected":
					if (message.path && editor) {
						const imageSrc = toWebviewUri(message.path, baseUriRef.current);
						editor.chain().focus().setImage({ src: imageSrc, alt: "" }).run();
					}
					break;
				case "filePathResolved":
					if (message.path && editor) {
						const imageSrc = toWebviewUri(message.path, baseUriRef.current);
						editor.chain().focus().setImage({ src: imageSrc, alt: "" }).run();
					}
					break;
				case "deleteFileResult":
					if (editor && message.action !== "cancel") {
						editor.commands.deleteSelection();
					}
					break;
				case "command":
					if (editor && message.command) {
						switch (message.command) {
							case "toggleBold":
								editor.chain().focus().toggleBold().run();
								break;
							case "toggleItalic":
								editor.chain().focus().toggleItalic().run();
								break;
							case "toggleStrike":
								editor.chain().focus().toggleStrike().run();
								break;
							case "toggleCode":
								editor.chain().focus().toggleCode().run();
								break;
							case "insertLink":
								openLinkModalRef.current?.();
								break;
							case "insertImage":
								vscode.postMessage({ type: "pickImage" });
								break;
							case "insertTable":
								setTableRows("3");
								setTableCols("3");
								setModalType("table");
								break;
							case "setHeading1":
								editor.chain().focus().toggleHeading({ level: 1 }).run();
								break;
							case "setHeading2":
								editor.chain().focus().toggleHeading({ level: 2 }).run();
								break;
							case "setHeading3":
								editor.chain().focus().toggleHeading({ level: 3 }).run();
								break;
							case "toggleBulletList":
								editor.chain().focus().toggleBulletList().run();
								break;
							case "toggleOrderedList":
								editor.chain().focus().toggleOrderedList().run();
								break;
							case "toggleTaskList":
								editor.chain().focus().toggleTaskList().run();
								break;
							case "toggleBlockquote":
								editor.chain().focus().toggleBlockquote().run();
								break;
							case "toggleCodeBlock":
								editor.chain().focus().toggleCodeBlock().run();
								break;
						}
					}
					break;
			}
		};

		const handleEditImageEvent = (e: CustomEvent<{ src: string; alt: string }>) => {
			const result = handleImageEdit(e.detail);
			if (result) {
				window.dispatchEvent(
					new CustomEvent("open-image-modal", {
						detail: { url: result.relativeSrc, alt: result.alt },
					}),
				);
			}
		};
		const handleDeleteImageEvent = (e: CustomEvent<{ src: string }>) => {
			if (editor && e.detail && e.detail.src) {
				vscode.postMessage({ type: "deleteFile", path: e.detail.src });
			}
		};

		window.addEventListener("message", handleMessage);
		window.addEventListener("edit-image", handleEditImageEvent as EventListener);
		window.addEventListener("delete-image", handleDeleteImageEvent as EventListener);

		return () => {
			window.removeEventListener("message", handleMessage);
			window.removeEventListener("edit-image", handleEditImageEvent as EventListener);
			window.removeEventListener("delete-image", handleDeleteImageEvent as EventListener);
		};
	}, [
		editor,
		viewMode,
		baseUri,
		setBaseUri,
		setMarkdown,
		setSuggestions,
		setSuggestionVisible,
		setSelectedIndex,
		setModalType,
		setTableRows,
		setTableCols,
		vscode,
		handleImageEdit,
		openLinkModalRef,
		// refs are stable and accessed via closure
	]);

	return { handleImageEdit };
}
