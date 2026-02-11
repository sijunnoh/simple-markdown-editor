import { useEffect, useState, useRef, useLayoutEffect } from "react";
import type { ViewMode } from "./types";
import {
	useEditor,
	EditorContent,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import TiptapImage from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { common, createLowlight } from "lowlight";

// Component imports
import { Toolbar } from "./components/toolbar/Toolbar";
import { HintsBar } from "./components/hints/hints-bar";
import { SearchPanel } from "./components/search/search-panel";
import { SearchHighlightOverlay } from "./components/search/search-highlight-overlay";
import { SplitHighlightOverlay } from "./components/split-highlight/split-highlight-overlay";
import { LinkModal } from "./components/modals/link-modal";
import { ImageModal } from "./components/modals/image-modal";
import { TableModal } from "./components/modals/table-modal";
import { SettingsModal } from "./components/modals/settings-modal";
import { TableFloatingMenu } from "./components/table/table-floating-menu";
import { TableContextMenu } from "./components/table/table-context-menu";
import { useTableOperations } from "./components/table/use-table-operations";
import { SuggestionsMenu } from "./components/suggestions/suggestions-menu";
import { CodeBlockComponent } from "./components/editor/code-block-extension";
import { ImageComponent } from "./components/editor/image-extension";
import { Frontmatter } from "./components/editor/frontmatter-extension";
import { MathInline, MathBlock } from "./components/editor/math-extension";
import { LinkHoverPopup } from "./components/editor/link-hover-popup";
import { useLinkHover } from "./components/editor/use-link-hover";

// Hooks
import { useMarkdownSync } from "./hooks/use-markdown-sync";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { useVSCodeMessaging } from "./hooks/use-vs-code-messaging";
import { useFileDrop } from "./hooks/use-file-drop";
import { useSuggestions } from "./hooks/use-suggestions";
import { useTableMenu } from "./hooks/use-table-menu";
import { useSearch } from "./hooks/use-search";
import { useSplitHighlight } from "./hooks/use-split-highlight";
import { useModals } from "./hooks/use-modals";
import { useSettings } from "./hooks/use-settings";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// VS Code API
declare const acquireVsCodeApi: () => {
	postMessage: (message: unknown) => void;
	getState: () => unknown;
	setState: (state: unknown) => void;
};

const vscode = acquireVsCodeApi();

export function App() {
	// Core state
	const [markdown, setMarkdown] = useState<string>("");
	const [viewMode, setViewMode] = useState<ViewMode>("split");
	const [baseUri, setBaseUri] = useState<string>("");

	const openLinkModalRef = useRef<(() => void) | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const textareaScrollRef = useRef<number>(0);
	const [textareaScrollTop, setTextareaScrollTop] = useState(0);
	const [textareaScrollbarWidth, setTextareaScrollbarWidth] = useState(0);

	// Editor setup
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				codeBlock: false,
				hardBreak: { keepMarks: true },
			}),
			Link.extend({
				addProseMirrorPlugins() {
					const linkType = this.type;
					// Strip auto-linked non-URLs (linkifyjs treats "CLAUDE.md" as "http://CLAUDE.md")
					return [
						new Plugin({
							key: new PluginKey("strip-bad-autolinks"),
							appendTransaction: (transactions, _oldState, newState) => {
								if (!transactions.some((t) => t.docChanged)) {
									return;
								}
								const { tr } = newState;
								let modified = false;
								newState.doc.descendants((node, pos) => {
									if (!node.isText) {
										return;
									}
									for (const mark of node.marks) {
										if (mark.type !== linkType || !mark.attrs.href) {
											continue;
										}
										const href = mark.attrs.href as string;
										const text = node.text || "";
										const hrefBase = href.replace(/^https?:\/\//, "");
										if (!text.includes("://") && hrefBase === text) {
											tr.removeMark(pos, pos + node.nodeSize, linkType);
											modified = true;
										}
									}
								});
								if (modified) {
									tr.setMeta("preventAutolink", true);
									return tr;
								}
							},
						}),
					];
				},
				addPasteRules() {
					return [];
				},
			}).configure({
				openOnClick: false,
				HTMLAttributes: { class: "editor-link" },
			}),
			TiptapImage.extend({
				addAttributes() {
					return {
						...this.parent?.(),
						width: {
							default: null,
							renderHTML: (attributes) => {
								if (!attributes.width) {
									return {};
								}
								return { width: attributes.width };
							},
							parseHTML: (element) => element.getAttribute("width"),
						},
					};
				},
				addNodeView() {
					return ReactNodeViewRenderer(ImageComponent);
				},
			}).configure({
				inline: false,
				allowBase64: false,
			}),
			CodeBlockLowlight.extend({
				addStorage() {
					return {
						lastSelectedLanguage: "plaintext",
					};
				},
				addNodeView() {
					return ReactNodeViewRenderer(CodeBlockComponent);
				},
				addCommands() {
					return {
						...this.parent?.(),
						setCodeBlock:
							(attributes) =>
							({ commands }) => {
								return commands.setNode(this.name, {
									language: this.storage.lastSelectedLanguage,
									...attributes,
								});
							},
						toggleCodeBlock:
							(attributes) =>
							({ commands }) => {
								return commands.toggleNode(this.name, "paragraph", {
									language: this.storage.lastSelectedLanguage,
									...attributes,
								});
							},
					};
				},
				onTransaction({ transaction }) {
					if (!transaction.docChanged) {
						return;
					}

					transaction.steps.forEach((step) => {
						const stepMap = (step as unknown as { getMap?: () => { forEach: (cb: (oldStart: number, oldEnd: number, newStart: number, newEnd: number) => void) => void } }).getMap?.();
						if (!stepMap) {
							return;
						}

						stepMap.forEach(
							(
								_oldStart: number,
								_oldEnd: number,
								newStart: number,
								newEnd: number,
							) => {
								if (newEnd > newStart) {
									const { doc } = transaction;
									doc.nodesBetween(
										newStart,
										Math.min(newEnd, doc.content.size),
										(node, pos) => {
											if (
												node.type.name === "codeBlock" &&
												(node.attrs.language === "plaintext" ||
													node.attrs.language === null) &&
												this.storage.lastSelectedLanguage !== "plaintext"
											) {
												setTimeout(() => {
													this.editor.commands.command(({ tr }) => {
														tr.setNodeMarkup(pos, undefined, {
															...node.attrs,
															language: this.storage.lastSelectedLanguage,
														});
														return true;
													});
												}, 0);
											}
										},
									);
								}
							},
						);
					});
				},
			}).configure({
				lowlight,
				defaultLanguage: "plaintext",
			}),
			TaskList,
			TaskItem.configure({ nested: true }),
			Table.configure({ resizable: false }),
			TableRow,
			TableHeader,
			TableCell,
			Frontmatter,
			MathInline,
			MathBlock,
		],
		content: "",
	});

	// Markdown sync hook
	const {
		refs,
		handleEditorUpdate,
		handleSourceChange,
		handleSourceCompositionEnd,
		handleSourceCompositionStart,
		handleSourceFocus,
		handleSourceBlur,
	} = useMarkdownSync({ editor, markdown, setMarkdown, viewMode, baseUri, vscode });

	// Modals hook
	const {
		modalType, setModalType,
		linkUrl, setLinkUrl,
		linkText, setLinkText,
		imageUrl, setImageUrl,
		imageAlt, setImageAlt,
		tableRows, setTableRows,
		tableCols, setTableCols,
		openLinkModal,
		handleLinkSubmit,
		handleRemoveLink,
		openImagePicker,
		handleImageSubmit,
		openTableModal,
		handleTableSubmit,
		closeModal,
	} = useModals({ editor, baseUriRef: refs.baseUriRef, vscode });

	// Settings hook
	const { settings, openSettingsModal, handleSettingsSave } = useSettings({
		vscode,
		setModalType,
	});

	// Suggestions hook
	const {
		suggestions,
		suggestionVisible,
		suggestionPos,
		selectedIndex,
		setSuggestions,
		setSuggestionVisible,
		setSelectedIndex,
		checkForSuggestions,
		handleSuggestionKeyDown,
		handleSelectSuggestion,
	} = useSuggestions({ editor, viewMode, baseUriRef: refs.baseUriRef, vscode });

	// VS Code messaging hook
	useVSCodeMessaging({
		editor, viewMode, baseUri, setBaseUri, setMarkdown,
		setSuggestions, setSuggestionVisible, setSelectedIndex,
		setModalType, setTableRows, setTableCols, refs, vscode, openLinkModalRef,
	});

	// File drop hook
	const { handleFileDrop, handlePaste, handleDragOver } = useFileDrop({ vscode });

	// Table menu hook
	const { tableMenu, handleEditorClick, handleEditorPaneClick } = useTableMenu({ editor, viewMode });

	// Table operations hook
	const {
		tableContextMenu, handleDeleteTable, handleAddRowAbove, handleAddRowBelow,
		handleAddColumnLeft, handleAddColumnRight, handleDeleteRow, handleDeleteColumn,
		handleTableContextMenu, closeTableContextMenu,
	} = useTableOperations(editor);

	// Link hover hook
	const {
		linkHover, handleEditorMouseOver, handleEditorMouseLeave,
		handlePopupMouseEnter, handlePopupMouseLeave, handleOpenLink, handleEditLinkFromHover,
	} = useLinkHover({ editor, setLinkUrl, setLinkText, setModalType, vscode });

	// Search hook
	const {
		isOpen: searchOpen,
		searchTerm,
		replaceTerm,
		matches: searchMatches,
		currentIndex: searchIndex,
		searchTarget,
		focusTrigger: searchFocusTrigger,
		openSearch,
		toggleSearch,
		closeSearch,
		setSearchTerm,
		setReplaceTerm,
		goToNext: searchNext,
		goToPrev: searchPrev,
		replace: searchReplace,
		replaceAll: searchReplaceAll,
	} = useSearch({
		editor,
		viewMode,
		markdown,
		setMarkdown,
		textareaRef,
		isTextareaFocused: refs.isTextareaFocused,
	});

	// Split view highlight hook
	const { sourceLines, editorBlockIndex, updateFromSource } = useSplitHighlight({
		editor,
		viewMode,
		markdown,
		textareaRef,
	});

	// Apply/remove highlight class on editor blocks
	const prevHighlightRef = useRef<Element | null>(null);
	useEffect(() => {
		if (!editor) return;
		const editorElement = editor.view.dom as HTMLElement;

		// Remove previous highlight
		prevHighlightRef.current?.classList.remove("split-highlight-block");

		// Apply new highlight
		if (editorBlockIndex !== null && editorBlockIndex >= 0) {
			const block = editorElement.children[editorBlockIndex] as Element | undefined;
			if (block) {
				block.classList.add("split-highlight-block");
				prevHighlightRef.current = block;
			}
		} else {
			prevHighlightRef.current = null;
		}

		return () => {
			prevHighlightRef.current?.classList.remove("split-highlight-block");
		};
	}, [editor, editorBlockIndex]);

	// Track textarea scrollbar width (changes on resize, e.g., sidebar open/close)
	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const updateScrollbarWidth = () => {
			setTextareaScrollbarWidth(textarea.offsetWidth - textarea.clientWidth);
		};

		updateScrollbarWidth();

		const observer = new ResizeObserver(updateScrollbarWidth);
		observer.observe(textarea);
		return () => observer.disconnect();
	}, [viewMode]);

	// Keyboard shortcuts hook (must be after useSearch to access openSearch)
	useKeyboardShortcuts({
		editor, viewMode, markdown, setMarkdown, refs, vscode,
		onOpenSearch: openSearch,
		onCloseSearch: closeSearch,
		isSearchOpen: searchOpen,
	});

	// Set up editor event handlers
	useEffect(() => {
		if (!editor) {
			return;
		}

		const handleKeyDown = (_view: unknown, event: KeyboardEvent) => {
			const isModKey = event.ctrlKey || event.metaKey;
			if (isModKey && ["b", "i", "u", "k"].includes(event.key.toLowerCase())) {
				event.stopPropagation();
			}
			return handleSuggestionKeyDown(event);
		};

		editor.setOptions({ editorProps: { handleDOMEvents: { keydown: handleKeyDown } } });
	}, [editor, handleSuggestionKeyDown]);

	// Set up editor onUpdate handler
	useEffect(() => {
		if (!editor) {
			return;
		}
		const handleUpdate = ({ editor: e }: { editor: typeof editor }) => {
			if (!e) {
				return;
			}
			handleEditorUpdate(e);
			checkForSuggestions(e);
		};
		editor.on("update", handleUpdate);
		return () => {
			editor.off("update", handleUpdate);
		};
	}, [editor, handleEditorUpdate, checkForSuggestions]);

	// Restore textarea scroll position after markdown changes
	useLayoutEffect(() => {
		if (textareaRef.current && textareaScrollRef.current > 0) {
			textareaRef.current.scrollTop = textareaScrollRef.current;
		}
	}, [markdown]);

	// Sync openLinkModal ref for external triggers
	useEffect(() => {
		openLinkModalRef.current = openLinkModal;
	}, [openLinkModal]);

	return (
		<div className="simple-markdown-editor">
			<Toolbar
				editor={editor}
				viewMode={viewMode}
				onSetViewMode={setViewMode}
				onLinkClick={openLinkModal}
				onImageClick={openImagePicker}
				onTableClick={openTableModal}
				onSearchClick={toggleSearch}
				onSettingsClick={openSettingsModal}
				isSearchOpen={searchOpen}
			/>
			{searchOpen && (
				<SearchPanel
					searchTerm={searchTerm}
					replaceTerm={replaceTerm}
					currentIndex={searchIndex}
					totalMatches={searchMatches.length}
					focusTrigger={searchFocusTrigger}
					onSearchChange={setSearchTerm}
					onReplaceChange={setReplaceTerm}
					onNext={searchNext}
					onPrev={searchPrev}
					onReplace={searchReplace}
					onReplaceAll={searchReplaceAll}
					onClose={closeSearch}
				/>
			)}
			<div className="editor-container">
				{(viewMode === "editor" || viewMode === "split") && (
					<div
						className={`editor-pane ${viewMode === "split" ? "split" : ""}`}
						onClick={(e) => { handleEditorClick(e); handleEditorPaneClick(e); closeTableContextMenu(); }}
						onContextMenu={handleTableContextMenu}
						onMouseOver={handleEditorMouseOver}
						onMouseLeave={handleEditorMouseLeave}
						onDrop={handleFileDrop}
						onDragOver={handleDragOver}
						onPaste={handlePaste}
					>
						<EditorContent editor={editor} />
						<div className="editor-bottom-area" />
					</div>
				)}
				{(viewMode === "source" || viewMode === "split") && (
					<div className={`source-pane ${viewMode === "split" ? "split" : ""}`}>
						{searchOpen && searchTarget === "textarea" && searchMatches.length > 0 && (
							<SearchHighlightOverlay
								text={markdown}
								matches={searchMatches}
								currentIndex={searchIndex}
								scrollTop={textareaScrollTop}
							/>
						)}
						{!searchOpen && viewMode === "split" && sourceLines && (
							<SplitHighlightOverlay
								text={markdown}
								highlightLines={sourceLines}
								scrollTop={textareaScrollTop}
								scrollbarWidth={textareaScrollbarWidth}
							/>
						)}
						<textarea
							ref={textareaRef}
							value={markdown}
							onChange={handleSourceChange}
							onFocus={handleSourceFocus}
							onBlur={handleSourceBlur}
							onCompositionStart={handleSourceCompositionStart}
							onCompositionEnd={handleSourceCompositionEnd}
							onScroll={(e) => {
								const ta = e.currentTarget;
								textareaScrollRef.current = ta.scrollTop;
								setTextareaScrollTop(ta.scrollTop);
								setTextareaScrollbarWidth(ta.offsetWidth - ta.clientWidth);
							}}
							onClick={updateFromSource}
							onKeyUp={updateFromSource}
							spellCheck={false}
							placeholder="Write markdown here..."
						/>
					</div>
				)}
			</div>
			<HintsBar viewMode={viewMode} />

			<LinkHoverPopup
				linkHover={linkHover}
				onMouseEnter={handlePopupMouseEnter}
				onMouseLeave={handlePopupMouseLeave}
				onOpenLink={handleOpenLink}
				onEditLink={handleEditLinkFromHover}
			/>

			<TableFloatingMenu tableMenu={tableMenu} onDeleteTable={handleDeleteTable} />

			<TableContextMenu
				tableContextMenu={tableContextMenu}
				onClose={closeTableContextMenu}
				onAddRowAbove={handleAddRowAbove}
				onAddRowBelow={handleAddRowBelow}
				onAddColumnLeft={handleAddColumnLeft}
				onAddColumnRight={handleAddColumnRight}
				onDeleteRow={handleDeleteRow}
				onDeleteColumn={handleDeleteColumn}
				onDeleteTable={handleDeleteTable}
			/>

			<LinkModal
				isOpen={modalType === "link"}
				onClose={closeModal}
				linkUrl={linkUrl}
				setLinkUrl={setLinkUrl}
				linkText={linkText}
				setLinkText={setLinkText}
				onSubmit={handleLinkSubmit}
				onRemove={handleRemoveLink}
				editor={editor}
			/>

			<ImageModal
				isOpen={modalType === "image"}
				onClose={closeModal}
				imageUrl={imageUrl}
				setImageUrl={setImageUrl}
				imageAlt={imageAlt}
				setImageAlt={setImageAlt}
				onSubmit={handleImageSubmit}
			/>

			<TableModal
				isOpen={modalType === "table"}
				onClose={closeModal}
				tableRows={tableRows}
				setTableRows={setTableRows}
				tableCols={tableCols}
				setTableCols={setTableCols}
				onSubmit={handleTableSubmit}
			/>

			<SettingsModal
				isOpen={modalType === "settings"}
				onClose={closeModal}
				settings={settings}
				onSave={handleSettingsSave}
			/>

			{suggestionVisible && (
				<SuggestionsMenu
					suggestions={suggestions}
					selectedIndex={selectedIndex}
					position={suggestionPos}
					onSelect={handleSelectSuggestion}
				/>
			)}
		</div>
	);
}
