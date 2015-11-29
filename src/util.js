/* jshint esnext: true */

const path = require('path');
const fs = require('fs-extra');

import notifications from './notifications';

// GENERAL UTILITIES

var util = {};

util.normalize = function normalize(arr, {
	from = 0,
	to = 100,
	alreadyNormalized
} = {}) { // alreadyNormalized?: { from, to }
	var targetRange = to - from;
	
	if (typeof alreadyNormalized !== "object") {
		let min = Math.min.apply(Math, arr),
			max = Math.max.apply(Math, arr),
			range = max - min,
			rangeChange = targetRange / range;
			
		if (targetRange < 0) {
			throw new Error('`to` must be greater than `from` in option passed to util.normalize');
		}
	
		// replace each value with:
		// 	the proportion of its dist to the lowest value out of the range between the lowest and the highest, * target range
		//	( (val - min) / (max - min) * targetRange )
		//	e.g. [0,1,2] => [0,50,100]
		return arr.map(val => (((val - min) * rangeChange) || 0) + from); // if max - min === 0, will yield NaN -> 0
	} else {
		let range = alreadyNormalized.to - alreadyNormalized.from,
			rangeChange = targetRange / range;
		return arr.map(val => (((val - alreadyNormalized.from) * rangeChange) || 0) + from);
	}
};

util.copyFile = function copyFile(sourcePath, destDir) {
	return new Promise((resolve, reject) => {
		var destPath = path.resolve(destDir, path.basename(sourcePath));

		var readStream = fs.createReadStream(sourcePath),
			writeStream = fs.createWriteStream(destPath);

		writeStream.on('finish', function () {
			resolve(path.relative(__dirname, destPath));
		});

		writeStream.on('error', function (err) {
			reject({
				err: err,
				msg: `Error copying ${sourcePath} to ${destPath}`,
				loc: 'util.copyFile',
				notify: false
			});
		});

		readStream.pipe(writeStream);
	});
};

// util.cloneFunc = function cloneFunc(func) {
//     var temp = function temporary() { return func.apply(this, arguments); };
//     for(var key in func) {
//         if (func.hasOwnProperty(key)) {
//             temp[key] = func[key];
//         }
//     }
//     return temp;
// };

// OOP-RELATED

// NOTE: util.construct and util.namedFunction need testing

util.sliceObj = function sliceObj(obj, start, end) {
	var sliced = {};
	var i = 0;

	for (var k in obj) {
		if (i >= start && i < end)
			sliced[k] = obj[k];

		i++;
	}

	return sliced;
};

// util.construct = function construct(f, args) {
//     var className = f.constructor.toString().match(/^function (.+)\(\)/)[1];

//     var namedFunc = util.namedFunction(className, ["f", "args"], "f.apply(this, args);", {f: f, args: args});

//     return new namedFunc(f, args);
// };

// util.namedFunction = function namedFunction(name, args, body, scope, values) {
//     if (typeof args == "string")
//         values = scope, scope = body, body = args, args = [];
//     if (!Array.isArray(scope) || !Array.isArray(values)) {
//         if (typeof scope == "object") {
//             var keys = Object.keys(scope);
//             values = keys.map(function(p) { return scope[p]; });
//             scope = keys;
//         } else {
//             values = [];
//             scope = [];
//         }
//     }
//     return Function(scope, "function "+name+"("+args.join(", ")+") {\n"+body+"\n}\nreturn "+name+";").apply(null, values);
// };

// DOM

util.resetInput = function resetInput($el) {
	$el.wrap('<form>').closest('form').get(0).reset();
	$el.unwrap();
};

util.stopPropagation = function stopPropagation(e) {
	e.stopPropagation();
};

util.withRefs = function withRefs($el) {
	return $el.parent().find($el);
};

// TEMPORARY FILES DIRECTORY

util.tmp = {};

util.tmp.path = path.resolve(__dirname, './tmp');

util.tmp.createDir = function createDir() {
	if (!fs.existsSync(util.tmp.path)) {
		fs.mkdirSync(util.tmp.path);
	}
};

util.tmp.copyFileToTmp = function copyFileToTmp(filePath) {
	return util.copyFile(filePath, util.tmp.path);
};

util.tmp.copyFilesToTmp = function copyFilesToTmp(filePaths) {
	return Promise.all(filePaths.map(util.tmp.copyFileToTmp));
};

util.tmp.cleanUp = function cleanUp() {
	fs.removeSync(util.tmp.path);
};

// AUDIO UTILIES

util.getLengthOfAudioFile = function getLengthOfAudioFile(path) {
	return new Promise((resolve, reject) => {
		var audio = new Audio();
		audio.src = path;

		audio.addEventListener('canplaythrough', function (e) {
			resolve(e.currentTarget.duration);
		});

		audio.addEventListener('error', function (e) {
			var errorInfo = util.handleAudioLoadError(e);
			errorInfo.loc = 'util.getLengthOfAudioFile';
			reject(errorInfo);
		});
	});
};

util.convertSecondsToHHMMSS = function convertSecondsToHHMMSS(seconds) {
	var date = new Date(1970, 0, 1);
	date.setSeconds(seconds);
	return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
};

util.handleAudioLoadError = function handleAudioLoadError(e, reject) {
	var err = e.currentTarget.error,
		errMsg;

	switch (err.code) {
		case err.MEDIA_ERR_ABORTED:
			errMsg = 'Unknown error';
			break;

		case err.MEDIA_ERR_NETWORK:
			errMsg = 'Network Error';
			break;

		case err.MEDIA_ERR_DECODE:
			errMsg = 'ERR decoding file as an audio file';
			break;

		case err.MEDIA_ERR_SRC_NOT_SUPPORTED:
			errMsg = 'Invalid source location';
			break;
	}

	var errorInfo = {
		err: err,
		msg: errMsg,
		loc: 'util.handleAudioLoadError',
		notify: undefined
	};

	if (typeof reject === 'function') {
		reject(errorInfo);
	} else return errorInfo;
};

//

util.handleError = function handleError(err) {
	// err :
	// {
	//      err: new Error(),
	//      msg: "Error Message, displayed in notification if `notify: true`",
	//      loc: "erreeFunction",
	//      args: [argsPassedToErreeFunction], (optional)
	//      notify: false
	// }

	console.error((`ERR @ ${err.loc}` + (typeof err.args === 'object' ? `(${err.args.join(', ') })` : '') + ':'), err.err);

	if (err.notify === true) {
		notifications.err(err.msg);
	}
};

//

util.analyzerOptions = {
	stereo: false,
	audible: true
};

export default util;
