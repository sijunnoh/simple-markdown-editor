import { useState, useEffect, useCallback } from "react";
import type { ModalType, EditorSettings } from "../types";
import { updateTurndownOptions } from "../utils/markdown/turndown-config";

interface UseSettingsOptions {
	vscode: { postMessage: (message: unknown) => void };
	setModalType: (type: ModalType) => void;
}

export const HEADING_SIZE_PRESETS = {
	small: { h1: "1.6em", h2: "1.3em", h3: "1.15em", h4: "1.05em", h5: "1em" },
	medium: { h1: "2em", h2: "1.5em", h3: "1.25em", h4: "1.1em", h5: "1.05em" },
	large: { h1: "2.4em", h2: "1.8em", h3: "1.5em", h4: "1.25em", h5: "1.1em" },
} as const;

export function getHeadingSizes(preset: EditorSettings["headingSizePreset"]) {
	return HEADING_SIZE_PRESETS[preset] || HEADING_SIZE_PRESETS.medium;
}

export const DEFAULT_SETTINGS: EditorSettings = {
	imageDirectory: "./images",
	emDelimiter: "*",
	strongDelimiter: "**",
	headingSizePreset: "medium",
	indentationStyle: "2spaces",
};

function applyHeadingSizePreset(preset: EditorSettings["headingSizePreset"]) {
	const root = document.documentElement;
	const selected = getHeadingSizes(preset);
	root.style.setProperty("--heading-h1-size", selected.h1);
	root.style.setProperty("--heading-h2-size", selected.h2);
	root.style.setProperty("--heading-h3-size", selected.h3);
	root.style.setProperty("--heading-h4-size", selected.h4);
	root.style.setProperty("--heading-h5-size", selected.h5);
}

export function useSettings({ vscode, setModalType }: UseSettingsOptions) {
	const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);

	// Open settings modal
	const openSettingsModal = useCallback(() => {
		setModalType("settings");
	}, [setModalType]);

	// Handle settings save
	const handleSettingsSave = useCallback((newSettings: EditorSettings) => {
		setSettings(newSettings);
		updateTurndownOptions(newSettings);
		// Send full settings to extension for persistence
		vscode.postMessage({
			type: "updateSettings",
			settings: newSettings,
		});
	}, [vscode]);

	// Listen for settings from extension (on ready)
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data;
			if (message.type === "settings" && message.settings) {
				setSettings(message.settings);
				updateTurndownOptions(message.settings);
				applyHeadingSizePreset(message.settings.headingSizePreset);
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

	// Apply settings on mount and when settings change
	useEffect(() => {
		updateTurndownOptions(settings);
		applyHeadingSizePreset(settings.headingSizePreset);
	}, [settings]);

	return {
		settings,
		openSettingsModal,
		handleSettingsSave,
	};
}
