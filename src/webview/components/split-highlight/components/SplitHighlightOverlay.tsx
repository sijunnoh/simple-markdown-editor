import React, { useMemo } from "react";

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

		const lines = text.split("\n");
		const parts: React.ReactNode[] = [];

		lines.forEach((line, index) => {
			const isHighlighted = index >= highlightLines.start && index <= highlightLines.end;

			if (isHighlighted) {
				parts.push(
					<span key={index} className="split-highlight-line">
						{line}
					</span>
				);
			} else {
				parts.push(<span key={index}>{line}</span>);
			}

			// Add newline (except after last line)
			if (index < lines.length - 1) {
				parts.push("\n");
			}
		});

		return <>{parts}</>;
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
