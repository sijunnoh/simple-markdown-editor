/**
 * Image path transformation utilities for converting between
 * relative paths and VS Code webview URIs.
 */

/**
 * Transform relative image paths to webview URIs.
 * Handles both markdown syntax ![alt](path) and HTML <img> tags.
 *
 * @param content - Content string (markdown or HTML) containing image references
 * @param baseUri - Base webview URI for the document directory
 * @returns Content with transformed image paths
 */
export function transformImagePaths(content: string, baseUri: string): string {
	if (!baseUri) {
		return content;
	}

	let processed = content;

	// Transform markdown image syntax: ![alt](./path) or ![alt](path)
	// Don't transform absolute URLs (http/https/data)
	processed = processed.replace(
		/!\[([^\]]*)\]\((?!https?:|data:|vscode-webview-resource:)([^)]+)\)/g,
		(_match, alt, src) => {
			// Remove leading ./ if present
			const cleanSrc = src.replace(/^\.\//, "");
			const absoluteSrc = `${baseUri}/${cleanSrc}`;
			return `![${alt}](${absoluteSrc})`;
		},
	);

	// Transform HTML img src to absolute webview URIs
	// Match src="./path" or src="path" (not starting with http/https/data)
	processed = processed.replace(
		/(<img[^>]*\ssrc=["'])(?!https?:|data:|vscode-webview-resource:)([^"']+)(["'][^>]*>)/gi,
		(_match, prefix, src, suffix) => {
			// Remove leading ./ if present
			const cleanSrc = src.replace(/^\.\//, "");
			const absoluteSrc = `${baseUri}/${cleanSrc}`;
			return `${prefix}${absoluteSrc}${suffix}`;
		},
	);

	return processed;
}

/**
 * Transform webview URIs back to relative paths in markdown.
 * Converts full webview URIs back to "./path" format for saving.
 * Also cleans up HTML entities like &nbsp; in table cells.
 *
 * @param markdown - Markdown string containing image references
 * @param baseUri - Base webview URI to strip from paths
 * @returns Markdown with relative image paths and cleaned content
 */
export function untransformImagePaths(
	markdown: string,
	baseUri: string,
): string {
	let processed = markdown;

	// Clean up &nbsp; in table cells - replace with empty space
	// Match table cell separators with &nbsp; and replace with just space
	processed = processed.replace(/\|\s*&nbsp;\s*\|/g, "|  |");
	processed = processed.replace(/\|\s*&nbsp;\s*$/gm, "|  ");
	processed = processed.replace(/^\s*&nbsp;\s*\|/gm, "  |");
	// Also handle standalone &nbsp; that might appear elsewhere
	processed = processed.replace(/&nbsp;/g, " ");

	if (!baseUri) {
		return processed;
	}

	// Escape special regex characters in baseUri
	const escapedBaseUri = baseUri.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	// Match the baseUri pattern and replace with relative path for standard markdown images
	const mdRegex = new RegExp(
		`!\\[([^\\]]*)\\]\\(${escapedBaseUri}/([^)]+)\\)`,
		"g",
	);
	processed = processed.replace(mdRegex, "![$1](./$2)");

	// Match the baseUri pattern and replace with relative path for HTML img tags
	const htmlRegex = new RegExp(
		`(<img[^>]*\\ssrc=["'])${escapedBaseUri}/([^"']+)(["'][^>]*>)`,
		"gi",
	);
	processed = processed.replace(htmlRegex, "$1./$2$3");

	return processed;
}

/**
 * Convert a relative path to a webview URI.
 * Handles URL encoding for special characters in path segments.
 *
 * @param path - Relative path (e.g., "./images/photo.png")
 * @param baseUri - Base webview URI for the document directory
 * @returns Full webview URI or original path if already absolute
 */
export function toWebviewUri(path: string, baseUri: string): string {
	if (!baseUri || path.startsWith("http") || path.startsWith("data:")) {
		return path;
	}
	// Remove leading ./ if present
	const cleanPath = path.replace(/^\.\//, "");
	// Encode path segments to handle spaces and special characters.
	// Decode first to prevent double-encoding (e.g., %20 → %2520).
	const encodedPath = cleanPath
		.split("/")
		.map((segment) => encodeURIComponent(decodeURIComponent(segment)))
		.join("/");
	return `${baseUri}/${encodedPath}`;
}
