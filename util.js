var util = {};

util.invertGulpSrcPath = function(src) {
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

util.uniq = function(a) {
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


module.exports = util;
