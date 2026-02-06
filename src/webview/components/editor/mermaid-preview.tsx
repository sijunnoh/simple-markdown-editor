import { useState, useEffect, useRef, useId } from "react";
import mermaid from "mermaid";

let currentMermaidTheme = "";

function initMermaid() {
	const isDark = document.body.classList.contains("vscode-dark") ||
		document.body.classList.contains("vscode-high-contrast");
	const theme = isDark ? "dark" : "default";
	if (theme === currentMermaidTheme) return;
	currentMermaidTheme = theme;
	mermaid.initialize({
		startOnLoad: false,
		theme,
		securityLevel: "loose",
	});
}

interface MermaidPreviewProps {
	code: string;
}

export function MermaidPreview({ code }: MermaidPreviewProps) {
	const [svg, setSvg] = useState<string>("");
	const [error, setError] = useState<string>("");
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const uniqueId = useId().replace(/:/g, "_");

	useEffect(() => {
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(async () => {
			if (!code.trim()) {
				setSvg("");
				setError("");
				return;
			}
			try {
				initMermaid();
				const id = `mermaid_${uniqueId}_${Date.now()}`;
				const { svg: rendered } = await mermaid.render(id, code.trim());
				setSvg(rendered);
				setError("");
			} catch (e) {
				setError(e instanceof Error ? e.message : "Invalid mermaid syntax");
				setSvg("");
			}
		}, 500);

		return () => clearTimeout(timerRef.current);
	}, [code, uniqueId]);

	if (!svg && !error) return null;

	return (
		<div className="mermaid-preview" contentEditable={false}>
			{error ? (
				<div className="mermaid-error">{error}</div>
			) : (
				<div dangerouslySetInnerHTML={{ __html: svg }} />
			)}
		</div>
	);
}
