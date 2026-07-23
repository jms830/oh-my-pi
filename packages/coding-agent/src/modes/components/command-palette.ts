/**
 * Command palette: a single searchable list of high-value app actions plus every
 * available slash command. Mirrors the idiomatic list-picker components
 * (theme-selector, plugin-selector): a `SelectList` framed by `DynamicBorder`
 * rules, focused via `getSelectList()` so keyboard input reaches the list
 * directly. Entry selection runs the entry's `run()`; the caller wires `run()`
 * to close the palette and dispatch the action (see SelectorController).
 */
import { Container, type SelectItem, SelectList, type SgrMouseEvent } from "@oh-my-pi/pi-tui";
import { getSelectListTheme } from "../theme/theme";
import { DynamicBorder } from "./dynamic-border";
import { routeSelectListMouseWithTopBorder } from "./select-list-mouse-routing";

export interface CommandPaletteEntry {
	readonly id: string;
	readonly label: string;
	readonly description?: string;
	readonly hint?: string;
	run(): void | Promise<void>;
}

/** maxVisible must stay below the entry count for SelectList's type-to-filter
 *  search to activate (`SelectList#canEditSearch` gates on
 *  `items.length > maxVisible`). The palette always carries the built-in slash
 *  commands plus the curated actions, so the real entry count comfortably
 *  exceeds this. */
const MAX_VISIBLE = 10;
const EMPTY_ITEM_VALUE = "__empty__";

export class CommandPaletteComponent extends Container {
	#selectList: SelectList;
	readonly #entries = new Map<string, CommandPaletteEntry>();

	constructor(entries: readonly CommandPaletteEntry[], onCancel: () => void) {
		super();
		for (const entry of entries) {
			this.#entries.set(entry.id, entry);
		}

		const items: SelectItem[] = entries.map(entry => ({
			value: entry.id,
			label: entry.label,
			description: entry.description,
			hint: entry.hint,
		}));
		if (items.length === 0) {
			items.push({
				value: EMPTY_ITEM_VALUE,
				label: "No commands available",
				description: "Press Esc to close",
			});
		}

		this.addChild(new DynamicBorder());
		this.#selectList = new SelectList(items, MAX_VISIBLE, getSelectListTheme(), {
			overflowSearch: true,
			wrapDescription: false,
		});
		this.#selectList.onSelect = item => {
			const entry = this.#entries.get(item.value);
			if (entry) {
				void entry.run();
			}
		};
		this.#selectList.onCancel = onCancel;
		this.addChild(this.#selectList);
		this.addChild(new DynamicBorder());
	}

	getSelectList(): SelectList {
		return this.#selectList;
	}

	routeMouse(event: SgrMouseEvent, line: number, col: number): void {
		routeSelectListMouseWithTopBorder(this.#selectList, event, line, col);
	}
}
