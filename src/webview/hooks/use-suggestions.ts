import { useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import type { ViewMode, Suggestion } from "../types";
import { toWebviewUri } from "../utils/image-paths";

interface UseSuggestionsOptions {
	editor: Editor | null;
	viewMode: ViewMode;
	baseUriRef: React.MutableRefObject<string>;
	vscode: { postMessage: (message: unknown) => void };
}

export function useSuggestions({
	editor,
	viewMode,
	baseUriRef,
	vscode,
}: UseSuggestionsOptions) {
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [suggestionVisible, setSuggestionVisible] = useState(false);
	const [suggestionPos, setSuggestionPos] = useState({ x: 0, y: 0 });
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Check for suggestions based on editor state
	const checkForSuggestions = useCallback(
		(editorInstance: Editor) => {
			const { state } = editorInstance;
			const { selection } = state;
			const { $from } = selection;
			const textBefore = $from.parent.textBetween(
				Math.max(0, $from.parentOffset - 20),
				$from.parentOffset,
				null,
				"\0",
			);

			const match = /[\/\[]([^\/\[\s]*)$/.exec(textBefore);
			if (match && viewMode !== "source") {
				const query = match[1];
				const coords = editorInstance.view.coordsAtPos($from.pos);
				setSuggestionPos({ x: coords.left, y: coords.bottom + 5 });
				vscode.postMessage({ type: "getSuggestions", query });
			} else {
				setSuggestionVisible(false);
			}
		},
		[viewMode, vscode],
	);

	// Handle keyboard navigation in suggestions
	const handleSuggestionKeyDown = useCallback(
		(event: KeyboardEvent): boolean => {
			if (!suggestionVisible) return false;

			if (event.key === "ArrowDown") {
				event.preventDefault();
				setSelectedIndex((prev) => (prev + 1) % suggestions.length);
				return true;
			}
			if (event.key === "ArrowUp") {
				event.preventDefault();
				setSelectedIndex(
					(prev) => (prev - 1 + suggestions.length) % suggestions.length,
				);
				return true;
			}
			if (event.key === "Enter" || event.key === "Tab") {
				event.preventDefault();
				if (suggestions[selectedIndex]) {
					handleSelectSuggestion(suggestions[selectedIndex]);
				}
				return true;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				setSuggestionVisible(false);
				return true;
			}

			return false;
		},
		[suggestionVisible, suggestions, selectedIndex],
	);

	// Handle suggestion selection
	const handleSelectSuggestion = useCallback(
		(suggestion: Suggestion) => {
			if (!editor) return;

			const { state } = editor;
			const { selection } = state;
			const { $from } = selection;
			const textBefore = $from.parent.textBetween(
				Math.max(0, $from.parentOffset - 20),
				$from.parentOffset,
				null,
				"\0",
			);
			const match = /[\/\[]([^\/\[\s]*)$/.exec(textBefore);

			if (match) {
				const start = $from.pos - match[0].length;
				let content = "";
				if (suggestion.type === "image") {
					const src = toWebviewUri(suggestion.path, baseUriRef.current);
					content = `<img src="${src}" alt="">`;
				} else {
					content = `<a href="${suggestion.path}">${suggestion.label}</a>`;
				}

				editor
					.chain()
					.focus()
					.deleteRange({ from: start, to: $from.pos })
					.insertContent(content)
					.run();
			}

			setSuggestionVisible(false);
		},
		[editor, baseUriRef],
	);

	return {
		// State
		suggestions,
		suggestionVisible,
		suggestionPos,
		selectedIndex,
		// Setters
		setSuggestions,
		setSuggestionVisible,
		setSelectedIndex,
		// Handlers
		checkForSuggestions,
		handleSuggestionKeyDown,
		handleSelectSuggestion,
	};
}
