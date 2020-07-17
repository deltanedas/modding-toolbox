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

const ui = require("ui-lib/library");

const toolbox = {
	tools: {
		update: null,
		draw: null
	},
	dialog: null,
	error: null
};

// Strings to save as toolbox.tool.<key>
const saving = {};

const saveSource = (name, source) => {
	Core.settings.put("toolbox.tools." + name, source);
	Core.settings.save();
};

const showError = msg => {
	Log.err(msg);

	const err = toolbox.error;
	err.message(msg);
	err.show();
};

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
	cont.add("Success");

	dialog.addCloseButton();
	return dialog;
};

const addTool = (t, name) => {
	const dialog = toolbox.tools[name].dialog;
	t.addImageTextButton("$toolbox." + name, Icon.pencil, 48, run(() => {
		dialog.show();
	})).width(200).height(48);
};

const buildToolbox = () => {
	const dialog = new FloatingDialog("$toolbox");
	const t = dialog.cont;
	t.defaults().width(300).height(64);

	addTool(t, "update");
	t.row();
	addTool(t, "draw");

	dialog.addCloseButton();
	return dialog;
};

const buildFunc = name => {
	const dialog = new FloatingDialog("$toolbox." + name);
	const cont = dialog.cont;
	const tool = {
		dialog: dialog,
		func: null,
		source: Core.settings.get("toolbox.tools." + name, "<code>")
	};

	cont.addImage().width(375).color(Pal.stat).height(4);
	cont.row();
	cont.addArea(tool.source, cons(text => {
		tool.source = text;
	})).width(350).height(200);

	dialog.addCloseButton();
	dialog.buttons.addImageButton(Icon.ok, 48, run(() => {
		try {
			eval("tool.func = (w, h) => {\n" + tool.source + "}");
			saveSource(name, tool.source);
		} catch (e) {
			showError("Failed to compile " + name + " function: " + e);
		}
	}));
	dialog.buttons.addImageButton(Icon.cancel, 48, run(() => {
		tool.func = null;
	}));

	return tool;
};

ui.onLoad(() => {
	const tools = toolbox.tools;
	tools.update = buildFunc("update");
	tools.draw = buildFunc("draw");

	toolbox.error = buildError();
	toolbox.dialog = buildToolbox();
});

ui.addButton("toolbox", "wrench", () => {
	toolbox.dialog.show();
});


/* Function tools */
ui.addEffect((w, h) => {
	if (!Vars.state.isPaused()) {
		pcall("update");
	}

	pcall("draw", w, h);
});

})();
