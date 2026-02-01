import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";

// Track last selected language for new code blocks
export let lastSelectedLanguage = "plaintext";

export function setLastSelectedLanguage(lang: string) {
	lastSelectedLanguage = lang;
}

// CodeBlock component for ReactNodeViewRenderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CodeBlockComponent({ node, updateAttributes, extension }: any) {
	const language = node.attrs.language || "plaintext";
	const languages: string[] =
		extension.options.lowlight?.listLanguages?.() || [];

	const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLanguage = e.target.value;
		updateAttributes({ language: newLanguage });
		// Remember this language for the next code block
		setLastSelectedLanguage(newLanguage);
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
			<pre>
				<NodeViewContent as={"code" as "div"} />
			</pre>
		</NodeViewWrapper>
	);
}
