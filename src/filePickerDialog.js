/* jshint esnext: true */

import ipc from 'ipc';

class FilePickerDialog {
	constructor() {
		this.paths = [];
	}

	pick() {
		this.paths = ipc.sendSync("file-picker", "open") || [];
		return this.paths;
	}
}

export default FilePickerDialog;
