/* global MaterialDataTable */
/* jshint esnext: true */
const fs = require('fs');
const path = require('path');

import util from './util';
import notifications from './notifications';
import loadingStates from './loadingStates';

import AFAFile from 'afa-file';

import audioAnalyzer from 'web-audio-analyser';

const $fileInput = $('input#upload'),
    $destLabel = $('#destLabel'),
    $innerDestLabel = $destLabel.find('span'),
    $interface = $('#interface'),
    $trackList = $('#track-list');

var trackListTable = new MaterialDataTable($trackList.get(0));

//

import FileList from './fileList';

const fileList = new FileList({ trackListTable });

import FilePickerDialog from './filePickerDialog';

const destPicker = new FilePickerDialog();

//

import ipc from 'ipc';
$('#exit-button').click(() => {
    ipc.sendSync('window', 'close');
});

//

var working = false;

//

$('body')
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

$('#interface, div#upload-button, #interface #blank-state-text').click(() => {
    $fileInput.click();
});

$('#chooseDestButton').click(() => {
    promptDestPicker();
});

$('#interface #track-list').click(util.stopPropagation);

//

$('.mdl-menu.main, .mdl-menu.main *').click(util.stopPropagation);

function handleFileInputChange() {
    handleFiles($(this).get(0).files);
}

const maxConcurrentCtxs = 1;

var handleProcessButtonClick = function handleProcessButtonClick() {

    if (!destPicker.paths[0]) {
        var path = promptDestPicker();

        if (path !== undefined && path.length > 0) {
            this.start(fileList.files);
        } else {
            notifications.err('Error: No destination directory was provided. [Try Again]'); // TODO: make [Try Again] a text button (material toast "action")
        }
    } else {
        this.start(fileList.files);
    }
    
}.bind({
    start: (function start(files) {
        working = true;
        $interface.addClass('working');

        // hide #process-button, show #stop-button
        $('#process-button').hide();
        $('#stop-button').show();

        this.process(files);
    }).bind({
        process(files) {
            // process the first batch of files
        
            var numProcessed = 0,
                firstFiles = util.sliceObj(files, 0, maxConcurrentCtxs),
                nextFile;
        
            var beforeEachTrack = () => { numProcessed++; };
            
            var onOneTrackCompleted = function onOneTrackCompleted() {
                // for every track completed, process the next one on the queue and have `processFiles` call back
                // to this function after that track has completed
                nextFile = util.sliceObj(files, numProcessed, numProcessed + 1);
        
                if (!$.isEmptyObject(nextFile)) {
                    processFiles(nextFile, { beforeEachTrack, onOneTrackCompleted });
                } else {
                    $('#stop-button').hide();
                    $('#process-button').show();
                }
            };
            
            processFiles(firstFiles, { beforeEachTrack, onOneTrackCompleted });
        }
    })
});

var $pointsPerSecond = $('input[type=range]#pointsPerSecond'),
    $pointsPerSecondCounter = $('span#pointsPerSecondCounter > span.inner');

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

var destLabelHover = function destLabelHover() {
    var textWidth = $innerDestLabel.width(),
        labelWidth = $destLabel.parent().width() - 32; // width of li minus 2em on left (where button is)

    if (textWidth - labelWidth > 0) {
        var rightPos = textWidth - labelWidth,
            time = (textWidth - labelWidth + 16) * 6; // 6 ms for every pixel that will scroll

        return [
            function mouseIn() {
                $innerDestLabel.animate({
                    right: `${rightPos}px`
                }, time, 'linear', function() {
                    $(this).stop();
                });
            },
            function mouseOut() {
                $innerDestLabel.stop()
                    .animate({
                        right: '0'
                    }, 400, 'linear');
            }
        ];
    } else return [];
};

function promptDestPicker() {
    var path = destPicker.pick()[0];

    if (path) {
        $innerDestLabel.text(path);
        $destLabel.parent().addClass('filled');
        $('#chooseDestButton').removeClass('mdl-button--raised');

        $destLabel.off('mouseenter mouseleave').hover.apply($destLabel, destLabelHover());
    }

    return path;
}

$('input[type=file]#upload').change(handleFileInputChange);
$pointsPerSecond.on('change input', handlePointsPerSecondRangeChange.bind($pointsPerSecond));
$('#process-button').click(handleProcessButtonClick);

