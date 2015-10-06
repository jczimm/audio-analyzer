/* jshint esnext: true */

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var _notifications = require('./notifications');

var _notifications2 = _interopRequireDefault(_notifications);

var _loadingStates = require('./loadingStates');

var _loadingStates2 = _interopRequireDefault(_loadingStates);

var _afaFile = require('afa-file');

var _afaFile2 = _interopRequireDefault(_afaFile);

var _webAudioAnalyser = require('web-audio-analyser');

var _webAudioAnalyser2 = _interopRequireDefault(_webAudioAnalyser);

//

var _fileList = require('./fileList');

var _fileList2 = _interopRequireDefault(_fileList);

var _filePickerDialog = require('./filePickerDialog');

var _filePickerDialog2 = _interopRequireDefault(_filePickerDialog);

//

var _ipc = require('ipc');

var _ipc2 = _interopRequireDefault(_ipc);

var $fileInput = $("input#upload"),
    $destLabel = $("span#destLabel"),
    $interface = $("#interface"),
    $trackList = $("#track-list");

var trackListTable = new MaterialDataTable($trackList.get(0));

//

var noop = function noop() {};

var fileList = new _fileList2['default'](trackListTable);

var destPicker = new _filePickerDialog2['default']();
$("#exit-button").click(function () {
    _ipc2['default'].sendSync("window", "close");
});

//

var working = false;

//

$("body").on('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();

    var droppedFiles = e.originalEvent.dataTransfer.files;

    if (!working) handleFiles(droppedFiles[0] ? droppedFiles : e.target.files);
}).on('dragover', function (e) {
    e.stopPropagation();
    e.preventDefault();
    if (!working) e.originalEvent.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
});

$("#interface, div#upload-button, #interface #blank-state-text").click(function () {
    $fileInput.click();
});

$("#chooseDestButton").click(function () {
    promptDestPicker();
});

$("#interface #track-list").click(_util2['default'].stopPropagation);

//

$(".mdl-menu.main, .mdl-menu.main *").click(_util2['default'].stopPropagation);

function handleFileInputChange() {
    handleFiles($(this).get(0).files);
}

var maxConcurrentCtxs = 1;

function handleProcessButtonClick() {

    var process = function process(files) {

        // process the first batch of files

        var numProcessed = 0,
            firstFiles = _util2['default'].sliceObj(files, 0, maxConcurrentCtxs),
            nextFile;

        var beforeEachTrack = function beforeEachTrack() {
            numProcessed++;
        };

        processFiles(firstFiles, beforeEachTrack, function oneTrackCompleted() {
            // for every track completed, process the next one on the queue and have `processFiles` call back
            // to this function after that track has completed
            nextFile = _util2['default'].sliceObj(files, numProcessed, numProcessed + 1);
            if (nextFile !== {}) {
                processFiles(nextFile, beforeEachTrack, oneTrackCompleted);
            } else {
                $("#stop-button").hide();
            }
        });
    };

    var start = function start() {
        working = true;
        $interface.addClass('working');

        // hide #process-button, show #stop-button
        $("#process-button").hide();
        $("#stop-button").show();

        process(fileList.files);
    };

    if (!destPicker.paths[0]) {
        var path = promptDestPicker();
        if (path !== undefined && path.length > 0) {
            start();
        } else _notifications2['default'].err("Error: No destination directory was provided. [Try Again]");
    } else {
        start();
    }
}

var $pointsPerSecond = $("input[type=range]#pointsPerSecond"),
    $pointsPerSecondCounter = $("span#pointsPerSecondCounter > span.inner");

function handlePointsPerSecondRangeChange(e) {
    var val = $(this).val();
    // make sure the slider never reaches zero
    // Note: the range input shouldn't have min=100 instead because the visual minimum should be 0
    if (parseInt(val) === 0) {
        if (e) e.preventDefault();
        $(this).val(100);
        handlePointsPerSecondRangeChange();
    } else {
        $pointsPerSecondCounter.text(val);
    }
}
handlePointsPerSecondRangeChange.apply($pointsPerSecond);

function promptDestPicker() {
    var path = destPicker.pick()[0];
    if (path) $destLabel.text(path);
    return path;
}

$("input[type=file]#upload").change(handleFileInputChange);
$pointsPerSecond.on("change input", handlePointsPerSecondRangeChange.bind($pointsPerSecond));
$("#process-button").click(handleProcessButtonClick);

window.loops = [];
$("#stop-button").click(function () {
    // clear all loops
    window.loops.forEach(clearInterval);

    // remove all progress bars
    var files = fileList.files,
        $entry;
    for (var tmpFilePath in files) {
        $entry = files[tmpFilePath].entry;
        $entry.find(".mdl-progress").remove();
    }

    // // show #process-button again
    // $("#process-button").show();
    $("#stop-button").hide();
});

//

var invalidFileFormatMsg = "Invalid file format (currently, only .wav and .mp3 files are supported)";

