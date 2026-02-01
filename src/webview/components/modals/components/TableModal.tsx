import { Modal } from "./Modal";

interface TableModalProps {
	isOpen: boolean;
	onClose: () => void;
	tableRows: string;
	setTableRows: (rows: string) => void;
	tableCols: string;
	setTableCols: (cols: string) => void;
	onSubmit: () => void;
}

export function TableModal({
	isOpen,
	onClose,
	tableRows,
	setTableRows,
	tableCols,
	setTableCols,
	onSubmit,
}: TableModalProps) {
	return (
		<Modal isOpen={isOpen} title="Insert Table" onClose={onClose}>
			<div className="modal-form">
				<label>
					<span>Rows</span>
					<input
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={tableRows}
						onChange={(e) => {
							const val = e.target.value.replace(/[^0-9]/g, "");
							setTableRows(val);
						}}
						onBlur={(e) => {
							const num = parseInt(e.target.value, 10);
							if (isNaN(num) || num < 1) {
								setTableRows("1");
							} else if (num > 20) {
								setTableRows("20");
							}
						}}
						autoFocus
					/>
				</label>
				<label>
					<span>Columns</span>
					<input
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={tableCols}
						onChange={(e) => {
							const val = e.target.value.replace(/[^0-9]/g, "");
							setTableCols(val);
						}}
						onBlur={(e) => {
							const num = parseInt(e.target.value, 10);
							if (isNaN(num) || num < 1) {
								setTableCols("1");
							} else if (num > 10) {
								setTableCols("10");
							}
						}}
					/>
				</label>
				<div className="modal-actions">
					<button className="modal-btn-secondary" onClick={onClose}>
						Cancel
					</button>
					<button className="modal-btn-primary" onClick={onSubmit}>
						Insert
					</button>
				</div>
			</div>
		</Modal>
	);
}
