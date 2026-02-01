import { useEffect, useState, useRef, useCallback } from "react";
import {
	useEditor,
	EditorContent,
	ReactNodeViewRenderer,
	NodeViewWrapper,
	NodeViewContent,
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
import { marked } from "marked";
import TurndownService from "turndown";
import {
	BoldIcon,
	ItalicIcon,
	StrikethroughIcon,
	CodeIcon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	Heading4Icon,
	Heading5Icon,
	ListIcon,
	ListOrderedIcon,
	ListTodoIcon,
	QuoteIcon,
	LinkIcon,
	TerminalIcon,
	PenLineIcon,
	Columns2Icon,
	ImageIcon,
	XIcon,
	ExternalLinkIcon,
	PencilIcon,
	Trash2Icon,
	TableIcon,
} from "lucide-react";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Track last selected language for new code blocks
let lastSelectedLanguage = "plaintext";

// CodeBlock component for ReactNodeViewRenderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CodeBlockComponent({ node, updateAttributes, extension }: any) {
	const language = node.attrs.language || "plaintext";
	const languages: string[] =
		extension.options.lowlight?.listLanguages?.() || [];

	const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLanguage = e.target.value;
		updateAttributes({ language: newLanguage });
		// Remember this language for the next code block
		lastSelectedLanguage = newLanguage;
	};

	return (
		<NodeViewWrapper className="code-block">
			<select
				contentEditable={false}
				value={language}
				onChange={handleLanguageChange}
			>
				<option value="plaintext">auto</option>
				<option disabled>—</option>
				{languages.map((lang: string) => (
					<option key={lang} value={lang}>
						{lang}
					</option>
				))}
			</select>
			<pre>
				<NodeViewContent as={"code" as "div"} />
			</pre>
		</NodeViewWrapper>
	);
}

// Image component for resizing
function ImageComponent({ node, updateAttributes, selected }: any) {
	const { src, alt, width } = node.attrs;
	const containerRef = useRef<HTMLDivElement>(null);
	const [isResizing, setIsResizing] = useState(false);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			setIsResizing(true);
			const startX = e.clientX;
			const startWidth = containerRef.current?.offsetWidth || 0;

			const onMouseMove = (moveEvent: MouseEvent) => {
				const currentX = moveEvent.clientX;
				const diffX = currentX - startX;
				const newWidth = Math.max(50, startWidth + diffX);
				updateAttributes({ width: newWidth });
			};

			const onMouseUp = () => {
				setIsResizing(false);
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
			};

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		},
		[updateAttributes],
	);

	return (
		<NodeViewWrapper className={`image-view ${selected ? "selected" : ""}`}>
			<div
				ref={containerRef}
				className="image-container"
				style={{
					width: width ? `${width}px` : undefined,
				}}
			>
				<img src={src} alt={alt} style={{ width: "100%", display: "block" }} />
				{selected && (
					<>
						<div className="image-edit-menu" contentEditable={false}>
							<button
								className="image-edit-btn"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									window.dispatchEvent(
										new CustomEvent("edit-image", { detail: { src, alt } }),
									);
								}}
								title="Edit image"
							>
								<PencilIcon size={14} />
							</button>
							<button
								className="image-edit-btn"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									window.dispatchEvent(
										new CustomEvent("delete-image", { detail: { src } }),
									);
								}}
								title="Delete image"
								style={{ color: "var(--vscode-errorForeground)" }}
							>
								<Trash2Icon size={14} />
							</button>
						</div>
						<div
							className={`resize-handle ${isResizing ? "resizing" : ""}`}
							onMouseDown={handleMouseDown}
						/>
					</>
				)}
			</div>
		</NodeViewWrapper>
	);
}

// VS Code API
declare const acquireVsCodeApi: () => {
	postMessage: (message: unknown) => void;
	getState: () => unknown;
	setState: (state: unknown) => void;
};

const vscode = acquireVsCodeApi();

// View modes
type ViewMode = "editor" | "source" | "split";

// Turndown instance for HTML -> Markdown
const turndown = new TurndownService({
	headingStyle: "atx",
	codeBlockStyle: "fenced",
	blankReplacement: (content, node) => {
		// Preserve blank lines
		return "\n\n";
	},
});

// Configure turndown rules
turndown.addRule("preserveParagraphs", {
	filter: "p",
	replacement: (content) => {
		// Empty paragraph becomes a blank line
		if (!content.trim()) {
			return "\n\n";
		}
		return content + "\n\n";
	},
});

// TaskList conversion rule
turndown.addRule("taskListItem", {
	filter: (node) => {
		return (
			node.nodeName === "LI" &&
			node.parentElement?.getAttribute("data-type") === "taskList"
		);
	},
	replacement: (content, node) => {
		const element = node as HTMLElement;
		const isChecked = element.getAttribute("data-checked") === "true";
		const checkbox = isChecked ? "[x]" : "[ ]";
		return `- ${checkbox} ${content.trim()}\n`;
	},
});

// TaskList wrapper rule
turndown.addRule("taskList", {
	filter: (node) => {
		return (
			node.nodeName === "UL" && node.getAttribute("data-type") === "taskList"
		);
	},
	replacement: (content) => {
		return content + "\n";
	},
});

// Image rule to handle width attribute
turndown.addRule("imageWidth", {
	filter: "img",
	replacement: (content, node) => {
		const img = node as HTMLImageElement;
		const src = img.getAttribute("src") || "";
		const alt = img.getAttribute("alt") || "";
		const width = img.getAttribute("width");

		if (width) {
			return `<img src="${src}" alt="${alt}" width="${width}">`;
		}
		// Return standard markdown if no width
		return `![${alt}](${src})`;
	},
});

// Code block conversion rule - handles NodeViewWrapper structure
turndown.addRule("codeBlockWrapper", {
	filter: (node) => {
		// Match the NodeViewWrapper div with code-block class
		return (
			node.nodeName === "DIV" &&
			(node as HTMLElement).classList?.contains("code-block")
		);
	},
	replacement: (_content, node) => {
		const wrapper = node as HTMLElement;
		const selectElement = wrapper.querySelector("select");
		const codeElement = wrapper.querySelector("pre code");
		const language = selectElement?.value || "plaintext";
		const code = codeElement?.textContent || "";
		const langStr = language === "plaintext" ? "" : language;
		return `\n\`\`\`${langStr}\n${code}\n\`\`\`\n`;
	},
});

