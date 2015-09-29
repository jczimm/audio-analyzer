/* jshint esnext: true */

import fs from 'fs';
import path from 'path';

import util from './util';
import notifications from './notifications';
import loadingStates from './loadingStates';

import AFAFile from 'afa-file';

import audioAnalyzer from 'web-audio-analyser';

const $fileInput = $("input#upload"),
    $destLabel = $("span#destLabel"),
    $interface = $("#interface"),
    $trackList = $("#track-list");

var trackListTable = new MaterialDataTable($trackList.get(0));

//

const noop = () => {};

// 

import FileList from './fileList';

const fileList = new FileList(trackListTable);


import FilePickerDialog from './filePickerDialog';

const destPicker = new FilePickerDialog();

//

import ipc from 'ipc';
$("#exit-button").click(() => {
    ipc.sendSync("window", "close");
});

//

var working = false;

//

$("body")
    .on('drop', (e) => {
        e.stopPropagation();
        e.preventDefault();

        var droppedFiles = e.originalEvent.dataTransfer.files;

        if (!working) handleFiles(droppedFiles[0] ? droppedFiles : e.target.files);
    })
    .on('dragover', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!working) e.originalEvent.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    });

$("#interface, div#upload-button, #interface #blank-state-text").click(() => {
    $fileInput.click();
});

$("#chooseDestButton").click(() => {
    promptDestPicker();
});

$("#interface #track-list").click(util.stopPropagation);

//

$(".mdl-menu.main, .mdl-menu.main *").click(util.stopPropagation);


function handleFileInputChange() {
    handleFiles($(this).get(0).files);
}


const maxConcurrentCtxs = 6;

