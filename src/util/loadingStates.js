/* global MaterialProgress */

const loadingStates = {};

loadingStates.createProgressBar = function createProgressBar({ progressClass = '' } = {}) {
	const $progressBar = $('<div/>').addClass('mdl-progress mdl-js-progress');
	if (progressClass) $progressBar.addClass(`mdl-progress__${progressClass}`);

	const progressBar = new MaterialProgress($progressBar.get(0));

	return progressBar;
};

export default loadingStates;
