import { useMemo } from "react";

interface SplitHighlightOverlayProps {
	text: string;
	highlightLines: { start: number; end: number } | null;
	scrollTop: number;
	scrollbarWidth?: number;
}

/**
 * Overlay component that highlights specific lines in the source textarea
 */
export function SplitHighlightOverlay({
	text,
	highlightLines,
	scrollTop,
	scrollbarWidth = 0,
}: SplitHighlightOverlayProps) {
	const highlightedContent = useMemo(() => {
		if (!highlightLines) {
			return <>{text}</>;
		}

		// Split into 3 sections instead of N per-line nodes
		const lines = text.split("\n");
		const before = lines.slice(0, highlightLines.start).join("\n");
		const highlighted = lines.slice(highlightLines.start, highlightLines.end + 1).join("\n");
		const after = lines.slice(highlightLines.end + 1).join("\n");

		return (
			<>
				{before.length > 0 && <>{before}{"\n"}</>}
				<span className="split-highlight-line">{highlighted}</span>
				{after.length > 0 && <>{"\n"}{after}</>}
			</>
		);
	}, [text, highlightLines]);

	if (!highlightLines) {
		return null;
	}

	return (
		<div
			className="split-highlight-overlay"
			style={{
				transform: `translateY(-${scrollTop}px)`,
				right: `${scrollbarWidth}px`,
			}}
		>
			{highlightedContent}
		</div>
	);
}
