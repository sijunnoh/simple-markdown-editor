import { useCallback } from "react";

interface UseFileDropOptions {
	vscode: { postMessage: (message: unknown) => void };
}

export function useFileDrop({ vscode }: UseFileDropOptions) {
	// Handle file drop
	const handleFileDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				const files = Array.from(e.dataTransfer.files);
				const imageFiles = files.filter((file) => file.type.startsWith("image/"));

				if (imageFiles.length > 0) {
					const promises = imageFiles.map((file) => {
						return new Promise<{ name: string; data: string }>((resolve) => {
							const reader = new FileReader();
							reader.onload = () => {
								const base64 = (reader.result as string).split(",")[1];
								resolve({ name: file.name, data: base64 });
							};
							reader.readAsDataURL(file);
						});
					});

					Promise.all(promises).then((droppedFiles) => {
						vscode.postMessage({ type: "dropFiles", files: droppedFiles });
					});
					return;
				}
			}

			const uriList = e.dataTransfer.getData("text/uri-list");
			if (uriList) {
				const uri = uriList.split("\n")[0].trim();
				if (uri.startsWith("file://")) {
					vscode.postMessage({ type: "resolveFilePath", uri: uri });
				}
			}
		},
		[vscode],
	);

	// Handle clipboard paste
	const handlePaste = useCallback(
		(e: React.ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			const imageItem = Array.from(items).find((item) =>
				item.type.startsWith("image/"),
			);

			if (imageItem) {
				e.preventDefault();
				const file = imageItem.getAsFile();
				if (file) {
					const reader = new FileReader();
					reader.onload = () => {
						const base64 = (reader.result as string).split(",")[1];
						vscode.postMessage({ type: "pasteImage", data: base64 });
					};
					reader.readAsDataURL(file);
				}
			}
		},
		[vscode],
	);

	// Handle file drag over
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	return {
		handleFileDrop,
		handlePaste,
		handleDragOver,
	};
}