function handleFiles(files) {
    var filePaths = [];

    [].slice.call(files).forEach(function (file) {
        if (!/\.(?:wav|mp3)$/i.test(_path2['default'].basename(file.name))) {
            console.error("ERR: " + invalidFileFormatMsg);
            _notifications2['default'].err(invalidFileFormatMsg);
        } else {
            filePaths.push(file.path);
        }
    });

    _util2['default'].resetInput($fileInput);

    if (filePaths[0]) {
        prepareFiles(filePaths).then(function () {
            // update interface
            $interface.removeClass("blank");
            $("#interface, div#upload-button, #interface #blank-state-text").off("click");
        })
        // errors are already handled in try..catch
        ['catch'](function (err) {
            // console.log(err);
        });
    }
}

function prepareFiles(filePaths) {
    var tmpFilePaths;
    return regeneratorRuntime.async(function prepareFiles$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                context$1$0.prev = 0;
                context$1$0.next = 3;
                return regeneratorRuntime.awrap(_util2['default'].tmp.copyFilesToTmp(filePaths));

            case 3:
                tmpFilePaths = context$1$0.sent;
                context$1$0.next = 6;
                return regeneratorRuntime.awrap(Promise.all(tmpFilePaths.map(fileList.displayFile.bind(fileList))));

            case 6:
                return context$1$0.abrupt('return');

            case 9:
                context$1$0.prev = 9;
                context$1$0.t0 = context$1$0['catch'](0);

                _util2['default'].handleError(context$1$0.t0);

            case 12:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this, [[0, 9]]);
}

function processFiles(files, beforeEachTrack, oneTrackCompleted) {
    // set configuration variables to the values of the options' corresponding inputs in the interface
    var gzip = $("input#gzip").is(":checked"),
        pointsPerSecond = parseInt($pointsPerSecond.val()),
        dest = destPicker.paths[0];

    var file, trackLength;

    var _loop = function (tmpFilePath) {
        file = files[tmpFilePath];

        $entry = file.entry;

        // skip over unchecked tracks
        if (!$entry.hasClass("is-selected")) return 'continue';

        progressBar = _loadingStates2['default'].createProgressBar();
        $progressBar = $(progressBar.element_);

        $entry.append($progressBar);
        $progressBar = _util2['default'].withRefs($progressBar); // reattach references

        $progressBar.addClass("analysis-progress");

        trackLength = file.trackLength;

        progressOpts = {
            analysis: {
                start: function start() {
                    // $progressBar.removeClass("mdl-progress__indeterminate");
                    this.$progressBar.addClass("current");

                    // disable checkbox, update through MDL
                    this.$entry.find('> td.label > .mdl-checkbox input[type=checkbox]').prop("disabled", true).parent().get(0).MaterialCheckbox.checkDisabled();
                },
                set: function set(progress) {
                    this.progressBar.setProgress(progress * 100);
                },
                error: function error() {
                    this.$progressBar.addClass("errored");
                },
                complete: function complete() {
                    this.$progressBar.removeClass("current");
                }
            },
            save: {
                start: function start() {
                    this.$progressBar.fadeOut(100);

                    this.progressBar.setProgress(0);
                    this.$progressBar.addClass("saving");

                    this.$progressBar.fadeIn(100);
                },
                set: function set(progress) {
                    this.progressBar.setProgress(progress * 100);
                },
                error: function error() {
                    this.$progressBar.addClass("errored");
                },
                complete: function complete() {
                    // remove progress bar
                    this.$progressBar.remove();

                    // replace checkbox with a "done" icon (check mark)
                    var $icon = $("<i/>").addClass("icon material-icons").text("done");
                    this.$entry.find('> td.label > .mdl-checkbox').remove().parent().append($icon);

                    this.$progressBar.removeClass("current");
                    this.oneTrackCompleted();
                }
            }

        };

        // bind each function with a context that provides reference to the current state of each of the
        // relevant variables, as these variables will be overwritten in the next iteration of our^ for..in loop

        var analysisOpts = progressOpts.analysis; // cache
        for (var method in analysisOpts) {
            analysisOpts[method] = analysisOpts[method].bind({
                progressBar: progressBar, $progressBar: $progressBar, $entry: $entry
            });
        }

        var saveOpts = progressOpts.save; // cache
        for (var method in saveOpts) {
            saveOpts[method] = saveOpts[method].bind({
                progressBar: progressBar, $progressBar: $progressBar, $entry: $entry, oneTrackCompleted: oneTrackCompleted
            });
        }

        // numProcessed++ so that when any track completes, the next available analysis will not process this one
        beforeEachTrack();

        analyzeAudioTrack({
            filePath: tmpFilePath,
            pointsPerSecond: pointsPerSecond,
            trackLength: trackLength,
            progressBar: analysisOpts
        }).then(function (results) {
            saveDataToFile({
                analysis: results.analysis,
                sourcePath: results.sourcePath,
                gzip: gzip,
                progressBar: saveOpts
            }).then(function () {
                console.log("successfully saved .afa file for %c%s", "font-weight: 600; font-size: 1.2em;", _path2['default'].basename(tmpFilePath));
            })['catch'](function (err) {
                _util2['default'].handleError(err);
            });
        })['catch'](function (err) {
            err.notify = true;
            err.args = [tmpFilePath];
            _util2['default'].handleError(err);
        });
    };

    for (var tmpFilePath in files) {
        var $entry;
        var progressBar, $progressBar;
        var progressOpts;

        var _ret = _loop(tmpFilePath);

        if (_ret === 'continue') continue;
    }
}

