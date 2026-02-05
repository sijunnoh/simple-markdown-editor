import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { ViewMode, SearchMatch } from "../types";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

interface UseSearchOptions {
	editor: Editor | null;
	viewMode: ViewMode;
	markdown: string;
	setMarkdown: (md: string) => void;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	isTextareaFocused: React.MutableRefObject<boolean>;
}

// Escape special regex characters
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Plugin key for search decorations
const searchPluginKey = new PluginKey("search");

export function useSearch({
	editor,
	viewMode,
	markdown,
	setMarkdown,
	textareaRef,
	isTextareaFocused,
}: UseSearchOptions) {
	// Search state
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [replaceTerm, setReplaceTerm] = useState("");
	const [matches, setMatches] = useState<SearchMatch[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);

	// Track which pane to search in (use state so changes trigger re-search)
	const [searchTarget, setSearchTarget] = useState<"editor" | "textarea">("editor");

	// Trigger to focus search input (incremented when Cmd+F pressed while already open)
	const [focusTrigger, setFocusTrigger] = useState(0);

	// Determine if we should search in textarea or editor
	const getSearchInTextarea = useCallback(() => {
		if (viewMode === "source") return true;
		if (viewMode === "editor") return false;
		// In split view, use the current search target
		return searchTarget === "textarea";
	}, [viewMode, searchTarget]);

	// Find matches in textarea (source view)
	const findTextareaMatches = useCallback((term: string, text: string): SearchMatch[] => {
		if (!term) return [];
		const results: SearchMatch[] = [];
		const regex = new RegExp(escapeRegex(term), "gi");
		let match;
		while ((match = regex.exec(text)) !== null) {
			results.push({ from: match.index, to: match.index + match[0].length });
		}
		return results;
	}, []);

	// Find matches in TipTap editor
	const findEditorMatches = useCallback((term: string, editorInstance: Editor): SearchMatch[] => {
		if (!term || !editorInstance) return [];
		const results: SearchMatch[] = [];
		const regex = new RegExp(escapeRegex(term), "gi");

		editorInstance.state.doc.descendants((node, pos) => {
			if (node.isText && node.text) {
				let match;
				while ((match = regex.exec(node.text)) !== null) {
					results.push({
						from: pos + match.index,
						to: pos + match.index + match[0].length,
					});
				}
			}
		});

		return results;
	}, []);

	// Update matches when search term or target changes
	useEffect(() => {
		if (!searchTerm) {
			setMatches([]);
			setCurrentIndex(0);
			return;
		}

		let newMatches: SearchMatch[];
		if (getSearchInTextarea()) {
			newMatches = findTextareaMatches(searchTerm, markdown);
		} else if (editor && !editor.isDestroyed) {
			newMatches = findEditorMatches(searchTerm, editor);
		} else {
			newMatches = [];
		}

		setMatches(newMatches);
		setCurrentIndex(newMatches.length > 0 ? 0 : -1);
	}, [searchTerm, markdown, editor, viewMode, searchTarget, findTextareaMatches, findEditorMatches, getSearchInTextarea]);

	// Navigate to current match in textarea (without stealing focus)
	const navigateToTextareaMatch = useCallback((match: SearchMatch) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		// Scroll the match into view without focusing
		const textBeforeMatch = textarea.value.substring(0, match.from);
		const lines = textBeforeMatch.split("\n");
		const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
		const scrollTop = (lines.length - 1) * lineHeight - textarea.clientHeight / 2;
		textarea.scrollTop = Math.max(0, scrollTop);
	}, [textareaRef]);

	// Navigate to current match in editor
	const navigateToEditorMatch = useCallback(() => {
		if (!editor || editor.isDestroyed) return;

		// Wait for decoration to be applied, then scroll to the highlighted element
		requestAnimationFrame(() => {
			const highlightEl = editor.view.dom.querySelector(".search-highlight-current");
			if (highlightEl) {
				highlightEl.scrollIntoView({ block: "center", behavior: "instant" });
			}
		});
	}, [editor]);

	// Navigate to current match
	const navigateToMatch = useCallback((index: number) => {
		if (index < 0 || index >= matches.length) return;

		if (getSearchInTextarea()) {
			const match = matches[index];
			navigateToTextareaMatch(match);
		} else {
			navigateToEditorMatch();
		}
	}, [matches, getSearchInTextarea, navigateToTextareaMatch, navigateToEditorMatch]);

	// Go to next match
	const goToNext = useCallback(() => {
		if (matches.length === 0) return;
		const nextIndex = (currentIndex + 1) % matches.length;
		setCurrentIndex(nextIndex);
		navigateToMatch(nextIndex);
	}, [matches.length, currentIndex, navigateToMatch]);

	// Go to previous match
	const goToPrev = useCallback(() => {
		if (matches.length === 0) return;
		const prevIndex = (currentIndex - 1 + matches.length) % matches.length;
		setCurrentIndex(prevIndex);
		navigateToMatch(prevIndex);
	}, [matches.length, currentIndex, navigateToMatch]);

	// Replace current match in textarea
	const replaceInTextarea = useCallback((match: SearchMatch) => {
		const before = markdown.substring(0, match.from);
		const after = markdown.substring(match.to);
		const newMarkdown = before + replaceTerm + after;
		setMarkdown(newMarkdown);
	}, [markdown, replaceTerm, setMarkdown]);

	// Replace current match in editor
	const replaceInEditor = useCallback((match: SearchMatch) => {
		if (!editor || editor.isDestroyed) return;

		editor
			.chain()
			.focus()
			.setTextSelection({ from: match.from, to: match.to })
			.deleteSelection()
			.insertContent(replaceTerm)
			.run();
	}, [editor, replaceTerm]);

	// Replace current match
	const replace = useCallback(() => {
		if (currentIndex < 0 || currentIndex >= matches.length) return;

		const match = matches[currentIndex];
		if (getSearchInTextarea()) {
			replaceInTextarea(match);
		} else {
			replaceInEditor(match);
		}
	}, [currentIndex, matches, getSearchInTextarea, replaceInTextarea, replaceInEditor]);

	// Replace all matches
	const replaceAll = useCallback(() => {
		if (matches.length === 0 || !searchTerm) return;

		if (getSearchInTextarea()) {
			// Replace all in textarea (simple string replace)
			const regex = new RegExp(escapeRegex(searchTerm), "gi");
			const newMarkdown = markdown.replace(regex, replaceTerm);
			setMarkdown(newMarkdown);
		} else if (editor && !editor.isDestroyed) {
			// Replace all in editor (reverse order to preserve positions)
			const sortedMatches = [...matches].sort((a, b) => b.from - a.from);
			editor.chain().focus();
			for (const match of sortedMatches) {
				editor
					.chain()
					.setTextSelection({ from: match.from, to: match.to })
					.deleteSelection()
					.insertContent(replaceTerm)
					.run();
			}
		}
	}, [matches, searchTerm, replaceTerm, getSearchInTextarea, markdown, setMarkdown, editor]);

	// Open search panel (or focus if already open) - used by keyboard shortcut
	const openSearch = useCallback(() => {
		if (isOpen) {
			// Already open, just focus the search input
			setFocusTrigger((prev) => prev + 1);
			return;
		}

		// Capture which pane was focused before opening search
		if (viewMode === "split") {
			setSearchTarget(isTextareaFocused.current ? "textarea" : "editor");
		} else if (viewMode === "source") {
			setSearchTarget("textarea");
		} else {
			setSearchTarget("editor");
		}
		setIsOpen(true);
	}, [viewMode, isTextareaFocused, isOpen]);

	// Close search panel
	const closeSearch = useCallback(() => {
		setIsOpen(false);
		setSearchTerm("");
		setReplaceTerm("");
		setMatches([]);
		setCurrentIndex(0);
	}, []);

	// Toggle search panel - used by toolbar button
	const toggleSearch = useCallback(() => {
		if (isOpen) {
			closeSearch();
		} else {
			openSearch();
		}
	}, [isOpen, openSearch, closeSearch]);

	// Update search target when view mode changes (keep search term)
	useEffect(() => {
		if (!isOpen) return;

		if (viewMode === "source") {
			setSearchTarget("textarea");
		} else if (viewMode === "editor") {
			setSearchTarget("editor");
		}
		// For split view, keep current target until pane focus changes
	}, [isOpen, viewMode]);

	// Update search target when pane focus changes in split view
	useEffect(() => {
		if (!isOpen || viewMode !== "split") return;

		const handleTextareaFocus = () => {
			setSearchTarget("textarea");
		};

		const handleEditorFocus = () => {
			setSearchTarget("editor");
		};

		const textarea = textareaRef.current;
		const editorElement = editor?.view.dom;

		textarea?.addEventListener("focus", handleTextareaFocus);
		editorElement?.addEventListener("focus", handleEditorFocus);

		return () => {
			textarea?.removeEventListener("focus", handleTextareaFocus);
			editorElement?.removeEventListener("focus", handleEditorFocus);
		};
	}, [isOpen, viewMode, editor, textareaRef]);

	// Navigate to first match when opening search
	useEffect(() => {
		if (isOpen && matches.length > 0 && currentIndex >= 0) {
			navigateToMatch(currentIndex);
		}
	}, [isOpen, matches.length, currentIndex, navigateToMatch]);

	// Create ProseMirror plugin for search decorations
	const searchDecorations = useMemo(() => {
		if (!editor || getSearchInTextarea() || !searchTerm || matches.length === 0) {
			return null;
		}

		return new Plugin({
			key: searchPluginKey,
			props: {
				decorations: () => {
					const decorations: Decoration[] = matches.map((match, index) => {
						const className = index === currentIndex
							? "search-highlight search-highlight-current"
							: "search-highlight";
						return Decoration.inline(match.from, match.to, { class: className });
					});
					return DecorationSet.create(editor.state.doc, decorations);
				},
			},
		});
	}, [editor, viewMode, searchTerm, matches, currentIndex]);

	// Register/unregister the search decoration plugin
	useEffect(() => {
		if (!editor || editor.isDestroyed) return;

		// Remove existing search plugin if any
		const existingPlugin = editor.state.plugins.find(
			(p) => p.spec.key === searchPluginKey
		);

		if (searchDecorations) {
			if (existingPlugin) {
				// Update the plugin by removing and re-adding
				const plugins = editor.state.plugins.filter(
					(p) => p.spec.key !== searchPluginKey
				);
				const newState = editor.state.reconfigure({
					plugins: [...plugins, searchDecorations],
				});
				editor.view.updateState(newState);
			} else {
				// Add the plugin
				const newState = editor.state.reconfigure({
					plugins: [...editor.state.plugins, searchDecorations],
				});
				editor.view.updateState(newState);
			}
		} else if (existingPlugin) {
			// Remove the plugin
			const plugins = editor.state.plugins.filter(
				(p) => p.spec.key !== searchPluginKey
			);
			const newState = editor.state.reconfigure({ plugins });
			editor.view.updateState(newState);
		}
	}, [editor, searchDecorations]);

	// Clean up plugin on unmount or when search closes
	useEffect(() => {
		if (!isOpen && editor && !editor.isDestroyed) {
			const existingPlugin = editor.state.plugins.find(
				(p) => p.spec.key === searchPluginKey
			);
			if (existingPlugin) {
				const plugins = editor.state.plugins.filter(
					(p) => p.spec.key !== searchPluginKey
				);
				const newState = editor.state.reconfigure({ plugins });
				editor.view.updateState(newState);
			}
		}
	}, [isOpen, editor]);

	return {
		// State
		isOpen,
		searchTerm,
		replaceTerm,
		matches,
		currentIndex,
		searchTarget,
		focusTrigger,
		// Actions
		openSearch,
		toggleSearch,
		closeSearch,
		setSearchTerm,
		setReplaceTerm,
		goToNext,
		goToPrev,
		replace,
		replaceAll,
	};
}
