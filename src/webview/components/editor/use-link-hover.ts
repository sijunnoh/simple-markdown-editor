import { useState, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import type { LinkHoverState, ModalType } from "../../types";

interface UseLinkHoverOptions {
	editor: Editor | null;
	setLinkUrl: (url: string) => void;
	setLinkText: (text: string) => void;
	setModalType: (type: ModalType) => void;
	vscode: { postMessage: (message: unknown) => void };
}

export function useLinkHover({
	editor,
	setLinkUrl,
	setLinkText,
	setModalType,
	vscode,
}: UseLinkHoverOptions) {
	const [linkHover, setLinkHover] = useState<LinkHoverState>({
		visible: false,
		url: "",
		text: "",
		position: { x: 0, y: 0 },
		linkElement: null,
	});
	const linkHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

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

	const handleEditorMouseLeave = useCallback((e: React.MouseEvent) => {
		const relatedTarget = e.relatedTarget;

		// Check if moving to the popup itself
		if (
			relatedTarget instanceof HTMLElement &&
			relatedTarget.closest(".link-hover-popup")
		) {
			return;
		}

		// Delay hiding for link hover
		linkHoverTimeoutRef.current = setTimeout(() => {
			setLinkHover((prev) => ({ ...prev, visible: false }));
		}, 150);
	}, []);

	const handlePopupMouseEnter = useCallback(() => {
		if (linkHoverTimeoutRef.current) {
			clearTimeout(linkHoverTimeoutRef.current);
			linkHoverTimeoutRef.current = null;
		}
	}, []);

	const handlePopupMouseLeave = useCallback(() => {
		setLinkHover((prev) => ({ ...prev, visible: false }));
	}, []);

	const handleOpenLink = useCallback(() => {
		if (linkHover.url) {
			vscode.postMessage({ type: "openLink", url: linkHover.url });
		}
		setLinkHover((prev) => ({ ...prev, visible: false }));
	}, [linkHover.url, vscode]);

	const handleEditLinkFromHover = useCallback(() => {
		if (!editor || !linkHover.linkElement) {
			return;
		}

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
	}, [editor, linkHover, setLinkUrl, setLinkText, setModalType]);

	return {
		linkHover,
		handleEditorMouseOver,
		handleEditorMouseLeave,
		handlePopupMouseEnter,
		handlePopupMouseLeave,
		handleOpenLink,
		handleEditLinkFromHover,
	};
}