function analyzeAudioTrack(_ref) {
    var filePath = _ref.filePath;
    var pointsPerSecond = _ref.pointsPerSecond;
    var trackLength = _ref.trackLength;
    var _ref$progressBar = _ref.progressBar;
    var progressBar = _ref$progressBar === undefined ? {
        start: noop,
        set: noop,
        error: noop,
        complete: noop
    } : _ref$progressBar;

    return new Promise(function (resolve, reject) {
        var audio = new Audio();
        // configure `audio`
        audio.autoplay = false;
        audio.preload = "auto";
        audio.src = filePath;

        var analyzer = (0, _webAudioAnalyser2['default'])(audio, _util2['default'].analyzerOptions);
        analyzer.analyser.smoothingTimeConstant = 0.3;

        var frequencies,
            freqBinCount = analyzer.analyser.frequencyBinCount,
            afaData = [];

        var speed = 1 / pointsPerSecond;

        var analysisLoop, progressLoop;

        // although the audio file will not be "played" regularly, this event will still be
        // triggered when `audio.currentTime` is set to a value >= `audio.duration` in `analysisLoop`
        audio.addEventListener("ended", function () {
            // end analysis loop
            clearInterval(analysisLoop);

            console.log("successfully created .afa file for %c%s", "font-weight: 600; font-size: 1.2em;", _path2['default'].basename(filePath));

            var results = {
                analysis: {
                    data: afaData,
                    freqBinCount: freqBinCount // array of Uint8Array's
                },
                sourcePath: filePath
            };

            // clean up audio context
            analyzer.ctx.close().then(function () {
                // end progress loop
                progressBar.complete();
                clearInterval(progressLoop);

                // end analysis loop
                clearInterval(analysisLoop);

                resolve(results);
            });
        });

        audio.addEventListener("error", function (e) {
            var errorInfo = _util2['default'].handleAudioLoadError(e);

            // clean up audio context
            analyzer.ctx.close().then(function () {
                // end progress loop, analysis loop
                clearInterval(progressLoop);
                clearInterval(analysisLoop);

                // convey error in progress bar
                progressBar.error(errorInfo);
                reject(errorInfo);
            });
        });

        var progress = 0,
            first = false;
        audio.addEventListener("canplaythrough", function (e) {
            if (!first) {
                first = true;

                // remove indeterminate status from progress bar
                progressBar.start();

                // analyze the audio
                console.log("analyzing %c%s", "font-weight: 600; font-size: 1.2em;", _path2['default'].basename(filePath));
                analysisLoop = setInterval(function () {
                    frequencies = new Uint8Array(_util2['default'].normalize(analyzer.frequencies(), 0, 100));
                    afaData.push(frequencies);

                    progress = (audio.currentTime += speed) / trackLength;
                }, 1);
                window.loops.push(analysisLoop);

                // update progress bar in a separate detached loop (async)
                progressLoop = setInterval(function () {
                    // update progress bar
                    progressBar.set(progress);
                }, 50);
                window.loops.push(progressLoop);
            }
        });
    });
}

function saveDataToFile(_ref2) {
    var analysis = _ref2.analysis;
    var sourcePath = _ref2.sourcePath;
    var _ref2$gzip = _ref2.gzip;
    var gzip = _ref2$gzip === undefined ? false : _ref2$gzip;
    var _ref2$progressBar = _ref2.progressBar;
    var progressBar = _ref2$progressBar === undefined ? {
        start: noop,
        set: noop,
        error: noop,
        complete: noop
    } : _ref2$progressBar;

    var folder = destPicker.paths[0];
    var dest = _path2['default'].resolve(folder, _path2['default'].basename(sourcePath)).replace(/\.[a-zA-Z]*$/i, ".afa");

    progressBar.start();

    var file = new _afaFile2['default'](analysis);

    return new Promise(function (resolve, reject) {
        if (dest === __dirname) {
            return reject({
                msg: "Destination directory not set!",
                loc: "saveDataToFile",
                notify: true
            });
        }

        if (gzip === true) {
            progressBar.set(33);

            dest += ".gz";
            file.toGzipped().then(function (gzipped) {
                progressBar.set(66);
                // TODO: update progress of save bar as file is written
                _fs2['default'].writeFile(dest, gzipped, "utf8", function () {
                    progressBar.set(100);
                    progressBar.complete();
                    resolve();
                });
            })['catch'](function (err) {
                progressBar.error();
                reject({
                    err: err,
                    msg: "Error while gzipping file",
                    loc: "AFAFile.prototype.toGzipped",
                    notify: true
                });
            });
        } else {
            progressBar.set(50);
            _fs2['default'].writeFile(dest, gzipped, "utf8", function () {
                progressBar.set(100);
                progressBar.complete();
                resolve();
            });
        }
    });
}

// display files (automatically registers `filePath`'s and `entry`'s')
/*"indeterminate"*/
//# sourceMappingURL=main.js.map
