import * as vscode from "vscode";
import { webviewStyles } from "./webview-styles";
import { katexStyles } from "./katex-styles";
import {
	getNonce,
	handleImagePick,
	handleResolveFilePath,
	handlePasteImage,
	handleDropFiles,
	handleDeleteFile,
	handleGetSuggestions,
} from "./file-handlers";

// Editor settings interface (must match webview types)
interface EditorSettings {
	imageDirectory: string;
	emDelimiter: "*" | "_";
	strongDelimiter: "**" | "__";
	headingSizePreset: "small" | "medium" | "large";
	indentationStyle: "tabs" | "2spaces" | "4spaces";
}

const DEFAULT_SETTINGS: EditorSettings = {
	imageDirectory: "./images",
	emDelimiter: "*",
	strongDelimiter: "**",
	headingSizePreset: "medium",
	indentationStyle: "2spaces",
};

const SETTINGS_KEY = "simple-markdown-editor.settings";

export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
	public static readonly viewType = "simple-markdown-editor.markdownEditor";

	private static activeWebviewPanel: vscode.WebviewPanel | undefined;

	constructor(private readonly context: vscode.ExtensionContext) {}

	private getSettings(): EditorSettings {
		const stored = this.context.globalState.get<EditorSettings>(SETTINGS_KEY);
		return { ...DEFAULT_SETTINGS, ...stored };
	}

	private async saveSettings(settings: EditorSettings): Promise<void> {
		await this.context.globalState.update(SETTINGS_KEY, settings);
	}

	public static sendCommand(command: string): void {
		if (MarkdownEditorProvider.activeWebviewPanel) {
			MarkdownEditorProvider.activeWebviewPanel.webview.postMessage({
				type: "command",
				command,
			});
		}
	}

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new MarkdownEditorProvider(context);
		return vscode.window.registerCustomEditorProvider(
			MarkdownEditorProvider.viewType,
			provider,
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
			},
		);
	}

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken,
	): Promise<void> {
		// Get workspace folder for local resource access
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		const localResourceRoots = [
			vscode.Uri.joinPath(this.context.extensionUri, "dist"),
		];
		if (workspaceFolder) {
			localResourceRoots.push(workspaceFolder.uri);
		}
		// Also add document's parent directory for images
		localResourceRoots.push(vscode.Uri.joinPath(document.uri, ".."));

		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots,
		};

		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		// Get document directory for relative paths
		const documentDir = vscode.Uri.joinPath(document.uri, "..");
		// Get webview URI for document directory (for displaying images)
		const documentDirWebviewUri = webviewPanel.webview
			.asWebviewUri(documentDir)
			.toString();

		// Track last content received from webview to prevent update loops
		let lastContentFromWebview = "";

		// Send initial content to webview
		const updateWebview = () => {
			const content = document.getText();
			webviewPanel.webview.postMessage({
				type: "update",
				content,
				baseUri: documentDirWebviewUri,
			});
		};

		// Send settings to webview
		const sendSettings = () => {
			const settings = this.getSettings();
			webviewPanel.webview.postMessage({
				type: "settings",
				settings,
			});
		};

		// Listen for document changes (external changes only)
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
			(e) => {
				if (e.document.uri.toString() === document.uri.toString()) {
					// Only update webview if content differs from what webview sent
					// This prevents echo when webview's edit is applied to document
					const currentContent = document.getText();
					if (currentContent !== lastContentFromWebview) {
						updateWebview();
					}
				}
			},
		);

		// Listen for messages from webview
		webviewPanel.webview.onDidReceiveMessage(async (message) => {
			switch (message.type) {
				case "edit":
					// Track content from webview to prevent echo
					lastContentFromWebview = message.content;
					await this.updateTextDocument(document, message.content);
					break;
				case "ready":
					updateWebview();
					sendSettings();
					break;
				case "pickImage":
					handleImagePick(webviewPanel, documentDir, this.getSettings().imageDirectory);
					break;
				case "openLink":
					if (message.url) {
						try {
							const uri = vscode.Uri.parse(message.url);
							const scheme = uri.scheme.toLowerCase();
							if (['http', 'https', 'mailto'].includes(scheme)) {
								vscode.env.openExternal(uri);
							}
						} catch {
							// invalid URL, ignore
						}
					}
					break;
				case "resolveFilePath":
					handleResolveFilePath(webviewPanel, documentDir, message.uri);
					break;
				case "pasteImage":
					handlePasteImage(webviewPanel, documentDir, message.data, this.getSettings().imageDirectory);
					break;
				case "dropFiles":
					handleDropFiles(webviewPanel, documentDir, message.files, this.getSettings().imageDirectory);
					break;
				case "getSuggestions":
					handleGetSuggestions(webviewPanel, documentDir, message.query);
					break;
				case "deleteFile":
					handleDeleteFile(webviewPanel, message.path, documentDir);
					break;
				case "updateSettings":
					await this.saveSettings(message.settings);
					break;
			}
		});

		// Track active webview panel
		MarkdownEditorProvider.activeWebviewPanel = webviewPanel;

		webviewPanel.onDidChangeViewState((e) => {
			if (e.webviewPanel.active) {
				MarkdownEditorProvider.activeWebviewPanel = webviewPanel;
			}
		});

		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
			if (MarkdownEditorProvider.activeWebviewPanel === webviewPanel) {
				MarkdownEditorProvider.activeWebviewPanel = undefined;
			}
		});

		updateWebview();
	}

	private getHtmlForWebview(webview: vscode.Webview): string {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js"),
		);

		const nonce = getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval'; img-src ${webview.cspSource} https: data:;">
  <title>Simple Markdown Editor</title>
  <style>${katexStyles}${webviewStyles}</style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
	}

	private updateTextDocument(document: vscode.TextDocument, content: string) {
		const edit = new vscode.WorkspaceEdit();
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			content,
		);
		return vscode.workspace.applyEdit(edit);
	}

}
