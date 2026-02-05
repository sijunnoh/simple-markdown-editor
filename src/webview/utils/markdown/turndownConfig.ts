import TurndownService from "turndown";
import type { EditorSettings } from "../../types";

export const turndown = new TurndownService({
	headingStyle: "atx",
	hr: "---",
	bulletListMarker: "-",
	codeBlockStyle: "fenced",
	emDelimiter: "*",
});

// Get indentation string based on setting
function getIndentString(style: EditorSettings["indentationStyle"]): string {
	switch (style) {
		case "tabs":
			return "\t";
		case "4spaces":
			return "    ";
		case "2spaces":
		default:
			return "  ";
	}
}

// Current indentation string (updated when settings change)
let currentIndent = "  ";

// Update turndown options based on editor settings
export function updateTurndownOptions(settings: EditorSettings) {
	turndown.options.emDelimiter = settings.emDelimiter;
	currentIndent = getIndentString(settings.indentationStyle);
	// strongDelimiter is not a direct option, we need a custom rule
	turndown.addRule("strong", {
		filter: ["strong", "b"],
		replacement: (content) => {
			return settings.strongDelimiter + content + settings.strongDelimiter;
		},
	});
}

// Override default list item rule to use single space after marker
turndown.addRule("listItem", {
	filter: "li",
	replacement: (content, node, options) => {
		content = content
			.replace(/^\n+/, "")
			.replace(/\n+$/, "\n")
			.replace(/\n/gm, "\n" + currentIndent);

		const parent = node.parentNode as HTMLElement;
		const isOrdered = parent?.nodeName === "OL";
		let prefix = options.bulletListMarker + " ";

		if (isOrdered) {
			const start = parent?.getAttribute("start");
			const index = Array.from(parent.children).indexOf(node as HTMLElement);
			const num = start ? Number(start) + index : index + 1;
			prefix = num + ". ";
		}

		return prefix + content + "\n";
	},
});

// Preserve paragraphs with proper spacing (but not inside list items)
turndown.addRule("preserveParagraphs", {
	filter: "p",
	replacement: (content, node) => {
		// Don't add extra newlines for paragraphs inside list items
		const parent = node.parentNode;
		if (parent && (parent.nodeName === "LI" || (parent as Element).getAttribute?.("data-type") === "taskItem")) {
			return content;
		}
		return content + "\n\n";
	},
});

// Task list item rule (TipTap format with data-type attribute)
turndown.addRule("taskListItem", {
	filter: (node) => {
		return (
			node.nodeName === "LI" &&
			node.getAttribute("data-type") === "taskItem"
		);
	},
	replacement: (content, node) => {
		const element = node as HTMLElement;
		// TipTap uses data-checked attribute on the li element
		const dataChecked = element.getAttribute("data-checked");
		// Also check for checkbox input as fallback
		const checkbox = element.querySelector('input[type="checkbox"]');
		const isChecked = dataChecked === "true" || checkbox?.hasAttribute("checked");
		const checked = isChecked ? "x" : " ";
		const cleanContent = content.replace(/^\s*\[.\]\s*/, "").trim();
		return `- [${checked}] ${cleanContent}\n`;
	},
});

// Task list item rule (marked/GFM format - li containing checkbox as first element)
turndown.addRule("taskListItemGfm", {
	filter: (node) => {
		if (node.nodeName !== "LI") return false;
		// Check if first child (or first element child) is a checkbox
		const firstChild = node.firstChild;
		const firstElement = node.firstElementChild;
		const checkbox = (firstChild?.nodeName === "INPUT" && (firstChild as HTMLInputElement).type === "checkbox") ||
			(firstElement?.nodeName === "INPUT" && (firstElement as HTMLInputElement).type === "checkbox");
		return checkbox;
	},
	replacement: (_content, node) => {
		const element = node as HTMLElement;
		const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
		const isChecked = checkbox?.checked || checkbox?.hasAttribute("checked");
		const checked = isChecked ? "x" : " ";
		// Get text content excluding the checkbox
		let textContent = "";
		element.childNodes.forEach((child) => {
			if (child.nodeName !== "INPUT") {
				textContent += child.textContent || "";
			}
		});
		return `- [${checked}] ${textContent.trim()}\n`;
	},
});

