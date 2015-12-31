/* global __appdirname */

const path = require('path');
const fs = require('fs');

import util from './index';

export default {
	path: path.resolve(__appdirname, 'tmp'),

	createDir() {
		const tmpPath = this.path;
		if (!fs.existsSync(tmpPath)) {
			fs.mkdirSync(tmpPath);
		}
	},
	copyFileToTmp(filePath) {
		return util.copyFile(filePath, this.path);
	},
	copyFilesToTmp(filePaths) {
		return Promise.all(filePaths.map(this::this.copyFileToTmp));
	},
	cleanUp() {
		fs.removeSync(this.path);
	},
};
