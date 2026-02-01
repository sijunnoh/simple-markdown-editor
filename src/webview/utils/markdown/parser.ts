import { marked } from "marked";
import { transformImagePaths } from "../imagePaths";

// Configure marked
marked.setOptions({
	gfm: true,
	breaks: false,
});

/**
 * Parse markdown string to HTML, transforming image paths for webview display.
 *
 * @param markdown - Markdown string to parse
 * @param baseUri - Base webview URI for the document directory
 * @returns HTML string with transformed image paths
 */
export function parseMarkdown(markdown: string, baseUri: string): string {
	// First transform image paths in the markdown
	const transformedMd = transformImagePaths(markdown, baseUri);

	// Parse markdown to HTML
	const html = marked.parse(transformedMd, { async: false }) as string;

	return html;
}
