export interface SearchMatch {
	from: number;
	to: number;
}

// Escape special regex characters
export function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Find all matches of a search term in text, returns positions
export function findTextMatches(term: string, text: string): SearchMatch[] {
	if (!term) return [];
	const results: SearchMatch[] = [];
	const regex = new RegExp(escapeRegex(term), "gi");
	let match;
	while ((match = regex.exec(text)) !== null) {
		results.push({ from: match.index, to: match.index + match[0].length });
	}
	return results;
}

// Replace a single match in text
export function replaceMatch(text: string, match: SearchMatch, replacement: string): string {
	return text.substring(0, match.from) + replacement + text.substring(match.to);
}

// Replace all occurrences of a search term in text
export function replaceAllMatches(text: string, term: string, replacement: string): string {
	if (!term) return text;
	const regex = new RegExp(escapeRegex(term), "gi");
	return text.replace(regex, replacement);
}
