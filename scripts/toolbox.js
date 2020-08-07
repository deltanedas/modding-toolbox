/*
	Copyright (c) DeltaNedas 2020

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const toolbox = {
	tools: {
		update: {},
		draw: {}
	},
	dialog: null
};
this.global.toolbox = toolbox;

const ui = require("ui-lib/library");
const menus = [
	require("modding-toolbox/editor"),
	require("settings"),
	require("shaders"),
	require("uieditor")
];

const editor = menus[0];

const showError = ui.showError;
toolbox.showError = showError;

/* Call the function and show any errors */
const pcall = (name, w, h) => {
	const tool = toolbox.tools[name];
	try {
		if (tool.func) tool.func(w, h);
	} catch (e) {
		showError("Caught error for " + name + ": " + e);
		tool.func = null;
	}
};

const buildTool = (cont, name) => {
	const tool = toolbox.tools[name];
	const t = cont.table().get();
	t.defaults().padRight(4);

	t.button("$toolbox." + name, Icon.pencil, 48, () => {
		editor.select(script => {
			tool.script = script;
			Core.settings.putSave("toolbox.tool." + name + ".script", script);
		});
	}).width(200).height(48);

	t.button(Icon.ok, 48, () => {
		if (tool.script == null) {
			return showError("Specify a script.");
		}

		if (!editor.scripts[tool.script]) {
			return showError("Script '" + tool.script + "' does not exist.");
		}

		try {
			eval("tool.func = (w, h) => {\n" + editor.scripts[tool.script] + "}");
		} catch (e) {
			showError("Failed to compile script '" + tool.script + "': " + e);
		}
	}).size(48);

	t.button(Icon.cancel, 48, () => {
		tool.func = null;
	}).size(48);
};

const buildToolbox = () => {
	const dialog = new BaseDialog("$toolbox");
	var t;
	dialog.cont.pane(table => {
		t = table;
	}).width(400).height(350);
	t.defaults().width(300).height(64);

	for (var i in menus) {
		menus[i].dialog = menus[i].build();
		menus[i].add(t);
		t.row();
	}

	t.cells.peek().padBottom(16);

	buildTool(t, "update");
	t.row();
	buildTool(t, "draw");

	dialog.addCloseButton();
	return dialog;
};

ui.onLoad(() => {
	for (var i in menus) {
		menus[i].load();
	}

	for (var i in toolbox.tools) {
		const script = Core.settings.get("toolbox.tool." + i + ".script", null);
		toolbox.tools[i].script = script;
	}

	toolbox.dialog = buildToolbox();
});

ui.addButton("toolbox", "wrench", () => {
	toolbox.dialog.show();
});

ui.addMenuButton("$toolbox", "wrench", () => {
	toolbox.dialog.show();
});

/* Function tools */
ui.addEffect((w, h) => {
	if (!Vars.state.isPaused()) {
		pcall("update");
	}

	pcall("draw", w, h);
}, () => true);
