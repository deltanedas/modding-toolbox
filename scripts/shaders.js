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

const Shader = Packages.arc.graphics.gl.Shader;

const editor = require("modding-toolbox/editor");
const toolbox = this.global.toolbox;

const shaders = {
	frag: null,
	vert: null,
	// eval'd function to give the shaders data
	applyFunc: null,
	apply: null
};

shaders.compile = () => {
	const check = (key, name) => {
		if (!shaders[key]) {
			throw "Specify a" + name;
		}
		if (!editor.scripts[shaders[key]]) {
			throw "File for a" + name + " does not exist";
		}
	};
	check("vert", " vertex shader");
	check("frag", " fragment shader");
	check("apply", "n apply function");

	try {
		eval("shaders.applyFunc = function(w, h) {" + editor.scripts[shaders.apply] + "};");
	} catch (e) {
		throw "Failed to compile apply function: " + e;
	}

	try {
		shaders.shader = new JavaAdapter(Shader, {
			apply() {
				try {
					shaders.applyFunc.call(this, Core.graphics.width, Core.graphics.height);
				} catch (e) {
					toolbox.showError("Failed to apply shader: " + e);
					delete shaders.shader;
				}
			}
		}, editor.scripts[shaders.vert], editor.scripts[shaders.frag]);
	} catch (e) {
		throw "Failed to compile shader: " + e;
	}
};

shaders.load = () => {
	const load = key => {
		shaders[key] = Core.settings.get("toolbox.shaders." + key, null);
	};

	load("vert");
	load("frag");
	load("apply");
};

shaders.build = () => {
	const d = new BaseDialog("$toolbox.shaders");
	const t = d.cont;
	t.defaults().center().top();

	/* Shader preview */
	t.add(extendContent(Image, Core.atlas.find("router"), {
		draw() {
			if (shaders.shader) {
				Draw.shader(shaders.shader);
			}

			this.super$draw();

			if (shaders.shader) {
				Draw.shader();
			}
		}
	})).size(128).fillY();
	t.row();

	const scripts = t.table().get();
	t.row();

	/* Shader configuration */
	const addScript = key => {
		scripts.button("$toolbox.shaders." + key, () => {
			editor.select(script => {
				shaders[key] = script;
				Core.settings.putSave("toolbox.shaders." + key, script);
			})
		}).padRight(8).width(160);

		scripts.label(() => shaders[key] || "...").left().width(200);
		scripts.row();
	};

	addScript("vert");
	addScript("frag");
	addScript("apply");

	d.addCloseButton();
	d.buttons.button("$run", Icon.ok, () => {
		try {
			shaders.compile();
		} catch (e) {
			toolbox.showError(e);
		}
	});
	shaders.dialog = d;
};

shaders.add = t => {
	t.button("$toolbox.shaders", () => {
		shaders.dialog.show();
	}).padBottom(16);
};

module.exports = shaders;
