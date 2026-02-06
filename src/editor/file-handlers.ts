import * as vscode from "vscode";
import * as path from "path";

export function formatError(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

export function getNonce(): string {
	let text = "";
	const possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function calculateRelativePath(
	fromDir: vscode.Uri,
	toFilePath: string,
): string {
	const docPath = fromDir.fsPath;
	const targetPath = toFilePath;

	if (targetPath.startsWith(docPath)) {
		return "./" + targetPath.slice(docPath.length + 1);
	}

	const targetParts = targetPath.split("/");
	const fromParts = docPath.split("/");

	let commonLength = 0;
	for (let i = 0; i < Math.min(targetParts.length, fromParts.length); i++) {
		if (targetParts[i] === fromParts[i]) {
			commonLength = i + 1;
		} else {
			break;
		}
	}

	const upCount = fromParts.length - commonLength;
	const downPath = targetParts.slice(commonLength).join("/");
	return "../".repeat(upCount) + downPath;
}

async function getUniqueUri(
	directory: vscode.Uri,
	fileName: string,
): Promise<vscode.Uri> {
	const extIdx = fileName.lastIndexOf(".");
	const name = extIdx !== -1 ? fileName.slice(0, extIdx) : fileName;
	const ext = extIdx !== -1 ? fileName.slice(extIdx) : "";

	let counter = 0;
	let targetUri = vscode.Uri.joinPath(directory, fileName);

	while (true) {
		try {
			await vscode.workspace.fs.stat(targetUri);
			counter++;
			targetUri = vscode.Uri.joinPath(directory, `${name}_${counter}${ext}`);
		} catch {
			return targetUri;
		}
	}
}

function resolveImagesDir(
	documentDir: vscode.Uri,
	imageDirectory: string,
): vscode.Uri {
	const dirName = imageDirectory.replace(/^\.\//, "");
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentDir);
	const rootDir = workspaceFolder ? workspaceFolder.uri : documentDir;
	return vscode.Uri.joinPath(rootDir, dirName);
}

export async function handleImagePick(
	webviewPanel: vscode.WebviewPanel,
	documentDir: vscode.Uri,
	imageDirectory: string,
): Promise<void> {
	const result = await vscode.window.showOpenDialog({
		canSelectMany: false,
		filters: {
			Images: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
		},
		title: "Select Image",
	});

	if (!result || !result[0]) {
		return;
	}

	const sourceUri = result[0];
	const fileName = path.basename(sourceUri.path) || "image.png";

	try {
		const imagesDir = resolveImagesDir(documentDir, imageDirectory);
		await vscode.workspace.fs.createDirectory(imagesDir);

		const targetUri = await getUniqueUri(imagesDir, fileName);
		await vscode.workspace.fs.copy(sourceUri, targetUri, {
			overwrite: false,
		});

		const relativePath = calculateRelativePath(
			documentDir,
			targetUri.fsPath,
		);
		webviewPanel.webview.postMessage({
			type: "imageSelected",
			path: relativePath,
		});
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to copy image: ${formatError(err)}`);
	}
}

export function handleResolveFilePath(
	webviewPanel: vscode.WebviewPanel,
	documentDir: vscode.Uri,
	fileUri: string,
): void {
	try {
		const uri = vscode.Uri.parse(fileUri);
		const relativePath = calculateRelativePath(documentDir, uri.fsPath);

		webviewPanel.webview.postMessage({
			type: "filePathResolved",
			path: relativePath,
		});
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to resolve file path: ${formatError(err)}`);
	}
}

export async function handlePasteImage(
	webviewPanel: vscode.WebviewPanel,
	documentDir: vscode.Uri,
	base64Data: string,
	imageDirectory: string,
): Promise<void> {
	try {
		const imagesDir = resolveImagesDir(documentDir, imageDirectory);
		await vscode.workspace.fs.createDirectory(imagesDir);

		const buffer = Buffer.from(base64Data, "base64");
		const timestamp = new Date().getTime();
		const fileName = `image_${timestamp}.png`;
		const targetUri = await getUniqueUri(imagesDir, fileName);

		await vscode.workspace.fs.writeFile(targetUri, buffer);

		const relativePath = calculateRelativePath(
			documentDir,
			targetUri.fsPath,
		);
		webviewPanel.webview.postMessage({
			type: "imageSelected",
			path: relativePath,
		});
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to save pasted image: ${formatError(err)}`);
	}
}

export async function handleDropFiles(
	webviewPanel: vscode.WebviewPanel,
	documentDir: vscode.Uri,
	files: { name: string; data: string }[],
	imageDirectory: string,
): Promise<void> {
	try {
		const imagesDir = resolveImagesDir(documentDir, imageDirectory);
		await vscode.workspace.fs.createDirectory(imagesDir);

		for (const file of files) {
			const buffer = Buffer.from(file.data, "base64");
			const targetUri = await getUniqueUri(imagesDir, path.basename(file.name));
			await vscode.workspace.fs.writeFile(targetUri, buffer);

			const relativePath = calculateRelativePath(
				documentDir,
				targetUri.fsPath,
			);
			webviewPanel.webview.postMessage({
				type: "imageSelected",
				path: relativePath,
			});
		}
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to save dropped files: ${formatError(err)}`);
	}
}

