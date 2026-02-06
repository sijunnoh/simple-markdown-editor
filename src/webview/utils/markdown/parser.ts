import { marked } from "marked";
import { transformImagePaths } from "../image-paths";
import { frontmatterExtension } from "./frontmatter-marked-extension";
import { mathExtension } from "./math-marked-extension";

// Configure marked
marked.setOptions({
	gfm: true,
	breaks: false,
});

// Register extensions
marked.use(frontmatterExtension);
marked.use(mathExtension);

/**
 * Transform marked's task list HTML to TipTap's expected format.
 * marked: <li><input type="checkbox" checked> Task</li>
 * TipTap: <li data-type="taskItem" data-checked="true"><p>Task</p></li>
 */
function transformTaskListHtml(html: string): string {
	// Match ul containing task list items (li with checkbox as first element)
	// Use a simple regex approach to detect and transform task lists

	// First, find all <ul> blocks that contain task items
	return html.replace(/<ul>([\s\S]*?)<\/ul>/g, (match, content) => {
		// Check if this ul contains task list items (li starting with checkbox)
		if (/<li><input [^>]*type="checkbox"[^>]*>/.test(content)) {
			// Transform the ul to taskList
			const transformedContent = content.replace(
				/<li><input ([^>]*)type="checkbox"([^>]*)>\s*([\s\S]*?)<\/li>/g,
				(_m: string, before: string, after: string, text: string) => {
					const isChecked = before.includes("checked") || after.includes("checked");
					const cleanText = text.trim();
					return `<li data-type="taskItem" data-checked="${isChecked}"><p>${cleanText}</p></li>`;
				}
			);
			return `<ul data-type="taskList">${transformedContent}</ul>`;
		}
		return match;
	});
}

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
	let html = marked.parse(transformedMd, { async: false }) as string;

	// Transform task list HTML to TipTap format
	html = transformTaskListHtml(html);

	return html;
}
