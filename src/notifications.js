/* jshint esnext: true */

require('./lib/snackbar/snackbar.min');

const notifications = {};

notifications.err = function err(msg) {
	$.snackbar({
		style: 'error',
		content: msg,
		timeout: 6000,
	});
};

export default notifications;
