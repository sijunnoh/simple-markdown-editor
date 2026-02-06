import { marked } from "marked";
import { turndown } from "../../../src/webview/utils/markdown/turndown-config";
import { frontmatterExtension } from "../../../src/webview/utils/markdown/frontmatter-marked-extension";
import { mathExtension } from "../../../src/webview/utils/markdown/math-marked-extension";

// Configure marked same as parser.ts
marked.setOptions({ gfm: true, breaks: false });
marked.use(frontmatterExtension);
marked.use(mathExtension);

export { marked, turndown };

export function roundTrip(md: string): string {
	const html = marked.parse(md, { async: false }) as string;
	return turndown.turndown(html).trim();
}
