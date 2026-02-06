import { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { ModalType } from "../types";
import { toWebviewUri } from "../utils/image-paths";

/** Clamp table dimensions to valid range */
export function clampTableDimensions(rows: string, cols: string): { rows: number; cols: number } {
	return {
		rows: Math.max(1, Math.min(parseInt(rows, 10) || 3, 20)),
		cols: Math.max(1, Math.min(parseInt(cols, 10) || 3, 10)),
	};
}

/** Default modal state values */
export const MODAL_DEFAULTS = {
	linkUrl: "",
	linkText: "",
	imageUrl: "",
	imageAlt: "",
	tableRows: "3",
	tableCols: "3",
} as const;

interface UseModalsOptions {
	editor: Editor | null;
	baseUriRef: React.MutableRefObject<string>;
	vscode: { postMessage: (message: unknown) => void };
}

export function useModals({ editor, baseUriRef, vscode }: UseModalsOptions) {
	// Modal state
	const [modalType, setModalType] = useState<ModalType>(null);
	const [linkUrl, setLinkUrl] = useState<string>("");
	const [linkText, setLinkText] = useState<string>("");
	const [imageUrl, setImageUrl] = useState<string>("");
	const [imageAlt, setImageAlt] = useState<string>("");
	const [tableRows, setTableRows] = useState<string>("3");
	const [tableCols, setTableCols] = useState<string>("3");

	// Listen for image modal open event (from ImageExtension edit button)
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
	}, [vscode]);

	const handleImageSubmit = useCallback(() => {
		if (!editor || !imageUrl) {
			return;
		}
		const src = toWebviewUri(imageUrl, baseUriRef.current);
		if (editor.isActive("image")) {
			editor.chain().focus().updateAttributes("image", { src, alt: imageAlt || "" }).run();
		} else {
			editor.chain().focus().setImage({ src, alt: imageAlt || "" }).run();
		}
		setModalType(null);
		setImageUrl("");
		setImageAlt("");
	}, [editor, imageUrl, imageAlt, baseUriRef]);

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
		const { rows, cols } = clampTableDimensions(tableRows, tableCols);
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

	return {
		modalType,
		setModalType,
		linkUrl,
		setLinkUrl,
		linkText,
		setLinkText,
		imageUrl,
		setImageUrl,
		imageAlt,
		setImageAlt,
		tableRows,
		setTableRows,
		tableCols,
		setTableCols,
		openLinkModal,
		handleLinkSubmit,
		handleRemoveLink,
		openImagePicker,
		handleImageSubmit,
		openTableModal,
		handleTableSubmit,
		closeModal,
	};
}
