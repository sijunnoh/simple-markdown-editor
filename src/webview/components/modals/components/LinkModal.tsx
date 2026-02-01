import type { Editor } from "@tiptap/react";
import { Modal } from "./Modal";

interface LinkModalProps {
	isOpen: boolean;
	onClose: () => void;
	linkUrl: string;
	setLinkUrl: (url: string) => void;
	linkText: string;
	setLinkText: (text: string) => void;
	onSubmit: () => void;
	onRemove: () => void;
	editor: Editor | null;
}

export function LinkModal({
	isOpen,
	onClose,
	linkUrl,
	setLinkUrl,
	linkText,
	setLinkText,
	onSubmit,
	onRemove,
	editor,
}: LinkModalProps) {
	return (
		<Modal isOpen={isOpen} title="Insert Link" onClose={onClose}>
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
						<button className="modal-btn-danger" onClick={onRemove}>
							Remove Link
						</button>
					)}
					<button className="modal-btn-secondary" onClick={onClose}>
						Cancel
					</button>
					<button className="modal-btn-primary" onClick={onSubmit}>
						{editor?.isActive("link") ? "Update" : "Insert"}
					</button>
				</div>
			</div>
		</Modal>
	);
}
