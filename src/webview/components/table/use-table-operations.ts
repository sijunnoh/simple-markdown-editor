import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { TableContextMenu } from "../../types";

// Helper to check if cursor is in the first row of a table
function isInFirstRow(editor: Editor): boolean {
	const { selection } = editor.state;
	const $pos = selection.$anchor;

	// Walk up to find the table and row
	for (let depth = $pos.depth; depth > 0; depth--) {
		const node = $pos.node(depth);
		if (node.type.name === "tableRow") {
			const parentDepth = depth - 1;
			const parent = $pos.node(parentDepth);
			if (parent.type.name === "table") {
				const rowIndex = $pos.index(parentDepth);
				return rowIndex === 0;
			}
		}
	}
	return false;
}

// Helper to convert cells in a row to header (th) or data (td) cells
function convertRowCells(editor: Editor, rowIndex: number, toHeader: boolean): void {
	const { state } = editor;
	const { doc, schema } = state;

	// Find the table
	let tablePos: number | null = null;
	doc.descendants((node, pos) => {
		if (node.type.name === "table" && tablePos === null) {
			// Check if this is the active table
			const { selection } = state;
			if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
				tablePos = pos;
				return false;
			}
		}
		return true;
	});

	if (tablePos === null) return;

	const table = doc.nodeAt(tablePos);
	if (!table) return;

	// Get the target row
	let currentRowIndex = 0;
	let rowPos: number | null = null;

	table.forEach((row, offset) => {
		if (currentRowIndex === rowIndex) {
			rowPos = tablePos! + 1 + offset;
		}
		currentRowIndex++;
	});

	if (rowPos === null) return;

	const row = doc.nodeAt(rowPos);
	if (!row) return;

	// Convert each cell in the row
	const targetType = toHeader ? schema.nodes.tableHeader : schema.nodes.tableCell;
	const tr = state.tr;

	let cellOffset = 0;
	row.forEach((cell, offset) => {
		const cellPos = rowPos! + 1 + offset;
		if (cell.type.name !== targetType.name) {
			tr.setNodeMarkup(cellPos, targetType, cell.attrs);
		}
		cellOffset += cell.nodeSize;
	});

	if (tr.docChanged) {
		editor.view.dispatch(tr);
	}
}

export function useTableOperations(editor: Editor | null) {
	const [tableContextMenu, setTableContextMenu] = useState<TableContextMenu>({
		visible: false,
		position: { x: 0, y: 0 },
	});

	const handleDeleteTable = useCallback(() => {
		if (!editor) {
			return;
		}
		editor.chain().focus().deleteTable().run();
		setTableContextMenu({ visible: false, position: { x: 0, y: 0 } });
	}, [editor]);

	const handleAddRowAbove = useCallback(() => {
		if (!editor) {
			return;
		}

		const wasInFirstRow = isInFirstRow(editor);

		editor.chain().focus().addRowBefore().run();

		// If we were in the first row, we need to fix cell types
		// New row (now first) should be header, old first row should be data
		if (wasInFirstRow) {
			setTimeout(() => {
				convertRowCells(editor, 0, true);  // New first row -> header
				convertRowCells(editor, 1, false); // Old first row -> data
			}, 0);
		}

		setTableContextMenu({ visible: false, position: { x: 0, y: 0 } });
	}, [editor]);

	const handleAddRowBelow = useCallback(() => {
		if (!editor) {
			return;
		}
		editor.chain().focus().addRowAfter().run();
		setTableContextMenu({ visible: false, position: { x: 0, y: 0 } });
	}, [editor]);

	const handleAddColumnLeft = useCallback(() => {
		if (!editor) {
			return;
		}
		editor.chain().focus().addColumnBefore().run();
		setTableContextMenu({ visible: false, position: { x: 0, y: 0 } });
	}, [editor]);

	const handleAddColumnRight = useCallback(() => {
		if (!editor) {
			return;
		}
		editor.chain().focus().addColumnAfter().run();
		setTableContextMenu({ visible: false, position: { x: 0, y: 0 } });
	}, [editor]);

	const handleDeleteRow = useCallback(() => {
		if (!editor) {
			return;
		}

		const wasInFirstRow = isInFirstRow(editor);

		editor.chain().focus().deleteRow().run();

		// If we deleted the first row, convert new first row to header
		if (wasInFirstRow) {
			setTimeout(() => {
				convertRowCells(editor, 0, true);
			}, 0);
		}

		setTableContextMenu({ visible: false, position: { x: 0, y: 0 } });
	}, [editor]);

	const handleDeleteColumn = useCallback(() => {
		if (!editor) {
			return;
		}
		editor.chain().focus().deleteColumn().run();
		setTableContextMenu({ visible: false, position: { x: 0, y: 0 } });
	}, [editor]);

	const handleTableContextMenu = useCallback(
		(e: React.MouseEvent) => {
			if (!editor?.isActive("table")) {
				return;
			}

			e.preventDefault();

			// Calculate position with boundary check
			const menuWidth = 180;
			const menuHeight = 280;
			const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
			const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

			setTableContextMenu({
				visible: true,
				position: { x, y },
			});
		},
		[editor],
	);

	const closeTableContextMenu = useCallback(() => {
		setTableContextMenu({ visible: false, position: { x: 0, y: 0 } });
	}, []);

	return {
		tableContextMenu,
		handleDeleteTable,
		handleAddRowAbove,
		handleAddRowBelow,
		handleAddColumnLeft,
		handleAddColumnRight,
		handleDeleteRow,
		handleDeleteColumn,
		handleTableContextMenu,
		closeTableContextMenu,
	};
}
