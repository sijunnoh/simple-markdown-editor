import type { TableContextMenu as TableContextMenuState } from "../../../types";

interface TableContextMenuProps {
	tableContextMenu: TableContextMenuState;
	onClose: () => void;
	onAddRowAbove: () => void;
	onAddRowBelow: () => void;
	onAddColumnLeft: () => void;
	onAddColumnRight: () => void;
	onDeleteRow: () => void;
	onDeleteColumn: () => void;
	onDeleteTable: () => void;
}

export function TableContextMenu({
	tableContextMenu,
	onClose,
	onAddRowAbove,
	onAddRowBelow,
	onAddColumnLeft,
	onAddColumnRight,
	onDeleteRow,
	onDeleteColumn,
	onDeleteTable,
}: TableContextMenuProps) {
	if (!tableContextMenu.visible) return null;

	return (
		<>
			<div className="table-context-menu-overlay" onClick={onClose} />
			<div
				className="table-context-menu"
				style={{
					position: "fixed",
					left: tableContextMenu.position.x,
					top: tableContextMenu.position.y,
				}}
			>
				<button onClick={onAddRowAbove}>Insert row above</button>
				<button onClick={onAddRowBelow}>Insert row below</button>
				<div className="context-menu-divider" />
				<button onClick={onAddColumnLeft}>Insert column left</button>
				<button onClick={onAddColumnRight}>Insert column right</button>
				<div className="context-menu-divider" />
				<button onClick={onDeleteRow}>Delete row</button>
				<button onClick={onDeleteColumn}>Delete column</button>
				<div className="context-menu-divider" />
				<button onClick={onDeleteTable} className="danger">
					Delete table
				</button>
			</div>
		</>
	);
}
