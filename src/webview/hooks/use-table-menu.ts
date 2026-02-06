import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import type { ViewMode, TableMenuState } from "../types";

interface UseTableMenuOptions {
	editor: Editor | null;
	viewMode: ViewMode;
}

export function useTableMenu({ editor, viewMode }: UseTableMenuOptions) {
	const [tableMenu, setTableMenu] = useState<TableMenuState>({
		visible: false,
		position: { x: 0, y: 0 },
	});

	// Update table menu position when selection changes
	useEffect(() => {
		if (!editor) {
			return;
		}

		let currentTableElement: HTMLElement | null = null;
		let resizeObserver: ResizeObserver | null = null;

		const updateTableMenu = () => {
			if (editor.isActive("table") && viewMode !== "source") {
				const { state } = editor;
				const { selection } = state;
				const { $anchor } = selection;

				let depth = $anchor.depth;
				while (depth > 0) {
					const node = $anchor.node(depth);
					if (node.type.name === "table") {
						break;
					}
					depth--;
				}

				if (depth > 0) {
					const tablePos = $anchor.start(depth) - 1;
					const domNode = editor.view.nodeDOM(tablePos);
					if (domNode && domNode instanceof HTMLElement) {
						const tableElement = (domNode.querySelector("table") ||
							domNode) as HTMLElement;
						const rect = tableElement.getBoundingClientRect();

						if (currentTableElement !== tableElement) {
							if (resizeObserver) {
								resizeObserver.disconnect();
							}
							currentTableElement = tableElement;
							resizeObserver = new ResizeObserver(() => {
								updateTableMenu();
							});
							resizeObserver.observe(tableElement);
						}

						const editorPane = document.querySelector(".editor-pane");
						if (editorPane) {
							const paneRect = editorPane.getBoundingClientRect();
							if (rect.top < paneRect.bottom && rect.bottom > paneRect.top) {
								setTableMenu({
									visible: true,
									position: {
										x: rect.right - 32,
										y: Math.max(rect.top + 4, paneRect.top + 4),
									},
								});
								return;
							}
						}
					}
				}
			}
			if (resizeObserver) {
				resizeObserver.disconnect();
				resizeObserver = null;
				currentTableElement = null;
			}
			setTableMenu({ visible: false, position: { x: 0, y: 0 } });
		};

		editor.on("selectionUpdate", updateTableMenu);
		editor.on("transaction", updateTableMenu);

		const editorPane = document.querySelector(".editor-pane");
		if (editorPane) {
			editorPane.addEventListener("scroll", updateTableMenu);
		}

		updateTableMenu();

		return () => {
			editor.off("selectionUpdate", updateTableMenu);
			editor.off("transaction", updateTableMenu);
			if (editorPane) {
				editorPane.removeEventListener("scroll", updateTableMenu);
			}
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
			setTableMenu({ visible: false, position: { x: 0, y: 0 } });
		};
	}, [editor, viewMode]);

	// Capture link clicks at document level
	useEffect(() => {
		const handleLinkClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const linkElement = target.closest("a");
			if (linkElement && linkElement.closest(".ProseMirror")) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		document.addEventListener("click", handleLinkClick, true);

		return () => {
			document.removeEventListener("click", handleLinkClick, true);
		};
	}, []);

	// Handle editor click to detect link clicks
	const handleEditorClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			const linkElement = target.closest("a");

			if (linkElement && editor) {
				e.preventDefault();
				e.stopPropagation();
			}
		},
		[editor],
	);

	// Handle click on empty area at bottom of editor
	const handleEditorPaneClick = useCallback(
		(e: React.MouseEvent) => {
			if (!editor) {
				return;
			}

			const target = e.target as HTMLElement;
			const editorPane = target.closest(".editor-pane");
			const proseMirror = target.closest(".ProseMirror");

			if (editorPane && !proseMirror) {
				const lastNode = editor.state.doc.lastChild;
				if (
					lastNode &&
					(lastNode.type.name !== "paragraph" ||
						lastNode.textContent.length > 0)
				) {
					editor
						.chain()
						.focus("end")
						.insertContent("<p></p>")
						.focus("end")
						.run();
				} else {
					editor.chain().focus("end").run();
				}
			}
		},
		[editor],
	);

	return {
		tableMenu,
		handleEditorClick,
		handleEditorPaneClick,
	};
}
