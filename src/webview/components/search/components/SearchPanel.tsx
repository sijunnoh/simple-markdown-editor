import React, { useEffect, useRef } from "react";

interface SearchPanelProps {
	searchTerm: string;
	replaceTerm: string;
	currentIndex: number;
	totalMatches: number;
	focusTrigger: number;
	onSearchChange: (value: string) => void;
	onReplaceChange: (value: string) => void;
	onNext: () => void;
	onPrev: () => void;
	onReplace: () => void;
	onReplaceAll: () => void;
	onClose: () => void;
}

export function SearchPanel({
	searchTerm,
	replaceTerm,
	currentIndex,
	totalMatches,
	focusTrigger,
	onSearchChange,
	onReplaceChange,
	onNext,
	onPrev,
	onReplace,
	onReplaceAll,
	onClose,
}: SearchPanelProps) {
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Auto-focus search input when panel opens or when focusTrigger changes
	useEffect(() => {
		searchInputRef.current?.focus();
		searchInputRef.current?.select();
	}, [focusTrigger]);

	// Handle keyboard events in search input
	const handleSearchKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (e.shiftKey) {
				onPrev();
			} else {
				onNext();
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		} else if (e.key === "F3") {
			e.preventDefault();
			if (e.shiftKey) {
				onPrev();
			} else {
				onNext();
			}
		}
	};

	// Handle keyboard events in replace input
	const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			onReplace();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	};

	// Format match count display
	const matchCountText = totalMatches === 0
		? "No results"
		: `${currentIndex + 1}/${totalMatches}`;

	return (
		<div className="search-panel">
			<div className="search-section">
				<input
					ref={searchInputRef}
					type="text"
					className="search-input"
					placeholder="Search..."
					value={searchTerm}
					onChange={(e) => onSearchChange(e.target.value)}
					onKeyDown={handleSearchKeyDown}
				/>
				<button
					className="search-nav-btn"
					onClick={onPrev}
					disabled={totalMatches === 0}
					title="Previous (Shift+Enter)"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: "block" }}>
						<path d="M8 5l-4 4h8l-4-4z" />
					</svg>
				</button>
				<button
					className="search-nav-btn"
					onClick={onNext}
					disabled={totalMatches === 0}
					title="Next (Enter)"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: "block" }}>
						<path d="M8 11l4-4H4l4 4z" />
					</svg>
				</button>
				<span className="search-count">{matchCountText}</span>
			</div>

			<div className="search-divider" />

			<div className="search-section">
				<input
					type="text"
					className="search-input"
					placeholder="Replace..."
					value={replaceTerm}
					onChange={(e) => onReplaceChange(e.target.value)}
					onKeyDown={handleReplaceKeyDown}
				/>
				<button
					className="search-replace-btn"
					onClick={onReplace}
					disabled={totalMatches === 0}
					title="Replace"
				>
					Replace
				</button>
				<button
					className="search-replace-btn"
					onClick={onReplaceAll}
					disabled={totalMatches === 0}
					title="Replace All"
				>
					All
				</button>
			</div>

			<button
				className="search-close-btn"
				onClick={onClose}
				title="Close (Escape)"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
					<path d="M8 8.707l3.646 3.647.708-.708L8.707 8l3.647-3.646-.708-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z" />
				</svg>
			</button>
		</div>
	);
}
