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

const ui = this.global.uiLib;

if (this.global.toolbox.editor) {
	return this.global.toolbox.editor;
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
   Useful for shaders. */
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
	const d = new FloatingDialog("$toolbox.script-editor");
	editor.dialog = d;
	const t = d.cont;

	var setScript, editScript, rebuildScripts;
	var scripts;

	/** Editor itself **/
	const ed = t.table().grow().left().get();

	/* Script title */
	const title = ed.addField("", cons(text => {
		// Script list is split on commas
		text = text.replace(/,/g, "");
		title.text = text;

		const src = editor.scripts[editor.script];
		delete editor.scripts[editor.script];

		editor.scripts[text] = src;
		editor.script = text;

		// save scrollX of sel.cells.get(0).get() here?
		rebuildScripts();
	})).growX().get();
	title.alignment = Align.center;

	ed.row();

	/* Script source code */
	const source = ed.addArea("", cons(text => {
		editScript(text);
	})).grow().get();

	ui.mobileAreaInput(source, text => {
		editScript(text)
	}, () => {
		return {
			title: editor.script,
			text: editor.scripts[editor.script],
			// Max unsigned short - 1, if someone really needs it
			maxLength: 65564

		};
	});

	editScript = to => {
		editor.scripts[editor.script] = to;
		Core.settings.put("toolbox.scripts." + editor.script, to);
	};

	setScript = name => {
		editor.script = name;

		// For some reason TextField/Area use \r for line breaks
		source.text = editor.scripts[name].replace(/\n/g, "\r");
		title.text = name;
	};
	setScript(editor.script);

	/** Script selection **/
	const side = t.table().growY().width(210).right().padLeft(50).get();
	side.defaults().pad(5);

	/* Script list */
	side.pane(cons(t => {
		scripts = t;

		addScriptButton = name => {
			scripts.addButton(name, run(() => {
				setScript(name);
			})).growX().pad(4).right()
				.get().getLabel().alignment = Align.left;
			scripts.row();
		};

		rebuildScripts = () => {
			scripts.clear();

			for (var name in editor.scripts) {
				addScriptButton(name);
			}

			Core.settings.put("toolbox.scripts",
				Object.keys(editor.scripts).join(","));
		};
		rebuildScripts();
	})).growY().width(200).top().right().padBottom(12);

	side.row();
	side.table(cons(buttons => {
		buttons.defaults().pad(5);

		/* Add a new script */
		buttons.addImageButton(Icon.pencil, 24, run(() => {
			const name = "Script #" + (Object.keys(editor.scripts).length + 1);
			editor.scripts[name] = editor.defaultScript;
			rebuildScripts(name);
			setScript(name);
		}));

		/* Delete a script, just clear this one if its the last */
		buttons.addImageButton(Icon.trash, 24, run(() => {
			if (Object.keys(editor.scripts).length == 1) {
				editor.scripts[editor.script] = "";
				return setScript(editor.script);
			}

			delete editor.scripts[editor.script];
			setScript(Object.keys(editor.scripts)[0]);
			rebuildScripts();
		}));
	})).center();

	/* Bottom buttons */
	d.addCloseButton();
	d.buttons.addImageTextButton("$toolbox.run", Icon.play, run(() => {
		try {
			eval([
				"(() => {",
					"var w = Core.graphics.width;",
					"var h = Core.graphics.height;",
					editor.scripts[editor.script],
				"})();"
			].join("\n"));
		} catch (e) {
			ui.showError("Failed to run script '" + editor.script + "': " + e);
		}
	}));
	/* Dump the script to a "multiline string" for mindustry. */
	d.buttons.addImageTextButton("$toolbox.export", Icon.export, run(() => {
		editor.copy();
	}));

	d.hidden(run(() => Core.settings.save()));

	editor.buildSelection();

	return d;
};

editor.buildSelection = () => {
	const d = extendContent(FloatingDialog, "$toolbox.select-script", {
		set(func) {
			d.cont.clear();
			d.cont.pane(cons(t => {
				for (var name in editor.scripts) {
					this.button(t, func, name);
				}
			})).growY().width(300);
		},

		button(t, func, name) {
			t.addButton(name, run(() => {
				func(name);
				this.hide();
			})).growX().height(48).padBottom(5);
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
	t.addButton("$toolbox.script-editor", run(() => {
		editor.dialog.show();
	}));
};

module.exports = editor;

})();
