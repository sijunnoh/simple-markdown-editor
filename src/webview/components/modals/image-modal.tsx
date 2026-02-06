import { Modal } from "./Modal";

interface ImageModalProps {
	isOpen: boolean;
	onClose: () => void;
	imageUrl: string;
	setImageUrl: (url: string) => void;
	imageAlt: string;
	setImageAlt: (alt: string) => void;
	onSubmit: () => void;
}

export function ImageModal({
	isOpen,
	onClose,
	imageUrl,
	setImageUrl,
	imageAlt,
	setImageAlt,
	onSubmit,
}: ImageModalProps) {
	return (
		<Modal isOpen={isOpen} title="Insert Image" onClose={onClose}>
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
					<button className="modal-btn-secondary" onClick={onClose}>
						Cancel
					</button>
					<button className="modal-btn-primary" onClick={onSubmit}>
						Insert
					</button>
				</div>
			</div>
		</Modal>
	);
}
