var gutil = require('gulp-util');
var stripColorCodes = require('stripcolorcodes');

var util = {};

util.invertGulpSrcPath = function invertGulpSrcPath(src) {
    if (typeof src === "string") src = [src];

    return src.map(function(path) {
        if (path.charAt(0) === "!") {
            path = path.slice(1);
        } else {
            path = "!" + path;
        }

        return path;
    });
};

util.uniq = function uniq(a) {
    var seen = {},
    	out = [],
    	len = a.length;

    var j = 0;
    for (var i = 0; i < len; i++) {
        var item = a[i];
        if (seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
};

util.logErrorWithoutColorCodes = function logErrorWithoutColorCodes(error) {
    error.message = stripColorCodes(error.message);
    error.codeFrame = stripColorCodes(error.codeFrame);
    var message = new gutil.PluginError('babel', error).toString();
    process.stderr.write(message + '\n');
};


module.exports = util;
