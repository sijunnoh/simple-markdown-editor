import { useState } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { MermaidPreview } from "./mermaid-preview";

// CodeBlock component for ReactNodeViewRenderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CodeBlockComponent({ node, updateAttributes, extension }: any) {
	const language = node.attrs.language || "plaintext";
	const languages: string[] = [
		...(extension.options.lowlight?.listLanguages?.() || []),
		"mermaid",
	].sort();
	const [showMermaidPreview, setShowMermaidPreview] = useState(true);
	const isMermaid = language === "mermaid";

	const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLanguage = e.target.value;
		updateAttributes({ language: newLanguage });
		// Remember this language for the next code block (stored in extension storage)
		extension.storage.lastSelectedLanguage = newLanguage;
	};

	return (
		<NodeViewWrapper className="code-block">
			<select
				contentEditable={false}
				value={language}
				onChange={handleLanguageChange}
			>
				<option value="plaintext">auto</option>
				<option disabled>—</option>
				{languages.map((lang: string) => (
					<option key={lang} value={lang}>
						{lang}
					</option>
				))}
			</select>
			{isMermaid && (
				<button
					className="mermaid-toggle"
					contentEditable={false}
					onClick={() => setShowMermaidPreview(!showMermaidPreview)}
				>
					{showMermaidPreview ? "Hide Preview" : "Show Preview"}
				</button>
			)}
			<pre>
				<NodeViewContent as={"code" as "div"} />
			</pre>
			{isMermaid && showMermaidPreview && (
				<MermaidPreview code={node.textContent || ""} />
			)}
		</NodeViewWrapper>
	);
}
