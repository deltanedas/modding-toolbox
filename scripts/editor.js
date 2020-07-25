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

/* Script editor */

(() => {

const editor = {
	defaultScript: "print(\"praise the cat god\");",
	// Source of script that hasn't been saved yet
	current: null,
	// Name of current script
	script: null,
	scripts: {},

	dialog: null,
	selectionDialog: null
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
	const names = Core.settings.get("toolbox.scripts", "").split(",");
	editor.script = names[0];

	/* Load each script */
	for (var i in names) {
		var name = names[i];
		var script = s.get("toolbox.scripts." + name, editor.defaultScript);
		editor.scripts[name] = script;
	}
};

editor.build = () => {
	const d = new FloatingDialog("$toolbox.script-editor");
	editor.dialog = d;
	const t = d.cont;

	var setScript, rebuildScripts, scripts;

	/** Editor itself **/
	const ed = t.table().grow().left().get();

	/* Script title */
	const title = ed.addField("", cons(text => {
		// Script list is split on commas
		text = text.replace(",", "");
		title.text = text;

		const src = editor.scripts[editor.script];
		delete editor.scripts[editor.script];

		editor.scripts[text] = src;
		editor.script = text;

		// save scrollX of sel.cells.get(0).get() here
		rebuildScripts();
	})).growX().get();
	title.alignment = Align.center;
	title.style = new TextField.TextFieldStyle(title.style);

	ed.row();

	/* Script source code */
	const source = ed.addArea("", cons(text => {
		editor.current = text;
		title.style.background = Tex.underlineRed;
	})).grow().get();

	/* TextArea can't get newlines on Android, use the native text input. */
	if (Vars.mobile) {
		source.update(run(() => {
			if (Core.scene.keyboardFocus == source) {
				Core.scene.keyboardFocus = null;

				const input = new Input.TextInput;
				input.multiline = true;
				input.title = editor.script;
				input.text = editor.current || editor.scripts[editor.script];
				// Max unsigned short - 1, if someone really needs it
				input.maxLength = 65564;

				input.accepted = cons(text => {
					editor.current = text;
					title.style.background = Tex.underlineRed;
					source.text = text.replace("\n", "\r");
				});

				Core.input.getTextInput(input);
			}
		}));
	}

	setScript = name => {
		editor.current = null;
		editor.script = name;
		if (name) {
			// For some reason TextField/Area use \r for line breaks
			source.text = editor.scripts[name].replace("\n", "\r");
			title.text = name;
		} else {
			source.text = "do it :)";
			title.text = "Create a script!";
		}
	};
	setScript(editor.script);

	/** Script selection **/
	const side = t.table().growY().width(210).right().padLeft(50).get();

	/* Script list */
	side.pane(cons(t => {
		scripts = t;

		addScriptButton = name => {
			scripts.addButton(name, run(() => {
				setScript(name);
			})).width(200).right();
			scripts.row();
		};

		rebuildScripts = () => {
			scripts.clear();

			for (var name in editor.scripts) {
				addScriptButton(name);
			}

			Core.settings.putSave("toolbox.scripts",
				Object.keys(editor.scripts).join(","));
		};
		rebuildScripts();
	})).growY().width(200).top().right().padBottom(12);
	side.row();

	/* Add a new script */
	side.addImageTextButton("$toolbox.add-script", Icon.pencil, run(() => {
		const name = "Script #" + (Object.keys(editor.scripts).length + 1);
		editor.scripts[name] = editor.defaultScript;
		rebuildScripts(name);
	})).growX();
	side.row();

	/* Delete a script */
	side.addImageTextButton("$toolbox.remove-script", Icon.trash, run(() => {
		delete editor.scripts[editor.script];
		setScript(Object.keys(editor.scripts)[0]);
		rebuildScripts();
	})).growX();

	/* Buttons */
	d.addCloseButton();

	d.buttons.addImageTextButton("$save", Icon.save, run(() => {
		if (!editor.current) return;

		Core.settings.putSave("toolbox.scripts." + editor.script, editor.current);
		title.style.background = Tex.underline;

		editor.scripts[editor.script] = editor.current;
		editor.current = null;

		Vars.ui.showInfoToast("Saved script " + editor.script, 5);
	}));

	editor.buildSelection();

	return d;
};

editor.buildSelection = () => {
	const d = extendContent(FloatingDialog, "$toolbox.select-script", {
		set(func) {
			func = run(func);

			d.cont.clear();
			d.cont.pane(cons(t => {
				for (var name in editor.scripts) {
					t.addButton(name, func).growX().height(32);
					t.row();
				}
			})).growY().width(300);
		}
	});

	d.addCloseButton();
	editor.selectionDialog = d;
};

editor.add = t => {
	t.addButton("$toolbox.script-editor", run(() => {
		editor.dialog.show();
	})).padBottom(16);
};

module.exports = editor;

})();
