/**
 * Normalize content for comparison (handles line ending differences).
 */
export function normalizeContent(content: string): string {
	return (content || "").replace(/\r\n/g, "\n").trim();
}
