import { Trash2Icon } from "lucide-react";
import type { TableMenuState } from "../../../types";

interface TableFloatingMenuProps {
	tableMenu: TableMenuState;
	onDeleteTable: () => void;
}

export function TableFloatingMenu({
	tableMenu,
	onDeleteTable,
}: TableFloatingMenuProps) {
	if (!tableMenu.visible) return null;

	return (
		<div
			className="table-floating-menu"
			style={{
				position: "fixed",
				left: tableMenu.position.x,
				top: tableMenu.position.y,
			}}
		>
			<button
				className="table-menu-btn"
				onMouseDown={(e) => {
					e.preventDefault();
					onDeleteTable();
				}}
				title="Delete table"
			>
				<Trash2Icon size={14} />
			</button>
		</div>
	);
}
