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

try {
	const rtfm = require("rtfm/library");

	rtfm.addPage("Modding Toolbox", [
		"## Toolbox dialog",
		"Click the [coral][] button in-game to open the toolbox.",
		"In it there are some tools:",

		"# Script Editor",
		"Here you can edit scripts that can be used by other tools.",
		"When the title (editable) has a red underline, there is unsaved work.",

		"# Update",
		"This function is run every tick, when not paused.",
		"To always run it, use [stat]Draw[]",

		"# Draw",
		"This is like [stat]Update[] but run on the client thread, and even when paused.",
		"Draw.* functions take screen coordinates, not world units.",
		"The fields [green]w[] and [green]h[] are set to the size of the screen.",

		"# Exceptions",
		"If an exception is thrown, the function will be disabled and the error will be printed to the log."
	]);
	module.exports = true;
} catch (e) {
	Log.warn("Please install [#00aaff]DeltaNedas/rtfm[] to view the Modding Toolbox manual.");
	module.exports = false;
}