window.loops = [];
$('#stop-button').click(() => {
    // clear all loops
    window.loops.forEach(clearInterval);

    // remove all progress bars
    var files = fileList.files,
        $entry, $checkbox;
        
    // for each file,
    for (let tmpFilePath in files) {
        // for its corresponding entry element,
        $entry = files[tmpFilePath].entry;
        
        // remove the progress bar
        $entry.find('.mdl-progress').remove();
        
        // re-enable the checkbox
        $checkbox = $entry.find('> td.label > .mdl-checkbox input[type=checkbox]').prop('disabled', false).parent().get(0);
        if ($checkbox) $checkbox.MaterialCheckbox.checkDisabled();
    }

    // show #process-button again
    $("#process-button").show();
    $('#stop-button').hide();
});

//

var invalidFileFormatMsg = (fileName) => `${fileName}: Invalid file format (currently, only .wav and .mp3 files are supported)`;

function handleFiles(files) {
    var filePaths = [];

    [].slice.call(files).forEach((file) => {
        let fileName = file.name;
        if (!/\.(?:wav|mp3)$/i.test(path.basename(fileName))) {
            console.error('ERR: ' + invalidFileFormatMsg(fileName));
            notifications.err(invalidFileFormatMsg(fileName));
        } else {
            filePaths.push(file.path);
        }
    });

    util.resetInput($fileInput);

    if (filePaths[0]) {
        prepareFiles(filePaths)
            .then(() => {
                // update interface
                $interface.removeClass('blank');
                $('#interface, div#upload-button, #interface #blank-state-text').off('click');
            })
            
            // errors are already handled in try..catch
            .catch((err) => {
                // console.log(err);
            });
    }
}

async function prepareFiles(filePaths) {
    try {
        let tmpFilePaths = await util.tmp.copyFilesToTmp(filePaths);

        // display files (automatically registers `filePath`'s and `entry`'s')
        await * tmpFilePaths.map(fileList.displayFile.bind(fileList));
        return;
    } catch (err) {
        util.handleError(err);
    }
}

