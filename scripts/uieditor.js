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

const ui = global.ui;

const uieditor = {
	workspace: [],
	elements: require("elements")
};
const elements = uieditor.elements;

const editor = global.toolbox.editor;
uieditor.export = () => {
	uieditor.dialog.hide();
	const elems = [];
	for (var i in uieditor.workspace) {
		const elem = uieditor.workspace[i];
		elems[i] = elem.type.export(elem);
	}

	editor.addScript(elems.join("\n"));
	editor.show();
};

uieditor.selectElement = callback => {
	ui.select("$toolbox.uieditor.elements", Object.keys(elements), callback);
};

uieditor.selectProperty = elem => {
	const avail = [];
	for (var name in elem.type.properties) {
		if (elem.properties[name] === undefined) {
			avail.push(name);
		}
	}

	ui.select("Property for " + elem.name, avail, selected => {
		elem.properties[selected] = elem.type.properties[selected].def;
		uieditor.editElement(elem);
	});
};

uieditor.removeProp = (elem, name) => {
	return () => {
		const type = elem.type.properties[name];
		type.apply(elem, type.def);
		delete elem.properties[name];
		uieditor.editElement(elem);
	};
};

/* Menu impl */

uieditor.build = () => {
	const squarei = new ImageButton.ImageButtonStyle();
	squarei.up = squarei.checked = Tex.button;
	squarei.down = Tex.buttonDown;
	squarei.over = squarei.checkedOver = Tex.buttonOver;

	const dialog = extend(BaseDialog, "$toolbox.uieditor", {
		addElement(name) {
			const type = elements[name];
			const element = {
				name: name,
				type: type,
				cell: type.new ? preview.add(type.new()) : null,
				properties: {}
			};

			for (var i in type.defaults) {
				var pname = type.defaults[i];
				element.properties[pname] = type.properties[pname].def;
			}

			if (type.add) type.add(element, preview);

			this.apply(element);
			uieditor.workspace.push(element);
			uieditor.selected = element;
			uieditor.rebuild();
			return element;
		},

		apply(element) {
			for (var i in element.properties) {
				let value = element.properties[i];
				let type = element.type.properties[i];
				type.apply(element, value);
			}
		}
	});

	const t = dialog.cont;
	const elemw = t.table().growY().width(250).left().get();
	elemw.add("$toolbox.uieditor.elements");
	elemw.row();
	elemw.pane(elems => {
		elems.background(Tex.button);
		elems.top();
		elems.defaults().pad(6).height(32).top();

		uieditor.rebuild = () => {
			elems.clear();
			for (var i in uieditor.workspace) {
				const element = uieditor.workspace[i];
				elems.button(element.name, Styles.cleart, () => {
					uieditor.editElement(element);
				}).growX().pad(8);
				elems.row();
			}

			const buttons = new Table();
			buttons.defaults().size(48).center();
			if (i !== undefined) {
				// Separator
				elems.image().height(4).growX().color(Pal.accent).pad(16);
				elems.row();

				// Delete selected element
				buttons.button(Icon.trash, squarei, () => {
					const elem = uieditor.selected;
					uieditor.workspace.splice(uieditor.workspace.indexOf(elem), 1);
					if (elem.cell && elem.cell.get()) elem.cell.get().remove();
					uieditor.editElement(null);
					uieditor.rebuild();
				});
			}

			buttons.button(Icon.add, squarei, () => {
				uieditor.selectElement(name => {
					dialog.addElement(name);
				});
			});

			elems.add(buttons).center();
		};
	}).grow();

	const preview = t.table().grow().center().left().get();
	dialog.preview = preview;
	uieditor.rebuild();

	const propw = t.table().growY().width(350).center().right().get();
	propw.add("$toolbox.uieditor.properties");
	propw.row();
	propw.pane(props => {
		props.background(Tex.button);
		props.top();
		props.defaults().pad(4);

		uieditor.editElement = element => {
			props.clear();
			if (!element) return;

			for (var i in element.properties) {
				let prop = props.table().growX().left().get();
				prop.background(Tex.button);

				prop.add(i).width(70).padRight(6).left().get().alignment = Align.left;
				prop.defaults().fillX();
				element.type.properties[i].build(element, element.properties[i], prop);
				prop.button(Icon.trash, squarei, uieditor.removeProp(element, i))
					.size(32).padLeft(8);
				props.row();
			}

			// Don't show add button if there are no other properties
			if (i == Object.keys(element.type.properties).length) {
				return;
			}

			/* Separator */
			if (i !== undefined) {
				props.image().growX().height(4).pad(6).color(Pal.accent);
				props.row();
			}

			props.button(Icon.add, squarei, () => {
				uieditor.selectProperty(element);
			}).size(48).pad(8).center();
		};
	}).grow();

	dialog.addCloseButton();
	dialog.buttons.button("$export", Icon.export, () => {
		uieditor.export();
	});
	return dialog;
};

uieditor.add = t => {
	t.button("$toolbox.uieditor", () => {
		uieditor.dialog.show();
	});
};

uieditor.load = () => {

};

module.exports = uieditor;
global.uieditor = uieditor;
