import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import type { LinkHoverState } from "../../../types";

interface LinkHoverPopupProps {
	linkHover: LinkHoverState;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
	onOpenLink: () => void;
	onEditLink: () => void;
}

export function LinkHoverPopup({
	linkHover,
	onMouseEnter,
	onMouseLeave,
	onOpenLink,
	onEditLink,
}: LinkHoverPopupProps) {
	if (!linkHover.visible) return null;

	return (
		<div
			className="link-hover-popup"
			style={{
				position: "fixed",
				left: linkHover.position.x,
				top: linkHover.position.y,
			}}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<span className="link-hover-url" title={linkHover.url}>
				{linkHover.url.length > 40
					? linkHover.url.slice(0, 40) + "..."
					: linkHover.url}
			</span>
			<button
				className="link-hover-btn"
				onClick={onOpenLink}
				title="Open link"
			>
				<ExternalLinkIcon size={14} />
			</button>
			<button
				className="link-hover-btn"
				onClick={onEditLink}
				title="Edit link"
			>
				<PencilIcon size={14} />
			</button>
		</div>
	);
}
