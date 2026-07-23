import { afterEach, beforeAll, describe, expect, it, vi } from "bun:test";
import { KeybindingsManager } from "@oh-my-pi/pi-coding-agent/config/keybindings";
import {
	CommandPaletteComponent,
	type CommandPaletteEntry,
} from "@oh-my-pi/pi-coding-agent/modes/components/command-palette";
import { initTheme } from "@oh-my-pi/pi-coding-agent/modes/theme/theme";
import { setKeybindings } from "@oh-my-pi/pi-tui";

/**
 * The palette's contract: entries render into a searchable SelectList; typing
 * narrows to the matching entry and confirming runs exactly that entry's
 * `run()` (the seam the SelectorController wires to slash-command submission or
 * a selector). An empty entry set degrades to a dismissible placeholder.
 */

beforeAll(() => {
	initTheme();
});

afterEach(() => {
	setKeybindings(KeybindingsManager.inMemory());
});

// More than the palette's internal maxVisible so SelectList enables
// type-to-filter (its search is gated on items.length > maxVisible).
function fillerEntries(): CommandPaletteEntry[] {
	const entries: CommandPaletteEntry[] = [];
	for (let index = 0; index < 12; index++) {
		entries.push({ id: `filler-${index}`, label: `filler ${index}`, run: vi.fn() });
	}
	return entries;
}

describe("CommandPaletteComponent", () => {
	it("filters by typed query and runs the matching entry on confirm", () => {
		setKeybindings(KeybindingsManager.inMemory());
		const zetaRun = vi.fn();
		const entries = fillerEntries();
		entries.push({ id: "zeta", label: "zeta unique action", run: zetaRun });

		const palette = new CommandPaletteComponent(entries, () => {});
		const list = palette.getSelectList();
		for (const char of "zeta") {
			list.handleInput(char);
		}

		expect(list.getSelectedItem()?.value).toBe("zeta");

		list.handleInput("\n");

		expect(zetaRun).toHaveBeenCalledTimes(1);
	});

	it("runs the no-arg slash entry's submit path on confirm", () => {
		setKeybindings(KeybindingsManager.inMemory());
		const submit = vi.fn();
		const entries = fillerEntries();
		// Mirrors the SelectorController slash entry for a no-arg command: run()
		// closes the palette and submits the command text through the editor.
		entries.push({
			id: "slash:login",
			label: "/login",
			run: () => submit("/login"),
		});

		const palette = new CommandPaletteComponent(entries, () => {});
		const list = palette.getSelectList();
		for (const char of "login") {
			list.handleInput(char);
		}
		list.handleInput("\n");

		expect(submit).toHaveBeenCalledWith("/login");
	});

	it("renders a dismissible placeholder when there are no entries", () => {
		setKeybindings(KeybindingsManager.inMemory());
		const onCancel = vi.fn();
		const palette = new CommandPaletteComponent([], onCancel);

		expect(palette.render(80).join("\n")).toContain("No commands available");

		palette.getSelectList().handleInput("\x1b");
		expect(onCancel).toHaveBeenCalledTimes(1);
	});
});
