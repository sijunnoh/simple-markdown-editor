import type { Editor } from "@tiptap/react";
import type { ViewMode } from "../../../types";
import { ToolbarButton } from "./ToolbarButton";
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
	TerminalIcon,
	PenLineIcon,
	Columns2Icon,
	ImageIcon,
	LinkIcon,
	TableIcon,
} from "lucide-react";

interface ToolbarProps {
	editor: Editor | null;
	viewMode: ViewMode;
	onSetViewMode: (mode: ViewMode) => void;
	onLinkClick: () => void;
	onImageClick: () => void;
	onTableClick: () => void;
}

export function Toolbar({
	editor,
	viewMode,
	onSetViewMode,
	onLinkClick,
	onImageClick,
	onTableClick,
}: ToolbarProps) {
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