// Task list rule
turndown.addRule("taskList", {
	filter: (node) => {
		return (
			node.nodeName === "UL" &&
			node.getAttribute("data-type") === "taskList"
		);
	},
	replacement: (content) => {
		return content + "\n";
	},
});

// Image rule (block-level: TipTap uses inline: false)
turndown.addRule("blockImage", {
	filter: "img",
	replacement: (_content, node) => {
		const src = (node as HTMLElement).getAttribute("src") || "";
		const alt = (node as HTMLElement).getAttribute("alt") || "";
		const width = (node as HTMLElement).getAttribute("width");
		if (width) {
			return `\n\n<img src="${src}" alt="${alt}" width="${width}">\n\n`;
		}
		return `\n\n![${alt}](${src})\n\n`;
	},
});

// Code block wrapper (for language selector)
turndown.addRule("codeBlockWrapper", {
	filter: (node) => {
		return (
			node.nodeName === "DIV" &&
			node.classList.contains("code-block-wrapper")
		);
	},
	replacement: (content, node) => {
		const pre = (node as HTMLElement).querySelector("pre");
		if (pre) {
			const code = pre.querySelector("code");
			if (code) {
				const language = code.className.match(/language-(\w+)/)?.[1] || "";
				const codeContent = code.textContent || "";
				return `\n\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
			}
		}
		return content;
	},
});

// Code block rule
turndown.addRule("codeBlock", {
	filter: (node) => {
		return (
			node.nodeName === "PRE" &&
			node.firstChild?.nodeName === "CODE"
		);
	},
	replacement: (_content, node) => {
		const code = (node as HTMLElement).querySelector("code");
		if (code) {
			const language = code.className.match(/language-(\w+)/)?.[1] || "";
			const codeContent = code.textContent || "";
			return `\n\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
		}
		return _content;
	},
});

// Helper turndown instance for converting cell content (without table rule to avoid recursion)
const cellTurndown = new TurndownService({
	headingStyle: "atx",
	hr: "---",
	bulletListMarker: "-",
	codeBlockStyle: "fenced",
	emDelimiter: "*",
});

// Add strikethrough rule to cellTurndown (turndown doesn't have it by default)
cellTurndown.addRule("strikethrough", {
	filter: ["del", "s"],
	replacement: (content) => {
		return "~~" + content + "~~";
	},
});

// Convert cell HTML to markdown, preserving inline formatting
function convertCellContent(cell: Element): string {
	const html = cell.innerHTML;
	if (!html || html === "<p></p>" || html === "<br>") {
		return "";
	}
	// Convert HTML to markdown, remove newlines (table cells should be single line)
	let md = cellTurndown.turndown(html);
	// Replace newlines with spaces for table cell content
	md = md.replace(/\n+/g, " ").trim();
	return md;
}

// Table rule
turndown.addRule("table", {
	filter: "table",
	replacement: (_content, node) => {
		const table = node as HTMLTableElement;
		const rows: string[][] = [];

		// Get all rows from the table (handles both thead/tbody and TipTap's tbody-only structure)
		// Use Array.from for compatibility with test environments
		const allRows = Array.from(table.querySelectorAll("tr"));

		allRows.forEach((tr) => {
			const row: string[] = [];
			Array.from(tr.querySelectorAll("td, th")).forEach((cell) => {
				// Convert cell HTML to markdown to preserve formatting
				row.push(convertCellContent(cell));
			});
			if (row.length > 0) {
				rows.push(row);
			}
		});

		if (rows.length === 0) {
			return "";
		}

		// Calculate column widths
		const colCount = Math.max(...rows.map((r) => r.length));
		const colWidths = Array(colCount).fill(3);

		rows.forEach((row) => {
			row.forEach((cell, i) => {
				colWidths[i] = Math.max(colWidths[i], cell.length);
			});
		});

		// Build markdown table
		let md = "\n";

		// Header row (first row is always header in markdown tables)
		const header = rows[0] || [];
		md +=
			"| " +
			header
				.map((cell, i) => cell.padEnd(colWidths[i]))
				.join(" | ") +
			" |\n";

		// Separator row
		md +=
			"| " +
			colWidths.map((w) => "-".repeat(w)).join(" | ") +
			" |\n";

		// Data rows
		rows.slice(1).forEach((row) => {
			md +=
				"| " +
				row
					.map((cell, i) => (cell || "").padEnd(colWidths[i] || 3))
					.join(" | ") +
				" |\n";
		});

		return md + "\n";
	},
});
