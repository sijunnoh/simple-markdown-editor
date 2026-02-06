import { useEffect } from "react";
import { XIcon } from "lucide-react";

interface ModalProps {
	isOpen: boolean;
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}

export function Modal({ isOpen, title, onClose, children }: ModalProps) {
	// Handle ESC key to close modal
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				e.stopPropagation();
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

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