// Fallback code block rule for regular pre > code structure
turndown.addRule("codeBlock", {
	filter: (node) => {
		// Only match if not already handled by wrapper rule
		const parent = node.parentElement;
		if (parent?.classList?.contains("code-block")) {
			return false;
		}
		return node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE";
	},
	replacement: (_content, node) => {
		const preElement = node as HTMLPreElement;
		const codeElement = preElement.querySelector("code");
		const language = codeElement?.className?.match(/language-(\w+)/)?.[1] || "";
		const code = codeElement?.textContent || "";
		return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
	},
});

// Table conversion rule
turndown.addRule("table", {
	filter: "table",
	replacement: (_content, node) => {
		const table = node as HTMLTableElement;
		const rows: string[][] = [];
		const headerCells: string[] = [];

		// Process thead
		const thead = table.querySelector("thead");
		if (thead) {
			const headerRow = thead.querySelector("tr");
			if (headerRow) {
				headerRow.querySelectorAll("th").forEach((th) => {
					headerCells.push(th.textContent?.trim() || "");
				});
			}
		}

		// Process tbody
		const tbody = table.querySelector("tbody");
		if (tbody) {
			tbody.querySelectorAll("tr").forEach((tr) => {
				const cells: string[] = [];
				tr.querySelectorAll("td, th").forEach((cell) => {
					cells.push(cell.textContent?.trim() || "");
				});
				if (cells.length > 0) {
					rows.push(cells);
				}
			});
		}

		// If no thead, use first row as header
		if (headerCells.length === 0 && rows.length > 0) {
			headerCells.push(...rows.shift()!);
		}

		if (headerCells.length === 0) return "";

		// Build markdown table
		const colCount = headerCells.length;
		let md = "\n";
		md += "| " + headerCells.join(" | ") + " |\n";
		md += "| " + headerCells.map(() => "---").join(" | ") + " |\n";
		rows.forEach((row) => {
			// Pad row to match column count
			while (row.length < colCount) row.push("");
			md += "| " + row.slice(0, colCount).join(" | ") + " |\n";
		});
		md += "\n";
		return md;
	},
});

