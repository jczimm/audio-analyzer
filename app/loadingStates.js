/* jshint esnext: true */

"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
var loadingStates = {};

loadingStates.createProgressBar = function (progressClass) {
	var $progressBar = $("<div/>").addClass("mdl-progress mdl-js-progress").addClass(progressClass ? "mdl-progress__" + progressClass : "");

	var progressBar = new MaterialProgress($progressBar.get(0));

	return progressBar;
};

exports["default"] = loadingStates;
module.exports = exports["default"];
//# sourceMappingURL=loadingStates.js.map
