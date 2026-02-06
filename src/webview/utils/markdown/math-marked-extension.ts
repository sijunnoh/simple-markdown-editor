import type { MarkedExtension, Tokens } from "marked";

interface MathBlockToken extends Tokens.Generic {
	type: "mathBlock";
	raw: string;
	latex: string;
}

interface MathInlineToken extends Tokens.Generic {
	type: "mathInline";
	raw: string;
	latex: string;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export const mathExtension: MarkedExtension = {
	extensions: [
		{
			name: "mathBlock",
			level: "block",
			start(src: string) {
				return src.indexOf("$$") >= 0 ? src.indexOf("$$") : -1;
			},
			tokenizer(src: string): MathBlockToken | undefined {
				const match = /^\$\$\n?([\s\S]+?)\n?\$\$(?:\n|$)/.exec(src);
				if (match) {
					return {
						type: "mathBlock",
						raw: match[0],
						latex: match[1].trim(),
					};
				}
			},
			renderer(token) {
				const escaped = escapeHtml((token as MathBlockToken).latex);
				return `<div class="math-block" data-latex="${escaped}">${escaped}</div>\n`;
			},
		},
		{
			name: "mathInline",
			level: "inline",
			start(src: string) {
				const idx = src.indexOf("$");
				return idx >= 0 ? idx : -1;
			},
			tokenizer(src: string): MathInlineToken | undefined {
				// Require non-digit/non-space after opening $ to prevent $100 from matching
				// Allow digits before closing $ so $E=mc^2$ works
				const match = /^\$(?!\$|[\d\s])(.+?)(?<!\s)\$(?!\$)/.exec(src);
				if (match) {
					return {
						type: "mathInline",
						raw: match[0],
						latex: match[1],
					};
				}
			},
			renderer(token) {
				const escaped = escapeHtml((token as MathInlineToken).latex);
				return `<span class="math-inline" data-latex="${escaped}">${escaped}</span>`;
			},
		},
	],
};
