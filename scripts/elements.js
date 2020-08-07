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

/* Property types */

const prop = (name, def) => {
	const setter = "get().set" + (name.substr(0, 1).toUpperCase() + name.substr(1));
	return {
		apply(element, value) {
			element.cell.get()[name] = value;
		},

		build(element, value, t) {
			t.field(value, text => {
				element.properties[name] = text;
				this.apply(element, text);
			}).growX();
		},

		export(value) {
			return setter + "(\"" + value.replace(/\\|"/g, "\\\0") + "\")";
		},

		def: def
	};
};

const numbers = (count, func) => {
	const nums = [];
	for (var i = 0; i < count; i++) {
		nums[i] = 0;
	}

	return {
		apply: func,

		build(element, t) {
			for (let i in nums) {
				t.field(nums[i], text => {
					const num = parseFloat(text);
					if (!isNan(num)) {
						nums[i] = num;
					}
				}).width(30).padRight(8);
			}
		},

		export(value) {
			return "";
		},

		def: nums
	};
};

/* Element Types */

const base = {
	new: () => new Element(),
	properties: {
/*		"margin": numbers(4, (elem, m) => {
			elem.cell.margin(m[0], m[1], m[2], m[3]);
		}) */
	}
};

const from = (base, obj) => {
	return Object.assign(Object.create(base.properties), obj);
};

const elements = {};

elements.Row = {
	properties: {},
	add(element, t) {
		t.row();
	},
	export: () => "t.row();"
};

elements.Label = {
	new: () => new Label("Label"),
	properties: from(base, {
		text: prop("text", "Label")
	}),

	export(element) {
		const out = "table.add(\"" + escape(element.properties.text) + "\")";
		for (var i in element.properties) {
			if (i == "text") continue;
			out += "\n\t." + this.properties[i].escape(element.properties[i]);
		}
		return out + ";";
	}
};

module.exports = elements;
