/* jshint esnext: true */

'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ipc = require('ipc');

var _ipc2 = _interopRequireDefault(_ipc);

var _remote = require('remote');

var _remote2 = _interopRequireDefault(_remote);

var dialog = _remote2['default'].require('dialog');
var browserWindow = _remote2['default'].getCurrentWindow();

var FilePickerDialog = (function () {
	function FilePickerDialog() {
		_classCallCheck(this, FilePickerDialog);

		this.paths = [];
	}

	_createClass(FilePickerDialog, [{
		key: 'pick',
		value: function pick() {
			this.paths = dialog.showOpenDialog(browserWindow, {
				title: "Select Destination for Analysis Files",
				properties: ["openDirectory"]
			}) || [];
			return this.paths;
		}
	}]);

	return FilePickerDialog;
})();

exports['default'] = FilePickerDialog;
module.exports = exports['default'];
//# sourceMappingURL=filePickerDialog.js.map
