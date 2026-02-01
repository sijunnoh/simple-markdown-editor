import { ImageIcon, LinkIcon } from "lucide-react";
import type { Suggestion } from "../../../types";

interface SuggestionsMenuProps {
	suggestions: Suggestion[];
	selectedIndex: number;
	position: { x: number; y: number };
	onSelect: (s: Suggestion) => void;
}

export function SuggestionsMenu({
	suggestions,
	selectedIndex,
	position,
	onSelect,
}: SuggestionsMenuProps) {
	return (
		<div
			className="suggestions-menu"
			style={{
				position: "fixed",
				left: position.x,
				top: position.y,
				zIndex: 200,
			}}
		>
			{suggestions.map((s, i) => (
				<div
					key={s.path}
					className={`suggestion-item ${i === selectedIndex ? "active" : ""}`}
					onClick={() => onSelect(s)}
				>
					<span className="suggestion-icon">
						{s.type === "image" ? (
							<ImageIcon size={14} />
						) : (
							<LinkIcon size={14} />
						)}
					</span>
					<span className="suggestion-label">{s.label}</span>
				</div>
			))}
		</div>
	);
}
