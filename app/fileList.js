/* jshint esnext: true */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var _notifications = require('./notifications');

var _notifications2 = _interopRequireDefault(_notifications);

//

var FileList = (function () {
    function FileList(trackListTable) {
        _classCallCheck(this, FileList);

        this.trackListTable = trackListTable;
        this.files = {};
    }

    _createClass(FileList, [{
        key: 'addFile',
        value: function addFile(filePath, $entry, trackLength) {
            this.files[filePath] = {
                entry: $entry,
                trackLength: trackLength
            };
        }
    }, {
        key: 'displayFile',
        value: function displayFile(filePath) {
            var self = this;

            var fileName = _path2['default'].basename(filePath),
                trackLength;

            return new Promise(function (resolve, reject) {
                _util2['default'].getLengthOfAudioFile(filePath).then(function (trackLengthSeconds) {

                    var _trackLengthPretty = _util2['default'].convertSecondsToHHMMSS(trackLengthSeconds);

                    // <tr>
                    //     <td class="mdl-data-table__cell--non-numeric">Track Name.ext</td>
                    //     <td>hh:mm:ss</td>
                    // </tr>

                    // build row
                    var $row = $("<tr/>").append($("<td/>").addClass("mdl-data-table__cell--non-numeric").text(fileName)).append($("<td/>").addClass("track-length").text(_trackLengthPretty));

                    // add checkbox artificially (as opposed to reinitializing table as a MaterialDataTable so that checkboxes are generated)

                    var $checkbox = $("<td/>").addClass("label").append(self.trackListTable.createCheckbox_($row.get(0)));
                    $row.prepend($checkbox);

                    $row.appendTo($trackList.find("> tbody"));

                    // hacky...
                    $row.find("input[type=checkbox]").click();

                    trackLength = trackLengthSeconds;
                    self.addFile(filePath, _util2['default'].withRefs($row), trackLength);

                    resolve(filePath);
                })['catch'](function (err) {
                    err.notify = true;
                    err.args = [filePath];
                    // util.handleError(err);
                    reject(err);
                });
            });
        }
    }]);

    return FileList;
})();

exports['default'] = FileList;
module.exports = exports['default'];