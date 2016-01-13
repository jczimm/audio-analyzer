/* global $, MaterialDataTable */

export default function registerGlobals(scope) {
	((globals) => {
		const keys = Object.keys(globals);
		let key;
		for (let i = 0; i < keys.length; i++) {
			key = keys[i];
			// effectively simulates: `const scope[key] = globals[key];`
			// http://stackoverflow.com/a/10843598/3435077
			Object.defineProperty(scope, key, {
				value: globals[key],
				writable: false,
				enumerable: true,
				configurable: true,
			});
		}
	})({
		// %TODO: migrate to properties of `optionsMenu` (OptionsMenu.js),
		// have whatever scripts that currently access them from the global scope
		// now access them through `optionsMenu`
		$fileInput: $('input[type=file]#upload'),
		$destLabel: $('#destLabel'),
		$innerDestLabel: $('#destLabel span'),
		$pointsPerSecond: $('input[type=range]#pointsPerSecond'),
		$pointsPerSecondCounter: $('span#pointsPerSecondCounter > span.inner'),

		// and have $interface into `interfaceStateController`
		$interface: $('#interface'),
		// and $tracklist and trackListTable into a `trackListController`? (TrackListController.js)
		$trackList: $('#track-list'),
		trackListTable: new MaterialDataTable($('#track-list').get(0)),
		// if remove all globals, dissolve this file? or keep in repo but not use?
	});
}
