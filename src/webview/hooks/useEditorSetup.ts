import { useMemo } from "react";
import { useEditor, ReactNodeViewRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
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
import {
	CodeBlockComponent,
	ImageComponent,
	lastSelectedLanguage,
} from "../components/editor";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

export function useEditorSetup(): Editor | null {
	const extensions = useMemo(
		() => [
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
		[],
	);

	const editor = useEditor({
		extensions,
		content: "",
	});

	return editor;
}
