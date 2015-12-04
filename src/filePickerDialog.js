
const { remote } = require('electron');

const dialog = remote.require('dialog');
const browserWindow = remote.getCurrentWindow();

export default class FilePickerDialog {
	constructor() {
		this.paths = [];
	}

	pick() {
		this.paths = dialog.showOpenDialog(browserWindow, {
			title: 'Select Destination for Analysis Files',
			properties: ['openDirectory'],
		}) || [];
		return this.paths;
	}
}
