import * as vscode from 'vscode';
import { MarkdownEditorProvider } from './editor/markdown-editor-provider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Simple Markdown Editor extension is now active!');

	// Register custom editor
	context.subscriptions.push(MarkdownEditorProvider.register(context));

	// Register keybinding commands
	const showFormatMenuCommand = vscode.commands.registerCommand('simple-markdown-editor.showFormatMenu', async () => {
		const items = [
			// Text formatting
			{ label: '$(bold) Bold', description: '⌘B', command: 'toggleBold' },
			{ label: '$(italic) Italic', description: '⌘I', command: 'toggleItalic' },
			{ label: '$(strikethrough) Strikethrough', command: 'toggleStrike' },
			{ label: '$(code) Inline Code', command: 'toggleCode' },
			// Separator
			{ label: '$(link) Insert Link', command: 'insertLink' },
			{ label: '$(file-media) Insert Image', command: 'insertImage' },
			{ label: '$(table) Insert Table', command: 'insertTable' },
			// Separator
			{ label: '$(symbol-class) Heading 1', command: 'setHeading1' },
			{ label: '$(symbol-class) Heading 2', command: 'setHeading2' },
			{ label: '$(symbol-class) Heading 3', command: 'setHeading3' },
			// Separator
			{ label: '$(list-unordered) Bullet List', command: 'toggleBulletList' },
			{ label: '$(list-ordered) Numbered List', command: 'toggleOrderedList' },
			{ label: '$(checklist) Task List', command: 'toggleTaskList' },
			{ label: '$(quote) Blockquote', command: 'toggleBlockquote' },
			{ label: '$(terminal) Code Block', command: 'toggleCodeBlock' },
		];

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select format action',
		});

		if (selected) {
			MarkdownEditorProvider.sendCommand(selected.command);
		}
	});

	const insertLinkCommand = vscode.commands.registerCommand('simple-markdown-editor.insertLink', () => {
		MarkdownEditorProvider.sendCommand('insertLink');
	});

	const toggleCodeCommand = vscode.commands.registerCommand('simple-markdown-editor.toggleCode', () => {
		MarkdownEditorProvider.sendCommand('toggleCode');
	});

	const toggleStrikeCommand = vscode.commands.registerCommand('simple-markdown-editor.toggleStrike', () => {
		MarkdownEditorProvider.sendCommand('toggleStrike');
	});

	const openWithWysiwygCommand = vscode.commands.registerCommand('simple-markdown-editor.openWithWysiwyg', async (uri?: vscode.Uri) => {
		const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
		if (targetUri && targetUri.fsPath.endsWith('.md')) {
			await vscode.commands.executeCommand(
				'vscode.openWith',
				targetUri,
				'simple-markdown-editor.markdownEditor'
			);
		}
	});

	context.subscriptions.push(showFormatMenuCommand, insertLinkCommand, toggleCodeCommand, toggleStrikeCommand, openWithWysiwygCommand);
}

export function deactivate() {}
