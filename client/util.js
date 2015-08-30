var path = require('path');

var rmdir = require('rmdir');

// GENERAL UTILITIES

var util = {};

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
	rmdir(util.tmp.path);
};

//

util.analyzerOptions = {
	stereo: false,
	audible: true
};

module.exports = util;
