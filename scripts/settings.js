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

/* Settings viewer */

const settings = {
	dialog: null
};

settings.build = () => {
	const d = extendContent(BaseDialog, "$toolbox.settings-editor", {
		load() {
			this.cont.clear();

			this.cont.add("$toolbox.settings-warning").center().top();
			this.cont.row();

			var settings;

			const addSetting = key => {
				const cell = settings.table().growX().height(48).left().name(key);
				const setting = cell.get();
				setting.defaults().left().padLeft(5);

				setting.add("Key: " + key);
				setting.add("Value: " + Core.settings.get(key, null));
				setting.button(Icon.trash, () => {
					Core.settings.remove(key);
					settings.cells.remove(cell, true);
				});
				settings.row();
			};

			this.cont.pane(t => {
				const keys = Core.settings.keys();
				settings = t;
				keys.forEach(key => {
					addSetting(key);
				});
			}).grow().left().top();

			this.cont.row();

			/* Set a value */
			const set = this.cont.table().bottom().growX().get();
			var key, value;
			set.field("key", text => {
				key = text;
			}).left().width(200);

			set.field("value", text => {
				value = text;
			}).left().width(100);

			set.button(Icon.ok, () => {
				Core.settings.put(key, value);

				/* Update the value in the table */
				const found = settings.cells.find(cell => {
					return cell.get().name == key
				});
				if (found) {
					found.get().cells.get(1).get().text = "Value: [green]" + value;
				} else {
					addSetting(key);
				}
			});
		}
	});

	d.addCloseButton();
	d.button("$save", Icon.save, () => {
		Core.settings.manualSave();
		Vars.ui.showInfoToast("Saved!", 5);
	}).left();
	return d;
};

settings.add = t => {
	t.button("$toolbox.settings-editor", Icon.settings, () => {
		settings.dialog.load();
		settings.dialog.show();
	});
};

settings.load = () => {};

module.exports = settings;