// Transform relative image paths to webview URIs
function transformImagePaths(html: string, baseUri: string): string {
	if (!baseUri) return html;

	// Transform relative image src to absolute webview URIs
	// Match src="./path" or src="path" (not starting with http/https/data)
	return html.replace(
		/(<img[^>]*\ssrc=["'])(?!https?:|data:|vscode-webview-resource:)([^"']+)(["'][^>]*>)/gi,
		(_match, prefix, src, suffix) => {
			// Remove leading ./ if present
			const cleanSrc = src.replace(/^\.\//, "");
			const absoluteSrc = `${baseUri}/${cleanSrc}`;
			return `${prefix}${absoluteSrc}${suffix}`;
		},
	);
}

// Transform webview URIs back to relative paths
function untransformImagePaths(markdown: string, baseUri: string): string {
	if (!baseUri) return markdown;

	// Escape special regex characters in baseUri
	const escapedBaseUri = baseUri.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	// Match the baseUri pattern and replace with relative path for standard markdown images
	const mdRegex = new RegExp(
		`!\\[([^\\]]*)\\]\\(${escapedBaseUri}/([^)]+)\\)`,
		"g",
	);
	let processed = markdown.replace(mdRegex, "![$1](./$2)");

	// Match the baseUri pattern and replace with relative path for HTML img tags
	const htmlRegex = new RegExp(
		`(<img[^>]*\\ssrc=["'])${escapedBaseUri}/([^"']+)(["'][^>]*>)`,
		"gi",
	);
	processed = processed.replace(htmlRegex, "$1./$2$3");

	return processed;
}

// Helper to convert relative path to webview URI
function toWebviewUri(path: string, baseUri: string): string {
	if (!baseUri || path.startsWith("http") || path.startsWith("data:")) {
		return path;
	}
	// Remove leading ./ if present
	const cleanPath = path.replace(/^\.\//, "");
	// Encode path segments to handle spaces and special characters
	const encodedPath = cleanPath
		.split("/")
		.map((segment) => encodeURIComponent(segment))
		.join("/");
	return `${baseUri}/${encodedPath}`;
}

// Parse markdown to HTML with task list support
function parseMarkdown(markdown: string, baseUri?: string): string {
	// Preserve multiple blank lines by converting them to placeholder
	// Each extra blank line beyond the first becomes a marker
	const blankLineMarker = "<!-- BLANK_LINE -->";
	let processedMd = markdown.replace(/\n\n\n+/g, (match) => {
		// Count extra newlines beyond the standard paragraph break (\n\n)
		const extraLines = match.length - 2;
		return "\n\n" + (blankLineMarker + "\n\n").repeat(extraLines);
	});

	// First, extract and convert task lists
	const lines = processedMd.split("\n");
	const segments: { type: "md" | "tasklist"; content: string }[] = [];
	let currentMd: string[] = [];
	let taskItems: { checked: boolean; text: string }[] = [];

	const flushMd = () => {
		if (currentMd.length > 0) {
			segments.push({ type: "md", content: currentMd.join("\n") });
			currentMd = [];
		}
	};

	const flushTaskList = () => {
		if (taskItems.length > 0) {
			const itemsHtml = taskItems
				.map((item) => {
					const checked = item.checked ? "true" : "false";
					const checkedAttr = item.checked ? " checked" : "";
					return `<li data-type="taskItem" data-checked="${checked}"><label><input type="checkbox"${checkedAttr}></label><div><p>${item.text}</p></div></li>`;
				})
				.join("");
			segments.push({
				type: "tasklist",
				content: `<ul data-type="taskList">${itemsHtml}</ul>`,
			});
			taskItems = [];
		}
	};

	for (const line of lines) {
		const match = /^- \[([ xX])\] (.*)$/.exec(line);
		if (match) {
			flushMd();
			taskItems.push({
				checked: match[1].toLowerCase() === "x",
				text: match[2] || "",
			});
		} else {
			flushTaskList();
			currentMd.push(line);
		}
	}
	flushMd();
	flushTaskList();

	// Process each segment
	let html = segments
		.map((seg) => {
			if (seg.type === "tasklist") {
				return seg.content;
			}
			return marked.parse(seg.content, {
				async: false,
				breaks: true,
			}) as string;
		})
		.join("");

	// Replace blank line markers with empty paragraphs
	html = html.replace(new RegExp(`<p>${blankLineMarker}</p>`, "g"), "<p></p>");

	// Transform image paths to webview URIs
	if (baseUri) {
		html = transformImagePaths(html, baseUri);
	}

	return html;
}

// Modal types
type ModalType = "link" | "image" | "table" | null;

// Hints bar component
function HintsBar({ viewMode }: { viewMode: ViewMode }) {
	const isMac = navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
	const modKey = isMac ? "⌘" : "Ctrl";

	const sourceHints = [
		{ key: "#", desc: "H1" },
		{ key: "##", desc: "H2" },
		{ key: "###", desc: "H3" },
		{ key: "**text**", desc: "Bold" },
		{ key: "*text*", desc: "Italic" },
		{ key: "~~text~~", desc: "Strike" },
		{ key: "`code`", desc: "Code" },
		{ key: "- item", desc: "List" },
		{ key: "1. item", desc: "Numbered" },
		{ key: "- [ ]", desc: "Task" },
		{ key: "- [x]", desc: "Done" },
		{ key: "[text](url)", desc: "Link" },
		{ key: "![alt](url)", desc: "Image" },
		{ key: "> quote", desc: "Quote" },
		{ key: "```lang", desc: "Code Block" },
		{ key: "---", desc: "Divider" },
	];

	const inputRules = [
		{ key: "# ␣", desc: "→ H1" },
		{ key: "## ␣", desc: "→ H2" },
		{ key: "### ␣", desc: "→ H3" },
		{ key: "- ␣", desc: "→ List" },
		{ key: "1. ␣", desc: "→ Numbered" },
		{ key: "[] ␣", desc: "→ Task" },
		{ key: "> ␣", desc: "→ Quote" },
		{ key: "``` ␣", desc: "→ Code" },
		{ key: "---", desc: "→ Divider" },
	];

	const shortcuts = [
		{ key: `${modKey}+B`, desc: "Bold" },
		{ key: `${modKey}+I`, desc: "Italic" },
		{ key: `${modKey}+Shift+S`, desc: "Strike" },
		{ key: `${modKey}+E`, desc: "Code" },
		{ key: `${modKey}+K`, desc: "Link" },
		{ key: `${modKey}+Z`, desc: "Undo" },
		{ key: `${modKey}+Shift+Z`, desc: "Redo" },
	];

	if (viewMode === "source") {
		return (
			<div className="hints-bar">
				<div className="hints-track">
					{sourceHints.map((hint, i) => (
						<span key={i} className="hint-item">
							<span className="hint-key">{hint.key}</span>
							<span className="hint-desc">{hint.desc}</span>
						</span>
					))}
				</div>
			</div>
		);
	}

	// Editor mode: two rows
	return (
		<div className="hints-bar two-rows">
			<div className="hints-row">
				<span className="hints-label">Input</span>
				<div className="hints-track">
					{inputRules.map((hint, i) => (
						<span key={i} className="hint-item">
							<span className="hint-key">{hint.key}</span>
							<span className="hint-desc">{hint.desc}</span>
						</span>
					))}
				</div>
			</div>
			<div className="hints-row">
				<span className="hints-label">Keys</span>
				<div className="hints-track">
					{shortcuts.map((hint, i) => (
						<span key={i} className="hint-item">
							<span className="hint-key">{hint.key}</span>
							<span className="hint-desc">{hint.desc}</span>
						</span>
					))}
				</div>
			</div>
		</div>
	);
}

// Modal component
function Modal({
	isOpen,
	title,
	onClose,
	children,
}: {
	isOpen: boolean;
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}) {
	if (!isOpen) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<span className="modal-title">{title}</span>
					<button className="modal-close" onClick={onClose}>
						<XIcon size={16} />
					</button>
				</div>
				<div className="modal-body">{children}</div>
			</div>
		</div>
	);
}

// Suggestion menu component
function SuggestionsMenu({
	suggestions,
	selectedIndex,
	position,
	onSelect,
}: {
	suggestions: Suggestion[];
	selectedIndex: number;
	position: { x: number; y: number };
	onSelect: (s: Suggestion) => void;
}) {
	return (
		<div
			className="suggestions-menu"
			style={{
				position: "fixed",
				left: position.x,
				top: position.y,
				zIndex: 200,
			}}
		>
			{suggestions.map((s, i) => (
				<div
					key={s.path}
					className={`suggestion-item ${i === selectedIndex ? "active" : ""}`}
					onClick={() => onSelect(s)}
				>
					<span className="suggestion-icon">
						{s.type === "image" ? (
							<ImageIcon size={14} />
						) : (
							<LinkIcon size={14} />
						)}
					</span>
					<span className="suggestion-label">{s.label}</span>
				</div>
			))}
		</div>
	);
}

// Link hover popup state
interface LinkHoverState {
	visible: boolean;
	url: string;
	text: string;
	position: { x: number; y: number };
	linkElement: HTMLAnchorElement | null;
}

interface ImageHoverState {
	visible: boolean;
	src: string;
	alt: string;
	position: { x: number; y: number };
}

interface Suggestion {
	label: string;
	path: string;
	type: "file" | "image";
}

// Table floating menu state
interface TableMenuState {
	visible: boolean;
	position: { x: number; y: number };
}

export function App() {
	const [markdown, setMarkdown] = useState<string>("");
	const [viewMode, setViewMode] = useState<ViewMode>("editor");
	const [modalType, setModalType] = useState<ModalType>(null);
	const [linkUrl, setLinkUrl] = useState<string>("");
	const [linkText, setLinkText] = useState<string>("");
	const [imageUrl, setImageUrl] = useState<string>("");
	const [imageAlt, setImageAlt] = useState<string>("");
	const [tableRows, setTableRows] = useState<string>("3");
	const [tableCols, setTableCols] = useState<string>("3");
	const [linkHover, setLinkHover] = useState<LinkHoverState>({
		visible: false,
		url: "",
		text: "",
		position: { x: 0, y: 0 },
		linkElement: null,
	});
	const [baseUri, setBaseUri] = useState<string>("");
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [suggestionVisible, setSuggestionVisible] = useState(false);
	const [suggestionPos, setSuggestionPos] = useState({ x: 0, y: 0 });
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [tableMenu, setTableMenu] = useState<TableMenuState>({
		visible: false,
		position: { x: 0, y: 0 },
	});

	const baseUriRef = useRef<string>("");
	const isUpdatingFromExtension = useRef(false);
	const isComposing = useRef(false); // For IME (Korean, Japanese, Chinese)
	const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const linkHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				// Disable default codeBlock, use CodeBlockLowlight instead
				codeBlock: false,
				hardBreak: {
					keepMarks: true,
				},
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "editor-link",
				},
			}),
			TiptapImage.extend({
				addAttributes() {
					return {
						...this.parent?.(),
						width: {
							default: null,
							renderHTML: (attributes) => {
								if (!attributes.width) return {};
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
						// Override setCodeBlock to use last selected language
						setCodeBlock:
							(attributes) =>
							({ commands }) => {
								return commands.setNode(this.name, {
									language: lastSelectedLanguage,
									...attributes,
								});
							},
						// Override toggleCodeBlock to use last selected language
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
					// Check if a new code block was added with default language
					if (!transaction.docChanged) return;

					transaction.steps.forEach((step) => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const stepMap = (step as any).getMap?.();
						if (!stepMap) return;

						stepMap.forEach(
							(
								_oldStart: number,
								_oldEnd: number,
								newStart: number,
								newEnd: number,
							) => {
								if (newEnd > newStart) {
									// New content was added, check for code blocks with default language
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
												// Schedule update for next tick to avoid transaction conflict
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
			TaskItem.configure({
				nested: true,
			}),
			Table.configure({
				resizable: false,
			}),
			TableRow,
			TableHeader,
			TableCell,
		],
		content: "",
		editorProps: {
			handleDOMEvents: {
				keydown: (_view, event) => {
					// Prevent VS Code from capturing formatting shortcuts
					const isModKey = event.ctrlKey || event.metaKey;
					const formattingKeys = ["b", "i", "u", "k"];
					if (isModKey && formattingKeys.includes(event.key.toLowerCase())) {
						event.stopPropagation();
					}

					// Handle suggestion navigation
					if (suggestionVisible) {
						if (event.key === "ArrowDown") {
							event.preventDefault();
							setSelectedIndex((prev) => (prev + 1) % suggestions.length);
							return true;
						}
						if (event.key === "ArrowUp") {
							event.preventDefault();
							setSelectedIndex(
								(prev) => (prev - 1 + suggestions.length) % suggestions.length,
							);
							return true;
						}
						if (event.key === "Enter" || event.key === "Tab") {
							event.preventDefault();
							handleSelectSuggestion(suggestions[selectedIndex]);
							return true;
						}
						if (event.key === "Escape") {
							event.preventDefault();
							setSuggestionVisible(false);
							return true;
						}
					}

					return false; // Let TipTap handle the event
				},
			},
		},
		onUpdate: ({ editor }) => {
			// Don't send update if we're receiving from extension or composing
			if (isUpdatingFromExtension.current || isComposing.current) return;

			// Debounce updates
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
			}

			updateTimeoutRef.current = setTimeout(() => {
				// Convert HTML to Markdown
				const html = editor.getHTML();
				let md = turndown.turndown(html);
				// Convert webview URIs back to relative paths
				if (baseUriRef.current) {
					md = untransformImagePaths(md, baseUriRef.current);
				}
				setMarkdown(md);

				vscode.postMessage({
					type: "edit",
					content: md,
				});

				// Check for suggestions
				const { state } = editor;
				const { selection } = state;
				const { $from } = selection;
				const textBefore = $from.parent.textBetween(
					Math.max(0, $from.parentOffset - 20),
					$from.parentOffset,
					null,
					"\0",
				);

				const match = /[\/\[]([^\/\[\s]*)$/.exec(textBefore);
				if (match && viewMode !== "source") {
					const query = match[1];
					const coords = editor.view.coordsAtPos($from.pos);
					setSuggestionPos({ x: coords.left, y: coords.bottom + 5 });
					vscode.postMessage({ type: "getSuggestions", query });
				} else {
					setSuggestionVisible(false);
				}
			}, 100);
		},
	});

	// Handle IME composition events
	useEffect(() => {
		const handleCompositionStart = () => {
			isComposing.current = true;
		};
		const handleCompositionEnd = () => {
			isComposing.current = false;
		};

		document.addEventListener("compositionstart", handleCompositionStart);
		document.addEventListener("compositionend", handleCompositionEnd);

		return () => {
			document.removeEventListener("compositionstart", handleCompositionStart);
			document.removeEventListener("compositionend", handleCompositionEnd);
		};
	}, []);

	// Update table menu position when selection changes, scroll, or resize
	useEffect(() => {
		if (!editor) return;

		let currentTableElement: HTMLElement | null = null;
		let resizeObserver: ResizeObserver | null = null;

		const updateTableMenu = () => {
			if (editor.isActive("table") && viewMode !== "source") {
				// Find the table element that contains the selection
				const { state } = editor;
				const { selection } = state;
				const { $anchor } = selection;

				// Find table node position
				let depth = $anchor.depth;
				while (depth > 0) {
					const node = $anchor.node(depth);
					if (node.type.name === "table") {
						break;
					}
					depth--;
				}

				if (depth > 0) {
					// Get DOM element for the table
					const tablePos = $anchor.start(depth) - 1;
					const domNode = editor.view.nodeDOM(tablePos);
					if (domNode && domNode instanceof HTMLElement) {
						const tableElement = (domNode.querySelector("table") || domNode) as HTMLElement;
						const rect = tableElement.getBoundingClientRect();

						// Setup ResizeObserver for this table
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

						// Check if table is visible in viewport
						const editorPane = document.querySelector(".editor-pane");
						if (editorPane) {
							const paneRect = editorPane.getBoundingClientRect();
							if (rect.top < paneRect.bottom && rect.bottom > paneRect.top) {
								setTableMenu({
									visible: true,
									position: { x: rect.right - 32, y: Math.max(rect.top + 4, paneRect.top + 4) },
								});
								return;
							}
						}
					}
				}
			}
			// Clean up observer when not in table
			if (resizeObserver) {
				resizeObserver.disconnect();
				resizeObserver = null;
				currentTableElement = null;
			}
			setTableMenu({ visible: false, position: { x: 0, y: 0 } });
		};

		editor.on("selectionUpdate", updateTableMenu);
		editor.on("transaction", updateTableMenu);

		// Also update on scroll
		const editorPane = document.querySelector(".editor-pane");
		if (editorPane) {
			editorPane.addEventListener("scroll", updateTableMenu);
		}

		return () => {
			editor.off("selectionUpdate", updateTableMenu);
			editor.off("transaction", updateTableMenu);
			if (editorPane) {
				editorPane.removeEventListener("scroll", updateTableMenu);
			}
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
		};
	}, [editor, viewMode]);

	// Prevent VS Code from capturing formatting shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const isModKey = event.ctrlKey || event.metaKey;
			const formattingKeys = ["b", "i", "u", "k"];
			if (isModKey && formattingKeys.includes(event.key.toLowerCase())) {
				event.stopPropagation();
				event.stopImmediatePropagation();
			}
		};

		// Capture phase to intercept before VS Code
		window.addEventListener("keydown", handleKeyDown, true);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
		};
	}, []);

	// Edit image from custom event (from NodeView)
	const handleImageEdit = useCallback(
		(detail: { src: string; alt: string }) => {
			if (!editor) return;

			// Convert to relative path for the modal if needed
			let relativeSrc = detail.src;
			if (baseUriRef.current && detail.src.startsWith(baseUriRef.current)) {
				relativeSrc =
					"./" + detail.src.substring(baseUriRef.current.length + 1);
			}

			setImageUrl(relativeSrc);
			setImageAlt(detail.alt);
			setModalType("image");
		},
		[editor],
	);

	// Listen for messages from extension and custom events
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data;
			switch (message.type) {
				case "update":
					setMarkdown(message.content);
					if (message.baseUri) {
						setBaseUri(message.baseUri);
						baseUriRef.current = message.baseUri;
					}
					if (editor && viewMode !== "source") {
						isUpdatingFromExtension.current = true;
						const html = parseMarkdown(
							message.content,
							message.baseUri || baseUri,
						);
						editor.commands.setContent(html);
						setTimeout(() => {
							isUpdatingFromExtension.current = false;
						}, 0);
					}
					break;
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
					// Handle delete result from extension
					// action: "delete" | "keep" | "cancel"
					if (editor && message.action !== "cancel") {
						// Remove from editor only if not cancelled
						editor.commands.deleteSelection();
					}
					break;
			}
		};

		const handleEditImageEvent = (e: any) => handleImageEdit(e.detail);
		const handleDeleteImageEvent = (e: any) => {
			if (editor && e.detail && e.detail.src) {
				// Ask extension first - don't delete from editor yet
				vscode.postMessage({ type: "deleteFile", path: e.detail.src });
			}
		};

		window.addEventListener("message", handleMessage);
		window.addEventListener("edit-image", handleEditImageEvent);
		window.addEventListener("delete-image", handleDeleteImageEvent);
		vscode.postMessage({ type: "ready" });

		return () => {
			window.removeEventListener("message", handleMessage);
			window.removeEventListener("edit-image", handleEditImageEvent);
			window.removeEventListener("delete-image", handleDeleteImageEvent);
		};
	}, [editor, viewMode, handleImageEdit]);

	// Handle source textarea change
	const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newMarkdown = e.target.value;
		setMarkdown(newMarkdown);

		// Update editor if in split view
		if (editor && viewMode === "split") {
			isUpdatingFromExtension.current = true;
			const html = parseMarkdown(newMarkdown, baseUri);
			editor.commands.setContent(html);
			setTimeout(() => {
				isUpdatingFromExtension.current = false;
			}, 0);
		}

		vscode.postMessage({
			type: "edit",
			content: newMarkdown,
		});
	};

	// Open link modal
	const openLinkModal = useCallback(() => {
		if (!editor) return;
		// Get selected text as link text
		const { from, to } = editor.state.selection;
		const selectedText = editor.state.doc.textBetween(from, to, "");
		setLinkText(selectedText);
		// Get existing link URL if cursor is on a link
		const attrs = editor.getAttributes("link");
		setLinkUrl(attrs.href || "");
		setModalType("link");
	}, [editor]);

	// Handle link submit
	const handleLinkSubmit = useCallback(() => {
		if (!editor || !linkUrl) return;

		const { from, to, empty } = editor.state.selection;

		if (empty) {
			// No selection: insert new link with text
			const text = linkText || linkUrl;
			editor
				.chain()
				.focus()
				.insertContent(`<a href="${linkUrl}">${text}</a>`)
				.unsetMark("link") // Exit link mark after insertion
				.run();
		} else if (
			linkText &&
			linkText !== editor.state.doc.textBetween(from, to, "")
		) {
			// Selection exists but text changed: replace with new text
			editor
				.chain()
				.focus()
				.deleteSelection()
				.insertContent(`<a href="${linkUrl}">${linkText}</a>`)
				.unsetMark("link")
				.run();
		} else {
			// Selection exists, just update the link URL
			editor
				.chain()
				.focus()
				.setLink({ href: linkUrl })
				.setTextSelection(to) // Move cursor to end
				.unsetMark("link")
				.run();
		}

		setModalType(null);
		setLinkUrl("");
		setLinkText("");
	}, [editor, linkUrl, linkText]);

	// Remove link (delete both link and text)
	const handleRemoveLink = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().deleteSelection().run();
		setModalType(null);
		setLinkUrl("");
		setLinkText("");
	}, [editor]);

	// Handle suggestion selection
	const handleSelectSuggestion = useCallback(
		(suggestion: Suggestion) => {
			if (!editor) return;

			const { state } = editor;
			const { selection } = state;
			const { $from } = selection;
			const textBefore = $from.parent.textBetween(
				Math.max(0, $from.parentOffset - 20),
				$from.parentOffset,
				null,
				"\0",
			);
			const match = /[\/\[]([^\/\[\s]*)$/.exec(textBefore);

			if (match) {
				const start = $from.pos - match[0].length;
				let content = "";
				if (suggestion.type === "image") {
					const src = toWebviewUri(suggestion.path, baseUriRef.current);
					content = `<img src="${src}" alt="">`;
				} else {
					content = `<a href="${suggestion.path}">${suggestion.label}</a>`;
				}

				editor
					.chain()
					.focus()
					.deleteRange({ from: start, to: $from.pos })
					.insertContent(content)
					.run();
			}

			setSuggestionVisible(false);
		},
		[editor],
	);

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

	// Open table modal
	const openTableModal = useCallback(() => {
		if (!editor) return;
		setTableRows("3");
		setTableCols("3");
		setModalType("table");
	}, [editor]);

	// Handle table submit (insert new table)
	const handleTableSubmit = useCallback(() => {
		if (!editor) return;

		const rows = Math.max(1, Math.min(parseInt(tableRows, 10) || 3, 20));
		const cols = Math.max(1, Math.min(parseInt(tableCols, 10) || 3, 10));

		editor
			.chain()
			.focus()
			.insertTable({ rows, cols, withHeaderRow: true })
			.run();

		setModalType(null);
		setTableRows("3");
		setTableCols("3");
	}, [editor, tableRows, tableCols]);

	// Delete table
	const handleDeleteTable = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().deleteTable().run();
		setModalType(null);
	}, [editor]);

	// Handle editor click to detect link clicks
	const handleEditorClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			const linkElement = target.closest("a");

			if (linkElement && editor) {
				// Prevent navigation - user can use hover popup to open/edit link
				e.preventDefault();
				e.stopPropagation();
			}
		},
		[editor],
	);

	// Capture link clicks at document level to prevent navigation
	useEffect(() => {
		const handleLinkClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const linkElement = target.closest("a");
			if (linkElement && linkElement.closest(".ProseMirror")) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		// Capture phase to intercept before default behavior
		document.addEventListener("click", handleLinkClick, true);

		return () => {
			document.removeEventListener("click", handleLinkClick, true);
		};
	}, []);

	// Handle mouse over for link hover popup
	const handleEditorMouseOver = useCallback((e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		const linkElement = target.closest("a") as HTMLAnchorElement | null;

		if (linkElement) {
			// Clear any pending link hide timeout
			if (linkHoverTimeoutRef.current) {
				clearTimeout(linkHoverTimeoutRef.current);
				linkHoverTimeoutRef.current = null;
			}

			const rect = linkElement.getBoundingClientRect();
			const href = linkElement.getAttribute("href") || "";
			const text = linkElement.textContent || "";

			setLinkHover({
				visible: true,
				url: href,
				text: text,
				position: { x: rect.left, y: rect.bottom + 4 },
				linkElement: linkElement,
			});
		}
	}, []);

	// Handle mouse leave for hover popups
	const handleEditorMouseLeave = useCallback((e: React.MouseEvent) => {
		const relatedTarget = e.relatedTarget as HTMLElement | null;

		// Check if moving to the popup itself
		if (relatedTarget?.closest(".link-hover-popup")) {
			return;
		}

		// Delay hiding for link hover
		linkHoverTimeoutRef.current = setTimeout(() => {
			setLinkHover((prev) => ({ ...prev, visible: false }));
		}, 150);
	}, []);

	// Handle popup mouse enter (keep popup visible)
	const handlePopupMouseEnter = useCallback(() => {
		if (linkHoverTimeoutRef.current) {
			clearTimeout(linkHoverTimeoutRef.current);
			linkHoverTimeoutRef.current = null;
		}
	}, []);

	// Handle popup mouse leave
	const handlePopupMouseLeave = useCallback(() => {
		setLinkHover((prev) => ({ ...prev, visible: false }));
	}, []);

	// Open link in browser
	const handleOpenLink = useCallback(() => {
		if (linkHover.url) {
			vscode.postMessage({ type: "openLink", url: linkHover.url });
		}
		setLinkHover((prev) => ({ ...prev, visible: false }));
	}, [linkHover.url]);

	// Edit link from hover popup
	const handleEditLinkFromHover = useCallback(() => {
		if (!editor || !linkHover.linkElement) return;

		// Find and select the link
		const { doc } = editor.state;
		let linkPos: { from: number; to: number } | null = null;

		doc.descendants((node, pos) => {
			if (node.isText && node.marks.some((mark) => mark.type.name === "link")) {
				const domNode = editor.view.nodeDOM(pos);
				if (
					domNode &&
					(domNode === linkHover.linkElement ||
						domNode.parentElement === linkHover.linkElement ||
						linkHover.linkElement?.contains(domNode as Node))
				) {
					linkPos = { from: pos, to: pos + node.nodeSize };
					return false;
				}
			}
			return true;
		});

		if (linkPos) {
			editor.commands.setTextSelection(linkPos);
		}

		setLinkUrl(linkHover.url);
		setLinkText(linkHover.text);
		setLinkHover((prev) => ({ ...prev, visible: false }));
		setModalType("link");
	}, [editor, linkHover]);

	// Open image picker (request extension to show file picker)
	const openImagePicker = useCallback(() => {
		vscode.postMessage({ type: "pickImage" });
	}, []);

	// Handle file drop from Explorer or OS
	const handleFileDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// Case 1: OS Files (Drag and drop from Finder/Explorer)
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const files = Array.from(e.dataTransfer.files);
			const imageFiles = files.filter((file) => file.type.startsWith("image/"));

			if (imageFiles.length > 0) {
				const promises = imageFiles.map((file) => {
					return new Promise<{ name: string; data: string }>((resolve) => {
						const reader = new FileReader();
						reader.onload = () => {
							const base64 = (reader.result as string).split(",")[1];
							resolve({ name: file.name, data: base64 });
						};
						reader.readAsDataURL(file);
					});
				});

				Promise.all(promises).then((droppedFiles) => {
					vscode.postMessage({
						type: "dropFiles",
						files: droppedFiles,
					});
				});
				return;
			}
		}

		// Case 2: VS Code Explorer file (has URI)
		const uriList = e.dataTransfer.getData("text/uri-list");
		if (uriList) {
			// Explorer file - send URI to extension for relative path calculation
			const uri = uriList.split("\n")[0].trim();
			if (uri.startsWith("file://")) {
				vscode.postMessage({
					type: "resolveFilePath",
					uri: uri,
				});
			}
		}
	}, []);

	// Handle clipboard paste
	const handlePaste = useCallback((e: React.ClipboardEvent) => {
		const items = e.clipboardData?.items;
		if (!items) return;

		const imageItem = Array.from(items).find((item) =>
			item.type.startsWith("image/"),
		);

		if (imageItem) {
			e.preventDefault();
			const file = imageItem.getAsFile();
			if (file) {
				const reader = new FileReader();
				reader.onload = () => {
					const base64 = (reader.result as string).split(",")[1];
					vscode.postMessage({
						type: "pasteImage",
						data: base64,
					});
				};
				reader.readAsDataURL(file);
			}
		}
	}, []);

	// Handle file drag over
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	// Handle image submit
	const handleImageSubmit = useCallback(() => {
		if (!editor || !imageUrl) return;
		const src = toWebviewUri(imageUrl, baseUriRef.current);

		// If an image is selected, update it instead of inserting a new one
		if (editor.isActive("image")) {
			editor
				.chain()
				.focus()
				.updateAttributes("image", { src, alt: imageAlt || "" })
				.run();
		} else {
			editor
				.chain()
				.focus()
				.setImage({ src, alt: imageAlt || "" })
				.run();
		}

		setModalType(null);
		setImageUrl("");
		setImageAlt("");
	}, [editor, imageUrl, imageAlt]);

	// Handle click on empty area at bottom of editor
	const handleEditorPaneClick = useCallback(
		(e: React.MouseEvent) => {
			if (!editor) return;

			const target = e.target as HTMLElement;
			const editorPane = target.closest(".editor-pane");
			const proseMirror = target.closest(".ProseMirror");

			// If clicked on the editor-pane but outside ProseMirror content
			if (editorPane && !proseMirror) {
				// Check if the last node is not an empty paragraph
				const lastNode = editor.state.doc.lastChild;
				if (
					lastNode &&
					(lastNode.type.name !== "paragraph" ||
						lastNode.textContent.length > 0)
				) {
					// Add a new paragraph at the end and focus
					editor
						.chain()
						.focus("end")
						.insertContent("<p></p>")
						.focus("end")
						.run();
				} else {
					// Just focus at the end
					editor.chain().focus("end").run();
				}
			}
		},
		[editor],
	);

	return (
		<div className="simple-markdown-editor">
			<Toolbar
				editor={editor}
				viewMode={viewMode}
				onSetViewMode={setViewMode}
				onLinkClick={openLinkModal}
				onImageClick={openImagePicker}
				onTableClick={openTableModal}
			/>
			<div className="editor-container">
				{(viewMode === "editor" || viewMode === "split") && (
					<div
						className={`editor-pane ${viewMode === "split" ? "split" : ""}`}
						onClick={(e) => {
							handleEditorClick(e);
							handleEditorPaneClick(e);
						}}
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
							value={markdown}
							onChange={handleSourceChange}
							spellCheck={false}
							placeholder="Write markdown here..."
						/>
					</div>
				)}
			</div>
			<HintsBar viewMode={viewMode} />

			{/* Link Hover Popup */}
			{linkHover.visible && (
				<div
					className="link-hover-popup"
					style={{
						position: "fixed",
						left: linkHover.position.x,
						top: linkHover.position.y,
					}}
					onMouseEnter={handlePopupMouseEnter}
					onMouseLeave={handlePopupMouseLeave}
				>
					<span className="link-hover-url" title={linkHover.url}>
						{linkHover.url.length > 40
							? linkHover.url.slice(0, 40) + "..."
							: linkHover.url}
					</span>
					<button
						className="link-hover-btn"
						onClick={handleOpenLink}
						title="Open link"
					>
						<ExternalLinkIcon size={14} />
					</button>
					<button
						className="link-hover-btn"
						onClick={handleEditLinkFromHover}
						title="Edit link"
					>
						<PencilIcon size={14} />
					</button>
				</div>
			)}

			{/* Table Floating Menu */}
			{tableMenu.visible && (
				<div
					className="table-floating-menu"
					style={{
						position: "fixed",
						left: tableMenu.position.x,
						top: tableMenu.position.y,
					}}
				>
					<button
						className="table-menu-btn"
						onMouseDown={(e) => {
							e.preventDefault();
							handleDeleteTable();
						}}
						title="Delete table"
					>
						<Trash2Icon size={14} />
					</button>
				</div>
			)}

			{/* Link Modal */}
			<Modal
				isOpen={modalType === "link"}
				title="Insert Link"
				onClose={closeModal}
			>
				<div className="modal-form">
					<label>
						<span>URL</span>
						<input
							type="url"
							value={linkUrl}
							onChange={(e) => setLinkUrl(e.target.value)}
							placeholder="https://example.com"
							autoFocus
						/>
					</label>
					<label>
						<span>Text (optional)</span>
						<input
							type="text"
							value={linkText}
							onChange={(e) => setLinkText(e.target.value)}
							placeholder="Link text"
						/>
					</label>
					<div className="modal-actions">
						{editor?.isActive("link") && (
							<button className="modal-btn-danger" onClick={handleRemoveLink}>
								Remove Link
							</button>
						)}
						<button className="modal-btn-secondary" onClick={closeModal}>
							Cancel
						</button>
						<button className="modal-btn-primary" onClick={handleLinkSubmit}>
							{editor?.isActive("link") ? "Update" : "Insert"}
						</button>
					</div>
				</div>
			</Modal>

			{/* Image Modal */}
			<Modal
				isOpen={modalType === "image"}
				title="Insert Image"
				onClose={closeModal}
			>
				<div className="modal-form">
					<label>
						<span>Path</span>
						<input
							type="text"
							value={imageUrl}
							onChange={(e) => setImageUrl(e.target.value)}
							placeholder="./images/example.png"
							autoFocus
						/>
					</label>
					<label>
						<span>Alt text (optional)</span>
						<input
							type="text"
							value={imageAlt}
							onChange={(e) => setImageAlt(e.target.value)}
							placeholder="Image description"
						/>
					</label>
					<div className="modal-actions">
						<button className="modal-btn-secondary" onClick={closeModal}>
							Cancel
						</button>
						<button className="modal-btn-primary" onClick={handleImageSubmit}>
							Insert
						</button>
					</div>
				</div>
			</Modal>

			{/* Table Modal */}
			<Modal
				isOpen={modalType === "table"}
				title="Insert Table"
				onClose={closeModal}
			>
				<div className="modal-form">
					<label>
						<span>Rows</span>
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={tableRows}
							onChange={(e) => {
								const val = e.target.value.replace(/[^0-9]/g, "");
								setTableRows(val);
							}}
							onBlur={(e) => {
								const num = parseInt(e.target.value, 10);
								if (isNaN(num) || num < 1) setTableRows("1");
								else if (num > 20) setTableRows("20");
							}}
							autoFocus
						/>
					</label>
					<label>
						<span>Columns</span>
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={tableCols}
							onChange={(e) => {
								const val = e.target.value.replace(/[^0-9]/g, "");
								setTableCols(val);
							}}
							onBlur={(e) => {
								const num = parseInt(e.target.value, 10);
								if (isNaN(num) || num < 1) setTableCols("1");
								else if (num > 10) setTableCols("10");
							}}
						/>
					</label>
					<div className="modal-actions">
						<button className="modal-btn-secondary" onClick={closeModal}>
							Cancel
						</button>
						<button className="modal-btn-primary" onClick={handleTableSubmit}>
							Insert
						</button>
					</div>
				</div>
			</Modal>

			{/* Suggestions Menu */}
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

// Toolbar Button component
function ToolbarButton({
	icon,
	label,
	onClick,
	active,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	active?: boolean;
}) {
	return (
		<button
			title={label}
			onMouseDown={(e) => {
				e.preventDefault(); // Prevent losing focus
				onClick();
			}}
			className={active ? "active" : ""}
		>
			{icon}
		</button>
	);
}

// Toolbar component
function Toolbar({
	editor,
	viewMode,
	onSetViewMode,
	onLinkClick,
	onImageClick,
	onTableClick,
}: {
	editor: ReturnType<typeof useEditor>;
	viewMode: ViewMode;
	onSetViewMode: (mode: ViewMode) => void;
	onLinkClick: () => void;
	onImageClick: () => void;
	onTableClick: () => void;
}) {
	if (!editor) return null;

	return (
		<div className="toolbar">
			<div className="toolbar-scroll">
				<div className="toolbar-group">
					<ToolbarButton
						icon={<BoldIcon size={16} />}
						label="Bold (Ctrl+B)"
						onClick={() => editor.chain().focus().toggleBold().run()}
						active={editor.isActive("bold")}
					/>
					<ToolbarButton
						icon={<ItalicIcon size={16} />}
						label="Italic (Ctrl+I)"
						onClick={() => editor.chain().focus().toggleItalic().run()}
						active={editor.isActive("italic")}
					/>
					<ToolbarButton
						icon={<StrikethroughIcon size={16} />}
						label="Strikethrough"
						onClick={() => editor.chain().focus().toggleStrike().run()}
						active={editor.isActive("strike")}
					/>
					<ToolbarButton
						icon={<CodeIcon size={16} />}
						label="Inline Code"
						onClick={() => editor.chain().focus().toggleCode().run()}
						active={editor.isActive("code")}
					/>
				</div>

				<span className="divider" />

				<div className="toolbar-group">
					<ToolbarButton
						icon={<Heading1Icon size={16} />}
						label="Heading 1"
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 1 }).run()
						}
						active={editor.isActive("heading", { level: 1 })}
					/>
					<ToolbarButton
						icon={<Heading2Icon size={16} />}
						label="Heading 2"
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 2 }).run()
						}
						active={editor.isActive("heading", { level: 2 })}
					/>
					<ToolbarButton
						icon={<Heading3Icon size={16} />}
						label="Heading 3"
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 3 }).run()
						}
						active={editor.isActive("heading", { level: 3 })}
					/>
					<ToolbarButton
						icon={<Heading4Icon size={16} />}
						label="Heading 4"
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 4 }).run()
						}
						active={editor.isActive("heading", { level: 4 })}
					/>
					<ToolbarButton
						icon={<Heading5Icon size={16} />}
						label="Heading 5"
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 5 }).run()
						}
						active={editor.isActive("heading", { level: 5 })}
					/>
				</div>

				<span className="divider" />

				<div className="toolbar-group">
					<ToolbarButton
						icon={<ListIcon size={16} />}
						label="Bullet List"
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						active={editor.isActive("bulletList")}
					/>
					<ToolbarButton
						icon={<ListOrderedIcon size={16} />}
						label="Numbered List"
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						active={editor.isActive("orderedList")}
					/>
					<ToolbarButton
						icon={<ListTodoIcon size={16} />}
						label="Task List"
						onClick={() => editor.chain().focus().toggleTaskList().run()}
						active={editor.isActive("taskList")}
					/>
					<ToolbarButton
						icon={<QuoteIcon size={16} />}
						label="Quote"
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						active={editor.isActive("blockquote")}
					/>
					<ToolbarButton
						icon={<TerminalIcon size={16} />}
						label="Code Block"
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						active={editor.isActive("codeBlock")}
					/>
				</div>

				<span className="divider" />

				<div className="toolbar-group">
					<ToolbarButton
						icon={<LinkIcon size={16} />}
						label="Link"
						onClick={onLinkClick}
						active={editor.isActive("link")}
					/>
					<ToolbarButton
						icon={<ImageIcon size={16} />}
						label="Image"
						onClick={onImageClick}
					/>
					<ToolbarButton
						icon={<TableIcon size={16} />}
						label="Table"
						onClick={onTableClick}
						active={editor.isActive("table")}
					/>
				</div>
			</div>

			<div className="toolbar-spacer" />

			<div className="toolbar-group view-toggle">
				<ToolbarButton
					icon={<PenLineIcon size={16} />}
					label="Editor View"
					onClick={() => onSetViewMode("editor")}
					active={viewMode === "editor"}
				/>
				<ToolbarButton
					icon={<span className="md-icon">MD</span>}
					label="Markdown Source"
					onClick={() => onSetViewMode("source")}
					active={viewMode === "source"}
				/>
				<ToolbarButton
					icon={<Columns2Icon size={16} />}
					label="Split View"
					onClick={() => onSetViewMode("split")}
					active={viewMode === "split"}
				/>
			</div>
		</div>
	);
}
