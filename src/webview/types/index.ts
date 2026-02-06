// View modes for the editor
export type ViewMode = "editor" | "source" | "split";

// Modal types
export type ModalType = "link" | "image" | "table" | "settings" | null;

// Heading size presets
export type HeadingSizePreset = "small" | "medium" | "large";

// Indentation style
export type IndentationStyle = "tabs" | "2spaces" | "4spaces";

// Editor settings
export interface EditorSettings {
	imageDirectory: string;
	emDelimiter: "*" | "_";
	strongDelimiter: "**" | "__";
	headingSizePreset: HeadingSizePreset;
	indentationStyle: IndentationStyle;
}

// Link hover popup state
export interface LinkHoverState {
	visible: boolean;
	url: string;
	text: string;
	position: { x: number; y: number };
	linkElement: HTMLAnchorElement | null;
}

// Suggestion item for autocomplete
export interface Suggestion {
	label: string;
	path: string;
	type: "file" | "image";
}

// Table floating menu state
export interface TableMenuState {
	visible: boolean;
	position: { x: number; y: number };
}

// Table context menu state
export interface TableContextMenu {
	visible: boolean;
	position: { x: number; y: number };
}

// VS Code API type
export interface VSCodeAPI {
	postMessage: (message: unknown) => void;
	getState: () => unknown;
	setState: (state: unknown) => void;
}

// Message types from extension to webview
export type ExtensionMessage =
	| { type: "update"; content: string; baseUri?: string }
	| { type: "suggestions"; suggestions: Suggestion[] }
	| { type: "imageSelected"; path: string }
	| { type: "filePathResolved"; path: string }
	| { type: "deleteFileResult"; action: "delete" | "keep" | "cancel" }
	| { type: "command"; command: string }
	| { type: "settings"; settings: EditorSettings };

// Message types from webview to extension
export type WebviewMessage =
	| { type: "edit"; content: string }
	| { type: "ready" }
	| { type: "pickImage" }
	| { type: "pasteImage"; data: string }
	| { type: "dropFiles"; files: { name: string; data: string }[] }
	| { type: "resolveFilePath"; uri: string }
	| { type: "deleteFile"; path: string }
	| { type: "openLink"; url: string }
	| { type: "getSuggestions"; query: string }
	| { type: "updateSettings"; settings: EditorSettings };

// Search match position
export interface SearchMatch {
	from: number;
	to: number;
}

// Search state
export interface SearchState {
	isOpen: boolean;
	searchTerm: string;
	replaceTerm: string;
	matches: SearchMatch[];
	currentIndex: number;
}
