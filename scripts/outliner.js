/*
	Copyright (c) DeltaNedas 2020

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

/* Outliner - adds an outline to an image on the clipboard */

importPackage(Packages.arc.util.serialization);

const ui = global.ui;

const outliner = {
	color: Pal.darkerMetal,
	width: 3,

	raw: null,
	dialog: null
};
global.toolbox.outliner = outliner;

outliner.load = () => {};

outliner.getColor = text => {
	try {
		if (Pal[text] instanceof Color) return Pal[text];
	} catch (e) {}

	try {
		if (Color[text] instanceof Color) return Color[text];
	} catch (e) {}

	try {
		return Color.valueOf(text);
	} catch (e) {}

	return null;
};

outliner.build = () => {
	const d = new BaseDialog("$toolbox.outliner");
	const t = d.cont;

	const top = new Table();

	top.add("Color: ");
	top.field("#" + outliner.color, text => {
		outliner.color = outliner.getColor(text);
	}).get().validator = text => !!outliner.getColor(text);
	top.row();

	top.add("Width: ");
	top.field("" + outliner.width, text => {
		outliner.width = Math.max(1, parseInt(text));
	}).get().validator = text => !isNaN(parseInt(text));
	t.add(top).row();

	t.add("[stat]1.[] Select an image to outline").row();
	t.button("Select", () => {
		readBinFile("Image to be outlined", "png", bytes => {
			outliner.raw = bytes;
		});
	}).size(240, 50).center().row();

	t.add("[stat]2.[] Adjust the settings. (Defaults are for a unit)").row();
	t.add("[stat]3.[] Click [coral]Export[].").row();
	t.add("[stat]4.[] Select the output image file.");

	d.addCloseButton();
	d.buttons.button("Export", () => {
		try {
			const pixmap = new Pixmap(outliner.raw);
			const outlined = Pixmaps.outline(pixmap, outliner.color, outliner.width);
			const png = new PixmapIO.PNG(outlined.width * outlined.height * 1.5);

			const buffer = new java.io.ByteArrayOutputStream();
			png.flipY = false;
			png.write(buffer, outlined);

			const bytes = buffer.toByteArray();
			png.dispose();

			writeBinFile("Outlined image", "png", bytes);
			outliner.raw = null;
		} catch (e) {
			ui.showError("Failed to outline image", e);
		}
	}).disabled(() => !outliner.raw);

	return d;
};

outliner.add = t => {
	t.button("$toolbox.outliner", () => {
		outliner.dialog.show();
	});
};

module.exports = outliner;
