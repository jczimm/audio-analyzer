var path = require('path');

var fs = require('fs-extra');

// GENERAL UTILITIES

var util = {};

util.normalize = function(arr, factor) {
	var min = Math.min.apply(Math, arr), max = Math.max.apply(Math, arr);
	return new Uint8Array(
		[].slice.call(arr).map(function(val) {
		    return (val - min) / (max - min) * (factor || 100);
		})
	);
};

util.copyFile = function(sourcePath, destDir) {
	return new Promise(function(resolve, reject) {

		var destPath = path.resolve(destDir, path.basename(sourcePath));

		var readStream = fs.createReadStream(sourcePath),
			writeStream = fs.createWriteStream(destPath);

		writeStream.on('finish', function() {
			resolve(path.relative(__dirname, destPath));
		});

		writeStream.on('error', function(err) {
			reject(err);
		});

		readStream.pipe(writeStream);
	});
};

// TEMPORARY FILES DIRECTORY

util.tmp = {};

util.tmp.path = "./tmp";

util.tmp.createDir = function() {
	if (!fs.existsSync(util.tmp.path)) {
	    fs.mkdirSync(util.tmp.path);
	}
};

util.tmp.copyFileToTmp = function(filePath) {
	return util.copyFile(filePath, util.tmp.path);
};

util.tmp.copyFilesToTmp = function(filePaths) {
	return Promise.all(filePaths.map(util.tmp.copyFileToTmp));
};

util.tmp.cleanUp = function() {
	fs.removeSync(util.tmp.path);
};

//

util.analyzerOptions = {
	stereo: false,
	audible: true
};

module.exports = util;
