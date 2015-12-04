
const path = require('path');
const fs = require('fs-extra');

import notifications from './notifications';

// GENERAL UTILITIES

const util = {};

// only to be used within `util.normalize`
function _normalize(arr, { min, rangeChange, from }) {
	// replace each value with:
	// 	the proportion of its dist to the minimum value between the minimum and the maximum, * target range
	//	( (val - min) / (max - min) * targetRange )
	//	e.g. [0,1,2] => [0,50,100]
	return arr.map(val => (((val - min) * rangeChange) || 0) + from); // if max - min === 0, will yield NaN -> 0
}

util.normalize = function normalize(arr, { from = 0, to = 100, alreadyNormalized } = {}) { // alreadyNormalized?: { from, to }
	const targetRange = to - from;

	// if no `alreadyNormalized` object was passed, normalize with the default behavior (min and max as the )
	if (typeof alreadyNormalized !== 'object') {
		const min = Math.min.apply(Math, arr);
		const max = Math.max.apply(Math, arr);

		const range = max - min;
		const rangeChange = targetRange / range;

		if (targetRange < 0) {
			throw new Error('`to` must be greater than `from` in option passed to util.normalize');
		}

		return _normalize(arr, { min, rangeChange, from });
	}

	// however, if an `alreadyNormalized` object was passed, normalize from the given range (min and max as provided)
				// max					 min
	const range = alreadyNormalized.to - alreadyNormalized.from;
	const rangeChange = targetRange / range;
	return _normalize(arr, { min: alreadyNormalized.from, rangeChange, from });
};

util.copyFile = function copyFile(sourcePath, destDir) {
	return new Promise((resolve, reject) => {
		const destPath = path.resolve(destDir, path.basename(sourcePath));

		const readStream = fs.createReadStream(sourcePath);
		const writeStream = fs.createWriteStream(destPath);

		writeStream.on('finish', () => {
			resolve(path.relative(__dirname, destPath));
		});

		writeStream.on('error', (err) => {
			reject({
				err: err,
				msg: `Error copying ${sourcePath} to ${destPath}`,
				loc: 'util.copyFile',
				notify: false,
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
	const sliced = {};

	const objKeys = Object.keys(obj);

	let i = 0, k;
	for (let j = 0; j < objKeys.length; j++) {
		k = objKeys[j];
		if (i >= start && i < end) {
			sliced[k] = obj[k];
		}

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

util.getLengthOfAudioFile = function getLengthOfAudioFile(srcPath) {
	return new Promise((resolve, reject) => {
		const audio = new Audio();
		audio.src = srcPath;

		audio.addEventListener('canplaythrough', (e) => {
			resolve(e.currentTarget.duration);
		});

		audio.addEventListener('error', (e) => {
			const errorInfo = util.handleAudioLoadError(e);
			errorInfo.loc = 'util.getLengthOfAudioFile';
			reject(errorInfo);
		});
	});
};

util.convertSecondsToHHMMSS = function convertSecondsToHHMMSS(seconds) {
	const date = new Date(1970, 0, 1);
	date.setSeconds(seconds);
	return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
};

util.handleAudioLoadError = function handleAudioLoadError(e, reject) {
	const err = e.currentTarget.error;

	let errMsg;

	switch (err.code) {
		case err.MEDIA_ERR_ABORTED:
		default:
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

	const errorInfo = {
		err: err,
		msg: errMsg,
		loc: 'util.handleAudioLoadError',
		notify: undefined,
	};

	if (typeof reject === 'function') {
		reject(errorInfo);
	} else return errorInfo;
};

//

util.handleError = function handleError({ err, msg, loc, args, notify = false, fine = false }) {
	// {
	//      err: new Error(),
	//      msg: "Error Message, displayed in notification if `notify: true`",
	//      loc: "erreeFunction",
	//      args: [argsPassedToErreeFunction], (optional)
	//      notify: false,
	//		fine: false // if true, the "error" should not be displayed as such; rather, it should be displayed as a mere notification
	// }

	let method, prefix, content;
	if (fine === true) {
		method = 'info';
		prefix = '';
		content = msg;
	} else {
		method = 'error';
		prefix = 'ERR';
		content = err;
	}
	// e.g. `ERR @ erreeFunction(argPassed1, argPassed2): ${err}`
	const errorMsg = [(prefix + `@ ${loc}` + (typeof args === 'object' ? `(${args.join(', ') })` : '') + ':'), content];

	// log error (console.info or console.error)
	console[method](...errorMsg);

	if (notify === true) {
		notifications.err(msg);
	}
};

//

util.analyzerOptions = {
	stereo: false,
	audible: false,
};

export default util;
