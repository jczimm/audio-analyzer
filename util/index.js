var gutil = require('gulp-util'),
    changed = require('gulp-changed');

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

/**
 * Finds all matches of a regular expression in a string, preserving the results of the regex's capturing groups for each match.
 * @param  {String} str     String to match
 * @param  {RegExp} regex   Regular expression to apply to string
 * @return {Array}          Array of match results (Arrays) for each match 
 */
// util.matchGlobalDeep = function matchGlobalDeep(str, regex) {
//     var globalFlags = "g" + (regex.ignoreCase ? "i" : ""),
//         globalRegex = new RegExp(regex.source, globalFlags);
        
//     return str.match(globalRegex).map(function(match) {
//         return regex.exec(match);
//     });
// };
// 

/**
 * Custom `hasChanged` function for gulp-changed options object; a [mini- gulp plugin]
 */
var forceChanged = function forceChanged(stream, cb, sourceFile) {
    // simple: always push file to stream
    stream.push(sourceFile);
    cb();
};

/**
 * Wrapper for options object to be passed to gulp-changed
 * @param  {Boolean} force    If true, options object returned has a custom `hasChanged` function that makes gulp-changed let all files through
 * @param  {String} extension File extension of dest. files to be used to compare their src files to them (defaults to ext. of the src files)
 * @return {Object}           Options object, to be passed to gulp-changed 
 */
util.changedOpts = function changedOpts(force, extension) {
    return {
        hasChanged: (force === true ? forceChanged : changed.compareLastModifiedTime),
        extension: extension || undefined
    };
};


module.exports = util;
