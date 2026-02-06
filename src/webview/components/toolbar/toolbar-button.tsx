import React from "react";

interface ToolbarButtonProps {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	active?: boolean;
}

export function ToolbarButton({
	icon,
	label,
	onClick,
	active,
}: ToolbarButtonProps) {
	return (
		<button
			title={label}
			onMouseDown={(e) => {
				e.preventDefault(); // Prevent losing focus
				onClick();
			}}
			className={active ? "active" : ""}
		>
			{icon}
		</button>
	);
}