function processFiles(files, { beforeEachTrack, onOneTrackCompleted }) {
    // set configuration variables to the values of the options' corresponding inputs in the interface
    var gzip = $('input#gzip').is(':checked'),
        pointsPerSecond = parseInt($pointsPerSecond.val());

    var file,
        trackLength;

    for (let tmpFilePath in files) {
        file = files[tmpFilePath];

        var $entry = file.entry;

        // skip over unselected tracks and completed tracks
        if (!$entry.hasClass('is-selected') || $entry.hasClass('is-completed')) {
            beforeEachTrack();
            onOneTrackCompleted();
            continue;
        }

        var progressBar = loadingStates.createProgressBar( /*"indeterminate"*/ ),
            $progressBar = $(progressBar.element_);

        $entry.append($progressBar);
        $progressBar = util.withRefs($progressBar); // reattach references

        $progressBar.addClass('analysis-progress');

        trackLength = file.trackLength;

        var progressOpts = {
            analysis: {
                start() {
                    // $progressBar.removeClass("mdl-progress__indeterminate");
                    this.$progressBar.addClass('current');

                    // disable checkbox, update through MDL
                    this.$entry.find('> td.label > .mdl-checkbox input[type=checkbox]').prop('disabled', true)
                        .parent().get(0).MaterialCheckbox.checkDisabled();
                },

                set(progress) {
                    this.progressBar.setProgress(progress * 100);
                },

                error() {
                    this.$progressBar.addClass('errored');
                },

                complete() {
                    this.$progressBar.removeClass('current');
                }
            },
            save: {
                start() {
                    this.$progressBar.fadeOut(100);

                    this.progressBar.setProgress(0);
                    this.$progressBar.addClass('saving');

                    this.$progressBar.fadeIn(100);
                },

                set(progress) {
                    this.progressBar.setProgress(progress * 100);
                },

                error() {
                    this.$progressBar.addClass('errored');
                },

                complete() {
                    // remove progress bar
                    this.$progressBar.remove();

                    // replace checkbox with a "done" icon (check mark)
                    var $icon = $('<i/>').addClass('icon material-icons').text('done');
                    this.$entry.find('> td.label > .mdl-checkbox').remove(); // remove checkbox
                    this.$entry.find('> td.label').append($icon); // add icon
                    
                    this.$entry.addClass('is-completed'); // mark entry as a completed track

                    this.$progressBar.removeClass('current');
                    this.onOneTrackCompleted();
                }
            }

        };

        // bind each function with a context that provides reference to the current state of each of the
        // relevant variables, as these variables will be overwritten in the next iteration of our^ for..in loop

        let analysisOpts = progressOpts.analysis; // cache
        for (let method in analysisOpts) {
            analysisOpts[method] = analysisOpts[method].bind({
                progressBar,
                $progressBar,
                $entry
            });
        }

        let saveOpts = progressOpts.save; // cache
        for (let method in saveOpts) {
            saveOpts[method] = saveOpts[method].bind({
                progressBar,
                $progressBar,
                $entry,
                onOneTrackCompleted
            });
        }

        // numProcessed++ so that when any track completes, the next available analysis will not process this one
        beforeEachTrack();

        analyzeAudioTrack(tmpFilePath, {
                pointsPerSecond,
                trackLength,
                progressBar: analysisOpts
            })
            .then((results) => {
                saveDataToFile(results.analysis, {
                        sourcePath: results.sourcePath,
                        gzip,
                        progressBar: saveOpts
                    })
                    .then(() => {
                        console.log('successfully saved .afa file for %c%s', 'font-weight: 600; font-size: 1.2em;', path.basename(tmpFilePath));
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

function analyzeAudioTrack(filePath, {
    pointsPerSecond=1000,
    trackLength,
    progressBar = {
        start() {},
        set(progress) {},
        error() {},
        complete() {}
    }
}) {
    return new Promise((resolve, reject) => {
        var audio = new Audio();

        // configure `audio`
        audio.autoplay = false;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
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
        audio.addEventListener('ended', () => {
            // end analysis loop
            clearInterval(analysisLoop);

            console.log('successfully created .afa file for %c%s', 'font-weight: 600; font-size: 1.2em;', path.basename(filePath));

            var results = {
                analysis: {
                    data: afaData,
                    freqBinCount: freqBinCount // array of Uint8Array's
                },
                sourcePath: filePath
            };

            // clean up audio context
            analyzer.ctx.close().then(() => {
                // end progress loop
                progressBar.complete();
                clearInterval(progressLoop);

                // end analysis loop
                clearInterval(analysisLoop);

                resolve(results);
            });
        });

        audio.addEventListener('error', (e) => {
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
        audio.addEventListener('canplaythrough', (e) => {
            if (!first) {
                first = true;

                // remove indeterminate status from progress bar
                progressBar.start();

                // analyze the audio
                console.log('analyzing %c%s', 'font-weight: 600; font-size: 1.2em;', path.basename(filePath));
                analysisLoop = setInterval(() => {
                    // TODO: make normalization optional, make the default regulator a "non- compressor"
                    // !!! analyzer.frequencies seems to produce only [0..]: FIXME
                    frequencies = util.normalize(analyzer.frequencies(), 100);
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

function saveDataToFile(analysis, {
    sourcePath,
    gzip = false,
    progressBar = {
        start() {},
        set(progress) {},
        error() {},
        complete() {}
    }
}) {
    var folder = destPicker.paths[0];
    var dest = path.resolve(folder, path.basename(sourcePath)).replace(/\.[a-zA-Z]*$/i, '.afa');

    progressBar.start();

    var file = new AFAFile(analysis);

    return new Promise((resolve, reject) => {
        if (dest === __dirname) {
            return reject({
                msg: 'Destination directory not set!',
                loc: 'saveDataToFile',
                notify: true
            });
        }

        if (gzip === true) {
            progressBar.set(33);

            dest += '.gz';
            file.toGzipped()
                .then((gzipped) => {
                    progressBar.set(66);

                    // TODO: update progress of save bar as file is written
                    fs.writeFile(dest, gzipped, 'utf8', () => {
                        progressBar.set(100);
                        progressBar.complete();
                        resolve();
                    });
                })
                .catch((err) => {
                    progressBar.error();
                    reject({
                        err: err,
                        msg: 'Error while gzipping file',
                        loc: 'AFAFile.prototype.toGzipped',
                        notify: true
                    });
                });
        } else {
            progressBar.set(50);
            fs.writeFile(dest, file.toString(), 'utf8', () => {
                progressBar.set(100);
                progressBar.complete();
                resolve();
            });
        }
    });
}
