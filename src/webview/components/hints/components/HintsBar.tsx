import type { ViewMode } from "../../../types";

interface HintsBarProps {
	viewMode: ViewMode;
}

export function HintsBar({ viewMode }: HintsBarProps) {
	const isMac = navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
	const modKey = isMac ? "\u2318" : "Ctrl";

	const sourceHintsRow1 = [
		{ key: "#", desc: "H1" },
		{ key: "##", desc: "H2" },
		{ key: "###", desc: "H3" },
		{ key: "**text**", desc: "Bold" },
		{ key: "*text*", desc: "Italic" },
		{ key: "~~text~~", desc: "Strike" },
		{ key: "`code`", desc: "Code" },
		{ key: "[text](url)", desc: "Link" },
	];

	const sourceHintsRow2 = [
		{ key: "- item", desc: "List" },
		{ key: "1. item", desc: "Numbered" },
		{ key: "- [ ]", desc: "Task" },
		{ key: "![alt](url)", desc: "Image" },
		{ key: "> quote", desc: "Quote" },
		{ key: "```lang", desc: "Code Block" },
		{ key: "---", desc: "Divider" },
	];

	const inputRules = [
		{ key: "# \u2423", desc: "\u2192 H1" },
		{ key: "## \u2423", desc: "\u2192 H2" },
		{ key: "### \u2423", desc: "\u2192 H3" },
		{ key: "- \u2423", desc: "\u2192 List" },
		{ key: "1. \u2423", desc: "\u2192 Numbered" },
		{ key: "[] \u2423", desc: "\u2192 Task" },
		{ key: "> \u2423", desc: "\u2192 Quote" },
		{ key: "``` \u2423", desc: "\u2192 Code" },
		{ key: "---", desc: "\u2192 Divider" },
	];

	const shortcuts: { key: string; desc: string; highlight?: boolean }[] = [
		{ key: `${modKey}+/`, desc: "Format Menu", highlight: true },
		{ key: `${modKey}+Z`, desc: "Undo" },
		{ key: `${modKey}+Shift+Z`, desc: "Redo" },
	];

	if (viewMode === "source") {
		return (
			<div className="hints-bar two-rows">
				<div className="hints-row">
					<span className="hints-label">Text</span>
					<div className="hints-track">
						{sourceHintsRow1.map((hint, i) => (
							<span key={i} className="hint-item">
								<span className="hint-key">{hint.key}</span>
								<span className="hint-desc">{hint.desc}</span>
							</span>
						))}
					</div>
				</div>
				<div className="hints-row">
					<span className="hints-label">Block</span>
					<div className="hints-track">
						{sourceHintsRow2.map((hint, i) => (
							<span key={i} className="hint-item">
								<span className="hint-key">{hint.key}</span>
								<span className="hint-desc">{hint.desc}</span>
							</span>
						))}
					</div>
				</div>
			</div>
		);
	}

	// Editor mode: two rows
	return (
		<div className="hints-bar two-rows">
			<div className="hints-row">
				<span className="hints-label">Input</span>
				<div className="hints-track">
					{inputRules.map((hint, i) => (
						<span key={i} className="hint-item">
							<span className="hint-key">{hint.key}</span>
							<span className="hint-desc">{hint.desc}</span>
						</span>
					))}
				</div>
			</div>
			<div className="hints-row">
				<span className="hints-label">Keys</span>
				<div className="hints-track">
					{shortcuts.map((hint, i) => (
						<span
							key={i}
							className={`hint-item${hint.highlight ? " highlight" : ""}`}
						>
							<span className="hint-key">{hint.key}</span>
							<span className="hint-desc">{hint.desc}</span>
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
