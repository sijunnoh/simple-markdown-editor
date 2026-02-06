import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useEffect, useRef } from "react";
import katex from "katex";

function renderKatex(latex: string, displayMode: boolean): string {
	try {
		return katex.renderToString(latex, {
			displayMode,
			throwOnError: false,
			output: "html",
		});
	} catch {
		return `<span class="math-error">${latex}</span>`;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MathInlineComponent({ node, updateAttributes }: any) {
	const [editing, setEditing] = useState(false);
	const [latex, setLatex] = useState<string>(node.attrs.latex || "");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editing && inputRef.current) {
			inputRef.current.focus();
		}
	}, [editing]);

	const handleDone = () => {
		updateAttributes({ latex });
		setEditing(false);
	};

	if (editing) {
		return (
			<NodeViewWrapper as="span" className="math-inline-wrapper" contentEditable={false}>
				<input
					ref={inputRef}
					className="math-inline-input"
					value={latex}
					onChange={(e) => setLatex(e.target.value)}
					onBlur={handleDone}
					onKeyDown={(e) => { if (e.key === "Enter") handleDone(); }}
					spellCheck={false}
				/>
			</NodeViewWrapper>
		);
	}

	return (
		<NodeViewWrapper as="span" className="math-inline-wrapper" contentEditable={false}>
			<span
				className="math-inline-rendered"
				onClick={() => { setLatex(node.attrs.latex || ""); setEditing(true); }}
				dangerouslySetInnerHTML={{ __html: renderKatex(node.attrs.latex || "", false) }}
			/>
		</NodeViewWrapper>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MathBlockComponent({ node, updateAttributes }: any) {
	const [editing, setEditing] = useState(false);
	const [latex, setLatex] = useState<string>(node.attrs.latex || "");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (editing && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [editing]);

	const handleDone = () => {
		updateAttributes({ latex });
		setEditing(false);
	};

	return (
		<NodeViewWrapper className="math-block-wrapper" contentEditable={false}>
			<div
				className="math-block-rendered"
				onClick={() => { setLatex(node.attrs.latex || ""); setEditing(true); }}
				dangerouslySetInnerHTML={{ __html: renderKatex(node.attrs.latex || "", true) }}
			/>
			{editing && (
				<textarea
					ref={textareaRef}
					className="math-block-input"
					value={latex}
					onChange={(e) => setLatex(e.target.value)}
					onBlur={handleDone}
					onKeyDown={(e) => {
						if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleDone();
					}}
					spellCheck={false}
					rows={Math.max(2, latex.split("\n").length)}
				/>
			)}
		</NodeViewWrapper>
	);
}

export const MathInline = Node.create({
	name: "mathInline",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			latex: { default: "" },
		};
	},

	parseHTML() {
		return [
			{
				tag: "span.math-inline",
				getAttrs(node) {
					return { latex: (node as HTMLElement).getAttribute("data-latex") || "" };
				},
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"span",
			mergeAttributes({ class: "math-inline", "data-latex": HTMLAttributes.latex }),
			HTMLAttributes.latex,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(MathInlineComponent);
	},
});

export const MathBlock = Node.create({
	name: "mathBlock",
	group: "block",
	atom: true,
	defining: true,

	addAttributes() {
		return {
			latex: { default: "" },
		};
	},

	parseHTML() {
		return [
			{
				tag: "div.math-block",
				getAttrs(node) {
					return { latex: (node as HTMLElement).getAttribute("data-latex") || "" };
				},
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"div",
			mergeAttributes({ class: "math-block", "data-latex": HTMLAttributes.latex }),
			HTMLAttributes.latex,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(MathBlockComponent);
	},
});
