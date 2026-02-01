import * as vscode from 'vscode';
import { MarkdownEditorProvider } from './editor/markdown-editor-provider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Simple Markdown Editor extension is now active!');

	// Register custom editor
	context.subscriptions.push(MarkdownEditorProvider.register(context));

	// Keep hello world command for testing
	const disposable = vscode.commands.registerCommand('simple-markdown-editor.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Simple Markdown Editor!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