export async function handleDeleteFile(
	webviewPanel: vscode.WebviewPanel,
	filePath: string,
	documentDir: vscode.Uri,
): Promise<void> {
	try {
		let fileUri: vscode.Uri | undefined;

		if (
			filePath.startsWith("vscode-webview:") ||
			filePath.includes(".vscode-webview-test-result") ||
			filePath.startsWith("http")
		) {
			const fileName = path.basename(filePath.split("?")[0]);
			if (!fileName) {
				vscode.window.showErrorMessage(
					`Could not determine file name from path: ${filePath}`,
				);
				webviewPanel.webview.postMessage({
					type: "deleteFileResult",
					action: "cancel",
				});
				return;
			}

			const workspaceFolder =
				vscode.workspace.getWorkspaceFolder(documentDir);
			const rootDir = workspaceFolder ? workspaceFolder.uri : documentDir;
			fileUri = vscode.Uri.joinPath(rootDir, "images", fileName);
		} else {
			fileUri = vscode.Uri.joinPath(documentDir, filePath);
		}

		if (!fileUri) {
			vscode.window.showErrorMessage(
				`Could not resolve file URI for path: ${filePath}`,
			);
			webviewPanel.webview.postMessage({
				type: "deleteFileResult",
				action: "cancel",
			});
			return;
		}

		let fileExists = true;
		try {
			await vscode.workspace.fs.stat(fileUri);
		} catch {
			fileExists = false;
		}

		const choice = await vscode.window.showWarningMessage(
			fileExists
				? `Do you want to delete this image?`
				: `Image file not found. Remove from editor?`,
			{ modal: true },
			...(fileExists ? ["Delete File", "Keep File"] : ["Remove"]),
		);

		if (choice === "Delete File") {
			await vscode.workspace.fs.delete(fileUri);
			webviewPanel.webview.postMessage({
				type: "deleteFileResult",
				action: "delete",
			});
		} else if (choice === "Keep File" || choice === "Remove") {
			webviewPanel.webview.postMessage({
				type: "deleteFileResult",
				action: "keep",
			});
		} else {
			webviewPanel.webview.postMessage({
				type: "deleteFileResult",
				action: "cancel",
			});
		}
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to delete file: ${formatError(err)}`);
		webviewPanel.webview.postMessage({
			type: "deleteFileResult",
			action: "cancel",
		});
	}
}

export async function handleGetSuggestions(
	webviewPanel: vscode.WebviewPanel,
	documentDir: vscode.Uri,
	query: string,
): Promise<void> {
	try {
		const files = await vscode.workspace.findFiles(
			"**/*.{md,png,jpg,jpeg,gif,svg,webp}",
			"**/node_modules/**",
		);

		const suggestions = files.map((file) => {
			const relativePath = calculateRelativePath(
				documentDir,
				file.fsPath,
			);

			return {
				label: relativePath,
				path: relativePath,
				type: file.fsPath.endsWith(".md") ? "file" : "image",
			};
		});

		const filtered = suggestions
			.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()))
			.slice(0, 10);

		webviewPanel.webview.postMessage({
			type: "suggestions",
			suggestions: filtered,
		});
	} catch (err) {
		console.error("Failed to get suggestions:", formatError(err));
		webviewPanel.webview.postMessage({
			type: "suggestions",
			suggestions: [],
		});
	}
}
