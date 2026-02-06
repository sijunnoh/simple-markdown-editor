import { describe, it, expect } from "vitest";
import { turndown } from "./setup";

describe("turndown task list rule", () => {
	it("should convert unchecked task item", () => {
		const html = `
			<ul data-type="taskList">
				<li data-type="taskItem">
					<input type="checkbox">
					<span>Task content</span>
				</li>
			</ul>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("- [ ]");
	});

	it("should convert checked task item", () => {
		const html = `
			<ul data-type="taskList">
				<li data-type="taskItem">
					<input type="checkbox" checked>
					<span>Done task</span>
				</li>
			</ul>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("- [x]");
	});

	it("should convert task item with data-checked attribute (TipTap format)", () => {
		const html = `
			<ul data-type="taskList">
				<li data-type="taskItem" data-checked="true">
					<label><input type="checkbox"><span></span></label>
					<div>Checked task</div>
				</li>
			</ul>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("- [x]");
		expect(result).toContain("Checked task");
	});

	it("should convert unchecked task item with data-checked attribute (TipTap format)", () => {
		const html = `
			<ul data-type="taskList">
				<li data-type="taskItem" data-checked="false">
					<label><input type="checkbox"><span></span></label>
					<div>Unchecked task</div>
				</li>
			</ul>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("- [ ]");
		expect(result).toContain("Unchecked task");
	});

	it("should convert GFM/marked format task list (unchecked)", () => {
		const html = `
			<ul>
				<li><input type="checkbox" disabled> Buy groceries</li>
			</ul>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("- [ ]");
		expect(result).toContain("Buy groceries");
	});

	it("should convert GFM/marked format task list (checked)", () => {
		const html = `
			<ul>
				<li><input type="checkbox" checked disabled> Completed task</li>
			</ul>
		`;
		const result = turndown.turndown(html);

		expect(result).toContain("- [x]");
		expect(result).toContain("Completed task");
	});
});
