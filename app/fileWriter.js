/* jshint esnext: true */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var FileWriter = (function () {
    function FileWriter(opt) {
        _classCallCheck(this, FileWriter);

        this.dest = opt.dest;
        this.writeStream = _fs2['default'].createWriteStream(this.dest);
    }

    _createClass(FileWriter, [{
        key: 'write',
        value: function write() {}
    }]);

    return FileWriter;
})();

exports['default'] = FileWriter;
module.exports = exports['default'];
//# sourceMappingURL=fileWriter.js.map