function handleProcessButtonClick() {

    var process = function process(files) {

        // process the first batch of files

        var numCompleted = 0,
            firstFiles = util.sliceObj(files, 0, maxConcurrentCtxs),
            nextFile;

        var beforeEachTrack = function beforeEachTrack() {
            numCompleted++;
        };

        processFiles(firstFiles, beforeEachTrack, function oneTrackCompleted() {
            // for every track completed, process the next one on the queue and have `processFiles` call back
            // to this function after that track has completed
            nextFile = util.sliceObj(files, numCompleted, numCompleted + 1);
            if (nextFile !== {}) {
                processFiles(nextFile, beforeEachTrack, oneTrackCompleted);
            } else {
                $("#stop-button").hide();
            }
        });
    };

    var start = function start() {
        working = true;

        // hide #process-button, show #stop-button
        $("#process-button").hide();
        $("#stop-button").show();

        process(fileList.files);
    }

    if (!destPicker.paths[0]) {
        var path = promptDestPicker();
        if (path !== undefined && path.length > 0) {
            start();
        } else notifications.err("Error: No destination directory was provided. [Try Again]");
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
$("#stop-button").click(() => {
    // clear all loops
    window.loops.forEach(clearInterval);

    // remove all progress bars
    var files = fileList.files,
        $entry;
    for (let tmpFilePath in files) {
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

    [].slice.call(files).forEach((file) => {
        if (!/\.(?:wav|mp3)$/i.test(path.basename(file.name))) {
            console.error("ERR: " + invalidFileFormatMsg);
            notifications.err(invalidFileFormatMsg);
        } else {
            filePaths.push(file.path);
        }
    });

    util.resetInput($fileInput);

    if (filePaths[0]) {
        prepareFiles(filePaths)
            .then(() => {
                // update interface
                $interface.removeClass("blank");
                $("#interface, div#upload-button, #interface #blank-state-text").off("click");
            })
            .catch((err) => {
                // console.log(err);
            });
    }
}

async function prepareFiles(filePaths) {
    try {
        let tmpFilePaths = await util.tmp.copyFilesToTmp(filePaths);
        // display files (automatically registers `filePath`'s and `entry`'s')
        await* tmpFilePaths.map(fileList.displayFile.bind(fileList));
        return;
    } catch (err) {
        util.handleError(err);
    }

    // return new Promise((resolve, reject) => {
    //     util.tmp.copyFilesToTmp(filePaths)
    //         .then((tmpFilePaths) => {

    //             // display files (automatically registers `filePath`'s and `entry`'s')
    //             Promise.all(tmpFilePaths.map(fileList.displayFile.bind(fileList)))
    //                 .then((filePaths) => {
    //                     resolve();
    //                 })
    //                 .catch((err) => {
    //                     console.error("ERR @ FileList.displayFile: ", err);
    //                     notifications.err(err.msg);
    //                     reject(err);
    //                 });

    //         })
    //         .catch((err) => {
    //             console.error("ERR @ util.copyFilesToTmp: ", err);
    //         });
    // });
}

function processFiles(files, beforeEachTrack, oneTrackCompleted) {
    // set configuration variables to the values of the options' corresponding inputs in the interface
    var gzip = $("input#gzip").is(":checked"),
        pointsPerSecond = parseInt($pointsPerSecond.val()),
        dest = destPicker.paths[0];

    var file,
        trackLength;

    for (let tmpFilePath in files) {
        file = files[tmpFilePath];

        var $entry = file.entry;

        // skip over unchecked tracks
        if (!$entry.hasClass("is-selected")) continue;

        var progressBar = loadingStates.createProgressBar( /*"indeterminate"*/ ),
            $progressBar = $(progressBar.element_);

        $entry.append($progressBar);
        $progressBar = util.withRefs($progressBar); // reattach references

        $progressBar.addClass("analysis-progress");

        trackLength = file.trackLength;

        var progressOpts = {
            start: function start() {
                // $progressBar.removeClass("mdl-progress__indeterminate");
                this.$progressBar.addClass("current");
            },
            set: function set(progress) {
                this.progressBar.setProgress(progress * 100);
            },
            error: function error() {
                this.$progressBar.remove();
                // TODO: make progress bar red instead
            },
            complete: function complete() {
                // remove progress bar
                this.$progressBar.remove();

                // replace checkbox with a "done" icon (check mark)
                var $icon = $("<i/>").addClass("icon material-icons").text("done");
                this.$entry.find('> td:has(.mdl-checkbox)').html($icon);

                this.$progressBar.removeClass("current");
                this.oneTrackCompleted();
            }
        };

        for (let method in progressOpts) {
            progressOpts[method] = progressOpts[method].bind({
                progressBar, $progressBar, $entry, oneTrackCompleted
            });
        }

        beforeEachTrack();

        analyzeAudioTrack({
                filePath: tmpFilePath,
                pointsPerSecond,
                trackLength,
                progressBar: progressOpts
            })
            .then((results) => {
                saveDataToFile(results.analysis, results.sourcePath, gzip)
                    .then(() => {
                        console.log("successfully saved .afa file for %c%s", "font-weight: 600; font-size: 1.2em;", path.basename(tmpFilePath));
                    }).catch((err) => {
                        util.handleError(err);
                    });
            })
            .catch((err) => {
                err.notify = true;
                err.args = [tmpFilePath];
                util.handleError(err);
            });
    }
}

function analyzeAudioTrack({
    filePath, pointsPerSecond, trackLength, progressBar = {
        start: noop,
        set: noop,
        error: noop,
        complete: noop
    }
}) {

    return new Promise((resolve, reject) => {
        var audio = new Audio();
        // configure `audio`
        audio.autoplay = false;
        audio.preload = "auto";
        audio.src = filePath;

        var analyzer = audioAnalyzer(audio, util.analyzerOptions);
        analyzer.analyser.smoothingTimeConstant = 0.3;

        var frequencies,
            freqBinCount = analyzer.analyser.frequencyBinCount,
            afaData = [];

        var speed = 1 / pointsPerSecond;

        var analysisLoop, progressLoop;

        // although the audio file will not be "played" regularly, this event will still be
        // triggered when `audio.currentTime` is set to a value >= `audio.duration` in `analysisLoop`
        audio.addEventListener("ended", () => {
            // end analysis loop
            clearInterval(analysisLoop);

            console.log("successfully created .afa file for %c%s", "font-weight: 600; font-size: 1.2em;", path.basename(filePath));

            var results = {
                analysis: {
                    data: afaData,
                    freqBinCount: freqBinCount // array of Uint8Array's
                },
                sourcePath: filePath
            };

            // clean up audio context
            analyzer.ctx.close().then(() => {
                // remove progress bar, end progress loop
                progressBar.complete();
                clearInterval(progressLoop);

                // end analysis loop
                clearInterval(analysisLoop);

                resolve(results);
            });
        });

        audio.addEventListener("error", (e) => {
            var errorInfo = util.handleAudioLoadError(e);

            // clean up audio context
            analyzer.ctx.close().then(() => {
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
        audio.addEventListener("canplaythrough", (e) => {
            if (!first) {
                first = true;

                // remove indeterminate status from progress bar
                progressBar.start();

                // analyze the audio
                console.log("analyzing %c%s", "font-weight: 600; font-size: 1.2em;", path.basename(filePath));
                analysisLoop = setInterval(() => {
                    frequencies = new Uint8Array(util.normalize(analyzer.frequencies(), 0, 100));
                    afaData.push(frequencies);

                    progress = (audio.currentTime += speed) / trackLength;
                }, 1);
                window.loops.push(analysisLoop);

                // update progress bar in a separate detached loop (async)
                progressLoop = setInterval(() => {
                    // update progress bar
                    progressBar.set(progress);
                }, 50);
                window.loops.push(progressLoop);
            }
        });
    });
}

function saveDataToFile(analysis, sourcePath, gzip) {

    var folder = destPicker.paths[0];
    var dest = path.resolve(folder, path.basename(sourcePath)).replace(/\.[a-zA-Z]*$/i, ".afa");

    var file = new AFAFile(analysis);

    return new Promise((resolve, reject) => {
        if (dest === __dirname) {
            return reject({
                msg: "Destination directory not set!",
                loc: "saveDataToFile",
                notify: true
            });
        }

        if (gzip === true) {
            dest += ".gz";
            file.toGzipped()
                .then((gzipped) => {
                    fs.writeFile(dest, gzipped, "utf8", () => {
                        resolve();
                    });
                })
                .catch((err) => {
                    reject({
                        err: err,
                        msg: "Error while gzipping file",
                        loc: "AFAFile.prototype.toGzipped",
                        notify: true
                    });
                });
        } else {
            fs.writeFile(dest, gzipped, "utf8", () => {
                resolve();
            });
        }
    });
}
