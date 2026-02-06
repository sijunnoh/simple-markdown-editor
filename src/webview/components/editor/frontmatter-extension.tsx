import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FrontmatterComponent({ node, updateAttributes }: any) {
	const [collapsed, setCollapsed] = useState(false);
	const content: string = node.attrs.content || "";

	return (
		<NodeViewWrapper className="frontmatter-block" contentEditable={false}>
			<div className="frontmatter-header" onClick={() => setCollapsed(!collapsed)}>
				<span className="frontmatter-toggle">{collapsed ? "\u25b6" : "\u25bc"}</span>
				<span className="frontmatter-label">Frontmatter</span>
			</div>
			{!collapsed && (
				<textarea
					className="frontmatter-textarea"
					value={content}
					onChange={(e) => updateAttributes({ content: e.target.value })}
					spellCheck={false}
					rows={Math.max(2, content.split("\n").length)}
				/>
			)}
		</NodeViewWrapper>
	);
}

export const Frontmatter = Node.create({
	name: "frontmatter",
	group: "block",
	atom: true,
	defining: true,

	addAttributes() {
		return {
			content: { default: "" },
		};
	},

	parseHTML() {
		return [
			{
				tag: "div.frontmatter-block",
				getAttrs(node) {
					const el = node as HTMLElement;
					const content = (el.getAttribute("data-content") || "")
						.replace(/&amp;/g, "&")
						.replace(/&lt;/g, "<")
						.replace(/&gt;/g, ">")
						.replace(/&quot;/g, '"');
					return { content };
				},
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		const escaped = (HTMLAttributes.content || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
		return [
			"div",
			mergeAttributes({ class: "frontmatter-block", "data-content": escaped }),
			["pre", {}, escaped],
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(FrontmatterComponent);
	},
});
