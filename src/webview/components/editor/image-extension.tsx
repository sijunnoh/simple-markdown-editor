import { useState, useRef, useCallback } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { PencilIcon, Trash2Icon } from "lucide-react";

// Image component for resizing
export function ImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
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
