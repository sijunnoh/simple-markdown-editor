import { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
import type { ViewMode, ModalType, EditorSettings } from "./types";
import { toWebviewUri } from "./utils/imagePaths";
import {
	useEditor,
	EditorContent,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
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
import { Toolbar } from "./components/toolbar";
import { HintsBar } from "./components/hints";
import { LinkModal, ImageModal, TableModal, SettingsModal } from "./components/modals";
import {
	TableFloatingMenu,
	TableContextMenu,
	useTableOperations,
} from "./components/table";
import { SuggestionsMenu } from "./components/suggestions";
import {
	CodeBlockComponent,
	ImageComponent,
	lastSelectedLanguage,
	LinkHoverPopup,
	useLinkHover,
} from "./components/editor";

// Hooks
import {
	useMarkdownSync,
	useKeyboardShortcuts,
	useVSCodeMessaging,
	useFileDrop,
	useSuggestions,
	useTableMenu,
} from "./hooks";

// Utils
import { updateTurndownOptions } from "./utils/markdown/turndownConfig";

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
	const [viewMode, setViewMode] = useState<ViewMode>("editor");
	const [baseUri, setBaseUri] = useState<string>("");

	// Settings state (initialized with defaults, actual settings loaded from extension via globalState)
	const [settings, setSettings] = useState<EditorSettings>({
		imageDirectory: "./images",
		emDelimiter: "*",
		strongDelimiter: "**",
		headingSizePreset: "medium",
		indentationStyle: "2spaces",
	});

	// Modal state
	const [modalType, setModalType] = useState<ModalType>(null);
	const [linkUrl, setLinkUrl] = useState<string>("");
	const [linkText, setLinkText] = useState<string>("");
	const [imageUrl, setImageUrl] = useState<string>("");
	const [imageAlt, setImageAlt] = useState<string>("");
	const [tableRows, setTableRows] = useState<string>("3");
	const [tableCols, setTableCols] = useState<string>("3");

	const openLinkModalRef = useRef<(() => void) | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const textareaScrollRef = useRef<number>(0);

	// Editor setup
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				codeBlock: false,
				hardBreak: { keepMarks: true },
			}),
			Link.configure({
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
									language: lastSelectedLanguage,
									...attributes,
								});
							},
						toggleCodeBlock:
							(attributes) =>
							({ commands }) => {
								return commands.toggleNode(this.name, "paragraph", {
									language: lastSelectedLanguage,
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
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const stepMap = (step as any).getMap?.();
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
												lastSelectedLanguage !== "plaintext"
											) {
												setTimeout(() => {
													this.editor.commands.command(({ tr }) => {
														tr.setNodeMarkup(pos, undefined, {
															...node.attrs,
															language: lastSelectedLanguage,
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

	// Keyboard shortcuts hook
	useKeyboardShortcuts({ editor, viewMode, markdown, setMarkdown, refs, vscode });

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

	// Listen for image modal open event
	useEffect(() => {
		const handleOpenImageModal = (e: CustomEvent<{ url: string; alt: string }>) => {
			setImageUrl(e.detail.url);
			setImageAlt(e.detail.alt);
			setModalType("image");
		};
		window.addEventListener("open-image-modal", handleOpenImageModal as EventListener);
		return () => {
			window.removeEventListener("open-image-modal", handleOpenImageModal as EventListener);
		};
	}, []);

	// Link modal handlers
	const openLinkModal = useCallback(() => {
		if (!editor) {
			return;
		}
		const { from, to } = editor.state.selection;
		setLinkText(editor.state.doc.textBetween(from, to, ""));
		setLinkUrl(editor.getAttributes("link").href || "");
		setModalType("link");
	}, [editor]);

	useEffect(() => {
		openLinkModalRef.current = openLinkModal;
	}, [openLinkModal]);

	const handleLinkSubmit = useCallback(() => {
		if (!editor || !linkUrl) {
			return;
		}
		const { from, to, empty } = editor.state.selection;
		if (empty) {
			editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText || linkUrl}</a>`).unsetMark("link").run();
		} else if (linkText && linkText !== editor.state.doc.textBetween(from, to, "")) {
			editor.chain().focus().deleteSelection().insertContent(`<a href="${linkUrl}">${linkText}</a>`).unsetMark("link").run();
		} else {
			editor.chain().focus().setLink({ href: linkUrl }).setTextSelection(to).unsetMark("link").run();
		}
		setModalType(null);
		setLinkUrl("");
		setLinkText("");
	}, [editor, linkUrl, linkText]);

	const handleRemoveLink = useCallback(() => {
		if (!editor) {
			return;
		}
		editor.chain().focus().deleteSelection().run();
		setModalType(null);
		setLinkUrl("");
		setLinkText("");
	}, [editor]);

	// Image modal handlers
	const openImagePicker = useCallback(() => {
		vscode.postMessage({ type: "pickImage" });
	}, []);

	const handleImageSubmit = useCallback(() => {
		if (!editor || !imageUrl) {
			return;
		}
		const src = toWebviewUri(imageUrl, refs.baseUriRef.current);
		if (editor.isActive("image")) {
			editor.chain().focus().updateAttributes("image", { src, alt: imageAlt || "" }).run();
		} else {
			editor.chain().focus().setImage({ src, alt: imageAlt || "" }).run();
		}
		setModalType(null);
		setImageUrl("");
		setImageAlt("");
	}, [editor, imageUrl, imageAlt, refs.baseUriRef]);

	// Table modal handlers
	const openTableModal = useCallback(() => {
		if (!editor) {
			return;
		}
		setTableRows("3");
		setTableCols("3");
		setModalType("table");
	}, [editor]);

	const handleTableSubmit = useCallback(() => {
		if (!editor) {
			return;
		}
		const rows = Math.max(1, Math.min(parseInt(tableRows, 10) || 3, 20));
		const cols = Math.max(1, Math.min(parseInt(tableCols, 10) || 3, 10));
		editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
		setModalType(null);
		setTableRows("3");
		setTableCols("3");
	}, [editor, tableRows, tableCols]);

	// Close modal
	const closeModal = useCallback(() => {
		setModalType(null);
		setLinkUrl("");
		setLinkText("");
		setImageUrl("");
		setImageAlt("");
		setTableRows("3");
		setTableCols("3");
	}, []);

	// Settings handlers
	const openSettingsModal = useCallback(() => {
		setModalType("settings");
	}, []);

	const handleSettingsSave = useCallback((newSettings: EditorSettings) => {
		setSettings(newSettings);
		updateTurndownOptions(newSettings);
		// Send full settings to extension for persistence
		vscode.postMessage({
			type: "updateSettings",
			settings: newSettings,
		});
	}, []);

	// Listen for settings from extension (on ready)
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data;
			if (message.type === "settings" && message.settings) {
				setSettings(message.settings);
				updateTurndownOptions(message.settings);
				applyHeadingSizePreset(message.settings.headingSizePreset);
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

	// Apply settings on mount and when settings change
	useEffect(() => {
		updateTurndownOptions(settings);
		applyHeadingSizePreset(settings.headingSizePreset);
	}, [settings]);

	// Apply heading size CSS variables
	const applyHeadingSizePreset = (preset: EditorSettings["headingSizePreset"]) => {
		const root = document.documentElement;
		const sizes = {
			small: { h1: "1.6em", h2: "1.3em", h3: "1.15em", h4: "1.05em", h5: "1em" },
			medium: { h1: "2em", h2: "1.5em", h3: "1.25em", h4: "1.1em", h5: "1.05em" },
			large: { h1: "2.4em", h2: "1.8em", h3: "1.5em", h4: "1.25em", h5: "1.1em" },
		};
		const selected = sizes[preset] || sizes.medium;
		root.style.setProperty("--heading-h1-size", selected.h1);
		root.style.setProperty("--heading-h2-size", selected.h2);
		root.style.setProperty("--heading-h3-size", selected.h3);
		root.style.setProperty("--heading-h4-size", selected.h4);
		root.style.setProperty("--heading-h5-size", selected.h5);
	};

	return (
		<div className="simple-markdown-editor">
			<Toolbar
				editor={editor}
				viewMode={viewMode}
				onSetViewMode={setViewMode}
				onLinkClick={openLinkModal}
				onImageClick={openImagePicker}
				onTableClick={openTableModal}
				onSettingsClick={openSettingsModal}
			/>
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
						<textarea
							ref={textareaRef}
							value={markdown}
							onChange={handleSourceChange}
							onFocus={handleSourceFocus}
							onBlur={handleSourceBlur}
							onCompositionStart={handleSourceCompositionStart}
							onCompositionEnd={handleSourceCompositionEnd}
							onScroll={(e) => {
								textareaScrollRef.current = e.currentTarget.scrollTop;
							}}
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
