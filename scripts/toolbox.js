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

(() => {

const toolbox = {
	tools: {
		update: {},
		draw: {}
	},
	dialog: null,
	error: null
};
this.global.toolbox = toolbox;

const ui = require("ui-lib/library");
const editor = require("modding-toolbox/editor");
const settings = require("settings");
const shaders = require("shaders");

const showError = msg => {
	Log.err(msg);

	const err = toolbox.error;
	err.message(msg);
	err.show();
};
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

const buildError = () => {
	const dialog = extendContent(FloatingDialog, "$toolbox.error", {
		message(msg) {
			this.cont.cells.get(1).get().text = msg;
		}
	});

	const cont = dialog.cont;
	cont.add("$error.title");
	cont.row();
	cont.add("Success").grow().get().wrap = true;

	dialog.addCloseButton();
	return dialog;
};

const buildTool = (cont, name) => {
	const tool = toolbox.tools[name];
	const t = cont.table().get();
	t.defaults().padRight(4);

	t.addImageTextButton("$toolbox." + name, Icon.pencil, 48, run(() => {
		editor.select(script => {
			tool.script = script;
			Core.settings.putSave("toolbox.tool." + name + ".script", script);
		});
	})).width(200).height(48);

	t.addImageButton(Icon.ok, 48, run(() => {
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
	})).size(48);

	t.addImageButton(Icon.cancel, 48, run(() => {
		tool.func = null;
	})).size(48);
};

const buildToolbox = () => {
	const dialog = new FloatingDialog("$toolbox");
	const t = dialog.cont;
	t.defaults().width(300).height(64);

	editor.build();
	editor.add(t);
	t.row();

	settings.build();
	settings.add(t);
	t.row();

	shaders.build();
	shaders.add(t);
	t.row();

	buildTool(t, "update");
	t.row();
	buildTool(t, "draw");

	dialog.addCloseButton();
	return dialog;
};

ui.onLoad(() => {
	editor.load();
	shaders.load();
	for (var i in toolbox.tools) {
		const script = Core.settings.get("toolbox.tool." + i + ".script", null);
		toolbox.tools[i].script = script;
	}

	toolbox.error = buildError();
	toolbox.dialog = buildToolbox();
});

ui.addButton("toolbox", "wrench", () => {
	toolbox.dialog.show();
});

/*ui.addTable("menu", "toolbox", t => {
	t.addImageTextButton("$toolbox", Icon.wrench, run(() => {
		toolbox.dialog.show();
	}));
});
*/

/* Function tools */
ui.addEffect((w, h) => {
	if (!Vars.state.isPaused()) {
		pcall("update");
	}

	pcall("draw", w, h);
});

})();
