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

/* Wrappers over arc Elements and their properties.
   Exporting to JS is supported. */

const ui = this.global.uiLib;

/* Property types */

const getSetter = name => "set" + (name.substr(0, 1).toUpperCase() + name.substr(1));

// Modifier of the element
const prop = (name, def) => {
	const setter = getSetter(name);
	return {
		apply(element, value) {
			element.cell.get()[name] = value;
		},

		build(element, value, t) {
			t.field(value, text => {
				if (!text) return;

				element.properties[name] = text;
				this.apply(element, text);
			}).growX().right();
		},

		export(value) {
			return setter + "(\"" + value.replace(/\\|"/g, "\\\0") + "\")";
		},

		def: def,
		needsElement: true
	};
};

// Modifier of the cell
const func = (name, def) => {
	return {
		apply(element, value) {
			element.cell[name](value);
		},

		build(element, value, t) {
			t.field(element.properties[name], text => {
				const num = parseFloat(text);
				if (!text || isNaN(num)) return;

				element.properties[name] = num;
				this.apply(element, num);
			}).right();
		},

		export(value) {
			return name + "(" + value + ")";
		},

		def: def
	};
};

const numbers = (name, count, func, def) => {
	const defs = [];
	for (var i = 0; i < count; i++) {
		defs[i] = def === undefined ? 0 : def;
	}

	return {
		apply: func,

		build(element, nums, t) {
			for (let i in nums) {
				t.field(nums[i], text => {
					const num = parseFloat(text);
					if (!text || !isNaN(num)) {
						nums[i] = num;
					}
				}).width(30).padRight(8);
			}
		},

		export(values) {
			return name + "(" + values.join(", ") + ")";
		},

		def: defs
	};
};

const bool = (name, def) => {
	const setter = getSetter(name);
	return {
		apply(element, value) {
			element.cell.get()[name] = value;
		},

		build(element, value, t) {
			const label = t.button(value + "", Styles.clearTogglet, () => {
				value = !value;
				element.properties[name] = value;
				this.apply(element, value);
				label.text = value + "";
			}).width(60).get().getLabel();
		},

		export(value) {
			return setter + "(" + value + ")";
		},

		def: def,
		needsElement: true
	};
};

// Like prop but nonzero
const scl = (name, def) => {
	const setter = getSetter(name);
	return {
		apply(element, value) {
			element.cell.get()[name] = value;
		},

		build(element, value, t) {
			t.slider(0.25, 3, 0.25, value, num => {
				element.properties[name] = num;
				this.apply(element, num);
			}).width(100).right();
		},

		export(value) {
			return setter + "(" + value + ")";
		},

		def: def,
		needsElement: true
	};
};

// "enum" is reserved
const enumm = (name, enumm, def) => {
	const setter = getSetter(name);
	// [JavaClass package.(Class)]
	const enumname = (enumm + "").match(/([^.]+)\]$/)[1];

	const values = [];
	for (var i in enumm) {
		if (typeof(enumm[i]) != "function") {
			values.push(i);
		}
	}

	return {
		apply(element, value) {
			element.cell.get()[name] = enumm[value];
		},

		build(element, value, t) {
			const label = t.button(value, Styles.clearPartialt, () => {
				ui.select(name + " enum", values, selected => {
print([selected, typeof(enumm[selected])]);
					element.properties[name] = selected;
					this.apply(element, selected);
					label.text = selected;
				});
			}).width(80).get().getLabel();
		},

		export(value) {
			return setter + "(" + enumname + "." + value + ")";
		},

		def: def,
		needsElement: true
	};
};

/* Element Types */

const base = {
	new: () => new Element(),
	properties: {
		width: func("width", 50),
		height: func("height", 50),

		marginLeft: func("marginLeft", 4),
		marginRight: func("marginRight", 4),
		marginTop: func("marginTop", 4),
		marginBottom: func("marginBottom", 4)
	}
};

const from = (base, obj) => {
	return Object.assign(Object.create(base.properties), obj);
};

const elements = {};

elements.Row = {
	add(element, t) {
		t.row();
	},

	export: () => "table.row();",

	properties: {}
};

elements.Label = {
	new: () => new Label("Label"),

	export(element) {
		const out = "table.add(\"" + escape(element.properties.text) + "\")";
		for (var i in element.properties) {
			const val = element.properties[i];
			if (i == "text" || this.properties[i].def == val) continue;
			out += "\n\t." + this.properties[i].export(element.properties[i]);
		}
		return out + ";";
	},

	properties: from(base, {
		text: prop("text", "Label"),
		fontScaleX: scl("fontScaleX", 1),
		fontScaleY: scl("fontScaleY", 1),
		alignment: enumm("alignment", Align, "left"),
		wrap: bool("wrap", false)
	})
};

module.exports = elements;
