/*
	Copyright (c) DeltaNedas 2020

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.	If not, see <https://www.gnu.org/licenses/>.
*/

/* Script editor */

(() => {

const ui = this.global.ui;

if (this.global.toolbox.editor) {
	module.exports = this.global.toolbox.editor;
	return;
}

const editor = {
	defaultScript: "print(\"praise the cat god\");",
	// Name of current script
	script: null,
	scripts: {},

	dialog: null,
	selectionDialog: null
};
this.global.toolbox.editor = editor;

var source, title;

editor.setScript = name => {
	editor.script = name;

	source.text = editor.scripts[name];
	title.text = name;
};

editor.addScript = source => {
	const name = "Script #" + (Object.keys(editor.scripts).length + 1);
	editor.scripts[name] = source;
	editor.rebuildScripts(name);
	editor.setScript(name);
};

editor.editScript = to => {
	editor.scripts[editor.script] = to;
	Core.settings.put("toolbox.scripts." + editor.script, to);
};

editor.load = () => {
	const s = Core.settings;

	/* Load defaults */
	if (!s.has("toolbox.scripts")) {
		editor.script = "Script #1";
		editor.scripts[editor.script] = editor.defaultScript;
		return;
	}

	/* Load script names */
	const names = s.get("toolbox.scripts", "").split(",");
	editor.script = names[names.length - 1];

	/* Load each script */
	for (var i in names) {
		var name = names[i];
		var script = s.get("toolbox.scripts." + name, editor.defaultScript);
		editor.scripts[name] = script;
	}
};

/* Copy the script to the clipboard in a rhino long string (array of lines)
	 Useful for shaders in 5.0. */
editor.copy = () => {
	const lines = editor.scripts[editor.script].split("\n");
	/* Sanitise each line */
	for (var i in lines) {
		var escaped = lines[i]
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"');
		lines[i] = '"' + escaped + '"';
	}

	Core.app.clipboardText = "[\n\t" + lines.join(",\n\t") + "\n].join(\"\\n\")";
	Vars.ui.showInfoToast("Copied to clipboard", 5);
};

editor.build = () => {
	const d = new BaseDialog("$toolbox.script-editor");
	const t = d.cont;

	var addScriptButton;
	var scripts;

	/** Editor itself **/
	const ed = t.table().grow().left().get();

	/* Script's title */
	title = ed.field("", text => {
		// Script list is split on commas
		text = text.replace(/,/g, "");
		title.text = text;

		const src = editor.scripts[editor.script];
		delete editor.scripts[editor.script];

		editor.scripts[text] = src;
		editor.script = text;

		// save scrollX of sel.cells.get(0).get() here?
		editor.rebuildScripts();
	}).growX().get();
	title.alignment = Align.center;

	ed.row();

	/* Script source code */
	source = ed.area("", text => {
		editor.editScript(text);
	}).grow().get();

	ui.mobileAreaInput(source, text => {
		editor.editScript(text)
	}, () => {
		return {
			title: editor.script,
			text: editor.scripts[editor.script],
			// Max unsigned short - 1, if someone really needs it
			maxLength: 65564
		};
	});

	editor.setScript(editor.script);

	/** Script selection **/
	const side = t.table().growY().width(210).right().padLeft(50).get();
	side.defaults().pad(5);

	/* Script list */
	side.pane(t => {
		scripts = t;

		addScriptButton = name => {
			scripts.button(name, () => {
				editor.setScript(name);
			}).growX().pad(4).right()
				.get().getLabel().alignment = Align.left;
			scripts.row();
		};

		editor.rebuildScripts = () => {
			scripts.clear();

			for (var name in editor.scripts) {
				addScriptButton(name);
			}

			Core.settings.put("toolbox.scripts",
				Object.keys(editor.scripts).join(","));
		};
		editor.rebuildScripts();
	}).growY().width(200).top().right().padBottom(12);

	side.row();
	const buttons = side.table().center().get();
	buttons.defaults().pad(5);

	/* Add a new script */
	buttons.button(Icon.pencil, 24, () => {
		editor.addScript(editor.defaultScript);
	});

	/* Delete a script, just clear this one if its the last */
	buttons.button(Icon.trash, 24, () => {
		if (Object.keys(editor.scripts).length == 1) {
			editor.scripts[editor.script] = "";
			return editor.setScript(editor.script);
		}

		delete editor.scripts[editor.script];
		editor.setScript(Object.keys(editor.scripts)[0]);
		editor.rebuildScripts();
	});

	/* Bottom buttons */
	d.addCloseButton();
	d.buttons.button("$toolbox.run", Icon.play, () => {
		try {
			eval(editor.scripts[editor.script]);
		} catch (e) {
			ui.showError("Failed to run script '" + editor.script + "'", e);
		}
	});

	/* Dump the script to a "multiline string" for mindustry. */
	d.buttons.button("$toolbox.export", Icon.export, () => {
		editor.copy();
	});

	d.hidden(() => Core.settings.manualSave());

	editor.buildSelection();
	return d;
};

editor.buildSelection = () => {
	const d = extendContent(BaseDialog, "$toolbox.select-script", {
		set(func) {
			d.cont.clear();
			d.cont.pane(t => {
				for (var name in editor.scripts) {
					this.addbutton(t, func, name);
				}
			}).growY().width(300);
		},

		addbutton(t, func, name) {
			t.button(name, () => {
				func(name);
				this.hide();
			}).growX().height(48).padBottom(5);
			t.row();
		}
	});

	d.addCloseButton();
	editor.selectionDialog = d;
};

editor.select = func => {
	editor.selectionDialog.set(func);
	editor.selectionDialog.show();
};

editor.add = t => {
	t.button("$toolbox.script-editor", () => {
		editor.dialog.show();
	});
};

module.exports = editor;

})();
