/* global MaterialProgress */
/* jshint esnext: true */

const loadingStates = {};

loadingStates.createProgressBar = function createProgressBar({ progressClass = "" } = {}) {
	var $progressBar = $('<div/>').addClass('mdl-progress mdl-js-progress');
	if (progressClass) $progressBar.addClass(`mdl-progress__${progressClass}`);

	var progressBar = new MaterialProgress($progressBar.get(0));

	return progressBar;
};

export default loadingStates;
