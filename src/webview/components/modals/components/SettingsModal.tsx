import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import type { EditorSettings } from "../../../types";

const IMAGE_DIR_PRESETS = [
	"./images",
	"./assets",
	"./assets/images",
	"./media",
	"./static/images",
];

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	settings: EditorSettings;
	onSave: (settings: EditorSettings) => void;
}

export function SettingsModal({
	isOpen,
	onClose,
	settings,
	onSave,
}: SettingsModalProps) {
	const [localSettings, setLocalSettings] = useState<EditorSettings>(settings);
	const [isCustomDir, setIsCustomDir] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setLocalSettings(settings);
			setIsCustomDir(!IMAGE_DIR_PRESETS.includes(settings.imageDirectory));
		}
	}, [isOpen, settings]);

	const handleSave = () => {
		onSave(localSettings);
		onClose();
	};

	const handleDirChange = (value: string) => {
		if (value === "__custom__") {
			setIsCustomDir(true);
		} else {
			setIsCustomDir(false);
			setLocalSettings({ ...localSettings, imageDirectory: value });
		}
	};

	return (
		<Modal isOpen={isOpen} title="Settings" onClose={onClose}>
			<div className="modal-form">
				<label>
					<span>Image Directory</span>
					<select
						value={isCustomDir ? "__custom__" : localSettings.imageDirectory}
						onChange={(e) => handleDirChange(e.target.value)}
					>
						{IMAGE_DIR_PRESETS.map((preset) => (
							<option key={preset} value={preset}>
								{preset}
							</option>
						))}
						<option value="__custom__">Custom...</option>
					</select>
				</label>
				{isCustomDir && (
					<label>
						<span>Custom Path</span>
						<input
							type="text"
							value={localSettings.imageDirectory}
							onChange={(e) =>
								setLocalSettings({ ...localSettings, imageDirectory: e.target.value })
							}
							placeholder="./custom/path"
							autoFocus
						/>
					</label>
				)}

				<div className="settings-toggle">
					<span>Italic Style</span>
					<div className="toggle-buttons">
						<button
							className={`toggle-btn ${localSettings.emDelimiter === "*" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, emDelimiter: "*" })}
						>
							*italic*
						</button>
						<button
							className={`toggle-btn ${localSettings.emDelimiter === "_" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, emDelimiter: "_" })}
						>
							_italic_
						</button>
					</div>
				</div>

				<div className="settings-toggle">
					<span>Bold Style</span>
					<div className="toggle-buttons">
						<button
							className={`toggle-btn ${localSettings.strongDelimiter === "**" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, strongDelimiter: "**" })}
						>
							**bold**
						</button>
						<button
							className={`toggle-btn ${localSettings.strongDelimiter === "__" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, strongDelimiter: "__" })}
						>
							__bold__
						</button>
					</div>
				</div>

				<div className="settings-toggle">
					<span>Heading Size</span>
					<div className="toggle-buttons">
						<button
							className={`toggle-btn ${localSettings.headingSizePreset === "small" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, headingSizePreset: "small" })}
						>
							Small
						</button>
						<button
							className={`toggle-btn ${localSettings.headingSizePreset === "medium" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, headingSizePreset: "medium" })}
						>
							Medium
						</button>
						<button
							className={`toggle-btn ${localSettings.headingSizePreset === "large" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, headingSizePreset: "large" })}
						>
							Large
						</button>
					</div>
				</div>

				<div className="settings-toggle">
					<span>Indentation</span>
					<div className="toggle-buttons">
						<button
							className={`toggle-btn ${localSettings.indentationStyle === "tabs" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, indentationStyle: "tabs" })}
						>
							Tabs
						</button>
						<button
							className={`toggle-btn ${localSettings.indentationStyle === "2spaces" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, indentationStyle: "2spaces" })}
						>
							2 Spaces
						</button>
						<button
							className={`toggle-btn ${localSettings.indentationStyle === "4spaces" ? "active" : ""}`}
							onClick={() => setLocalSettings({ ...localSettings, indentationStyle: "4spaces" })}
						>
							4 Spaces
						</button>
					</div>
				</div>

				<div className="modal-actions">
					<button className="modal-btn-secondary" onClick={onClose}>
						Cancel
					</button>
					<button className="modal-btn-primary" onClick={handleSave}>
						Save
					</button>
				</div>
			</div>
		</Modal>
	);
}
