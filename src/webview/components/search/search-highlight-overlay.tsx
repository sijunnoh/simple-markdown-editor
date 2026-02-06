import React, { useMemo } from "react";
import type { SearchMatch } from "../../types";

interface SearchHighlightOverlayProps {
	text: string;
	matches: SearchMatch[];
	currentIndex: number;
	scrollTop: number;
}

export function SearchHighlightOverlay({
	text,
	matches,
	currentIndex,
	scrollTop,
}: SearchHighlightOverlayProps) {
	// Build highlighted content
	const highlightedContent = useMemo(() => {
		if (matches.length === 0) {
			return <>{text}</>;
		}

		const parts: React.ReactNode[] = [];
		let lastIndex = 0;

		// Sort matches by position
		const sortedMatches = [...matches].sort((a, b) => a.from - b.from);

		sortedMatches.forEach((match, idx) => {
			// Add text before match
			if (match.from > lastIndex) {
				parts.push(
					<span key={`text-${lastIndex}`}>
						{text.substring(lastIndex, match.from)}
					</span>
				);
			}

			// Find the original index of this match to check if it's current
			const originalIndex = matches.findIndex(
				(m) => m.from === match.from && m.to === match.to
			);
			const isCurrent = originalIndex === currentIndex;

			// Add highlighted match
			parts.push(
				<mark
					key={`match-${idx}`}
					className={isCurrent ? "search-highlight search-highlight-current" : "search-highlight"}
				>
					{text.substring(match.from, match.to)}
				</mark>
			);

			lastIndex = match.to;
		});

		// Add remaining text
		if (lastIndex < text.length) {
			parts.push(
				<span key={`text-${lastIndex}`}>
					{text.substring(lastIndex)}
				</span>
			);
		}

		return <>{parts}</>;
	}, [text, matches, currentIndex]);

	return (
		<div
			className="search-highlight-overlay"
			style={{ transform: `translateY(-${scrollTop}px)` }}
		>
			{highlightedContent}
		</div>
	);
}
