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

/* Settings viewer */

(() => {

const settings = {
	dialog: null
};

const consumer = method => extend(Packages.java.util.function.Consumer, {
	accept: method
});

settings.build = () => {
	const d = extendContent(FloatingDialog, "$toolbox.settings-editor", {
		load() {
			this.cont.clear();

			this.cont.add("$toolbox.settings-warning").center().top();
			this.cont.row();

			var settings;

			const addSetting = key => {
				const cell = settings.table(cons(setting => {
					setting.defaults().left().padLeft(5);

					setting.add("Key: " + key);
					setting.add("Value: " + Core.settings.get(key, null));
					setting.addImageButton(Icon.trash, run(() => {
						Core.settings.remove(key);
						settings.cells.remove(cell, true);
					}));
				})).growX().height(48).left().name(key);
				settings.row();
			};

			this.cont.pane(cons(t => {
				const keys = Core.settings.keys();
				settings = t;
				keys.forEach(consumer(key => {
					addSetting(key);
				}));
			})).grow().left().top();

			this.cont.row();

			/* Set a value */
			this.cont.table(cons(set => {
				var key, value;
				set.addField("key", cons(text => {
					key = text;
				})).left().width(200);

				set.addField("value", cons(text => {
					value = text;
				})).left().width(100);

				set.addImageButton(Icon.ok, run(() => {
					Core.settings.put(key, value);

					/* Update the value in the table */
					const found = settings.cells.find(boolf(cell => {
						return cell.get().name == key
					}));
					if (found) {
						found.get().cells.get(1).get().text = "Value: [green]" + value;
					} else {
						addSetting(key);
					}
				}));
			})).bottom().growX();
		}
	});
	settings.dialog = d;

	d.addCloseButton();
	d.addImageTextButton("$save", Icon.save, run(() => {
		Core.settings.save();
		Vars.ui.showInfoToast("Saved!", 5);
	})).left();
	return d;
};

settings.add = t => {
	t.addImageTextButton("$toolbox.settings-editor", Icon.settings, run(() => {
		settings.dialog.load();
		settings.dialog.show();
	}));
};

module.exports = settings;

})();
