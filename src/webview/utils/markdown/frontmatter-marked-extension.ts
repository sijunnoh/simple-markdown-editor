import type { MarkedExtension, Tokens } from "marked";

interface FrontmatterToken extends Tokens.Generic {
	type: "frontmatter";
	raw: string;
	content: string;
}

export const frontmatterExtension: MarkedExtension = {
	extensions: [
		{
			name: "frontmatter",
			level: "block",
			start(src: string) {
				return src.indexOf("---") === 0 ? 0 : -1;
			},
			tokenizer(src: string): FrontmatterToken | undefined {
				const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(src);
				if (match && this.lexer.tokens.length === 0) {
					return {
						type: "frontmatter",
						raw: match[0],
						content: match[1],
					};
				}
			},
			renderer(token) {
				const escaped = (token as FrontmatterToken).content
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;");
				return `<div class="frontmatter-block" data-content="${escaped}"><pre>${escaped}</pre></div>\n`;
			},
		},
	],
};
