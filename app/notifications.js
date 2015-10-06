/* jshint esnext: true */

"use strict";

require('./lib/snackbar/snackbar.min');

var notifications = {};

notifications.err = function (msg) {
	$.snackbar({ style: "error", content: msg, timeout: 6000 });
};

module.exports = notifications;
//# sourceMappingURL=notifications.js.map
