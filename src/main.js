/* global actionButton, fileList, destPicker, MaterialDataTable, working */
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

import ActionButton from './ActionButton';
window.actionButton = new ActionButton({
    $processButton: $("#process-button"),
    $stopButton: $("#stop-button")
});

import FileList from './FileList';
window.fileList = new FileList({ trackListTable });

import FilePickerDialog from './FilePickerDialog';
window.destPicker = new FilePickerDialog();

//

import ipc from 'ipc';
$('#exit-button').click(() => {
    ipc.sendSync('window', 'close');
});

//

window.working = false;

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

        if (!working) e.originalEvent.dataTransfer.dropEffect = 'copy'; // show the "copy" drop effect (i.e. with plus sign on win chrome)
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

// TODO: separate this func esp. into its own module (alongside related functions?)
// (modularize functions, group by their domain/purpose, whichever is more intuitive)

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

        actionButton.updateForState('processing');

        this.process(files);
    }).bind({
        process(files) {
            // process the first batch of files
        
            var numProcessed = 0,
                firstFiles = util.sliceObj(files, 0, maxConcurrentCtxs),
                nextFile;

            var beforeEachTrack = () => { numProcessed++; };

            var onOneTrackDone = function onOneTrackDone(file) {
                // processFiles calls `onOneTrackDone(null)` when skipping over tracks
                if (file !== null) {
                    file.completed = true;
                }
                
                // for every track completed, process the next one on the queue and have `processFiles` call back
                // to this function after that track has completed
                nextFile = util.sliceObj(files, numProcessed, numProcessed + 1);
                
                // if there is a nextFile,
                if (!$.isEmptyObject(nextFile)) {
                    // process it, passing a reference back to `beforeEachTrack` and `onOneTrackOne`
                    processFiles(nextFile, { beforeEachTrack, onOneTrackDone });
                } else {
                    // if there is no next track in the list, consider the process finished
                    working = false;
                    $interface.removeClass('working');
                    
                    // if all files are completed, (see ActionButton.js)
                    if (!actionButton.updateForState('finished')) {
                        // then we're done (hide the processButton)
                        $interface.addClass('done');
                    }
                }
            };

            processFiles(firstFiles, { beforeEachTrack, onOneTrackDone });
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
                }, time, 'linear', function () {
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
var stopping = false;
$('#stop-button').click(() => {
    // clear all loops
    stopping = true;
    window.loops.forEach(clearInterval);


    // remove all progress bars:
    
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

    // if there is no next track in the list, consider the process finished
    working = false;
    $interface.removeClass('working');
    
    // if all files are completed, (see ActionButton.js)
    if (!actionButton.updateForState('finished')) {
        // then we're done (hide the processButton)
        $interface.addClass('done');
    }
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
                // update interface:
                
                // remove 'blank' class and 'done' class (only one will be there), animating in the '#process-button' FAB
                $interface.removeClass('blank').removeClass('done');
                // and unbind blank state click handlers (i.e. unbind from clicking $fileInput)
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
        await * tmpFilePaths.map(::fileList.displayFile);
        return;
    } catch (err) {
        util.handleError(err);
    }
}

function processFiles(files, { beforeEachTrack, onOneTrackDone }) {
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
            onOneTrackDone(null);
            continue;
        }

        var progressBar = loadingStates.createProgressBar( /*"indeterminate"*/),
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
                    this.onOneTrackDone(file);
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
                onOneTrackDone
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
    pointsPerSecond = 1000,
    trackLength,
    progressBar = {
        start() { },
        set(progress) { },
        error() { },
        complete() { }
    }
}) {
    return new Promise((resolve, reject) => {
        var audio = new Audio();

        // configure `audio`
        audio.autoplay = false;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.volume = 1;
        audio.playbackRate = 0;
        
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
                // update progress bar to complete state
                progressBar.complete();
                
                // end progress loop, analysis loop
                clearInterval(progressLoop);
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
            if (!first) { // handling mysterious duplicate `audio`s being created for a single source
                first = true;

                // remove an indeterminate status from progress bar
                progressBar.start();

                // analyze the audio file
                console.log('analyzing %c%s', 'font-weight: 600; font-size: 1.2em;', path.basename(filePath));
                
        // _____/\\\\\\\\\____________/\\\\\\\\\___/\\\\\\\\\\\\\\\___/\\\\\\\\\\\________/\\\\\________/\\\\\_____/\\\_
        //  ___/\\\\\\\\\\\\\_______/\\\////////___\///////\\\/////___\/////\\\///_______/\\\///\\\_____\/\\\\\\___\/\\\_       
        //   __/\\\/////////\\\____/\\\/__________________\/\\\____________\/\\\________/\\\/__\///\\\___\/\\\/\\\__\/\\\_      
        //    _\/\\\_______\/\\\___/\\\____________________\/\\\____________\/\\\_______/\\\______\//\\\__\/\\\//\\\_\/\\\_     
        //     _\/\\\\\\\\\\\\\\\__\/\\\____________________\/\\\____________\/\\\______\/\\\_______\/\\\__\/\\\\//\\\\/\\\_    
        //      _\/\\\/////////\\\__\//\\\___________________\/\\\____________\/\\\______\//\\\______/\\\___\/\\\_\//\\\/\\\_   
        //       _\/\\\_______\/\\\___\///\\\_________________\/\\\____________\/\\\_______\///\\\__/\\\_____\/\\\__\//\\\\\\_  
        //        _\/\\\_______\/\\\_____\////\\\\\\\\\________\/\\\_________/\\\\\\\\\\\_____\///\\\\\/______\/\\\___\//\\\\\_ 
        //         _\///________\///_________\/////////_________\///_________\///////////________\/////________\///_____\/////__                                     
                                                 
                
                audio.play();
                
                analysisLoop = setInterval(() => {
                    if (stopping) return;
                    
                    // !!! analyzer.frequencies seems to produce only [0..]: FIXME
                    frequencies = util.normalize(analyzer.frequencies(), {
                        from: 0,
                        to: 100,
                        alreadyNormalized: { // just scale the values; `getByteFrequencyData` outputs a normalized array from 0 - 255
                            from: 0,
                            to: 255
                        }
                    });
                    afaData.push(frequencies);

                    progress = (audio.currentTime += speed) / trackLength;
                }, 1);
                window.loops.push(analysisLoop);

                // update progress bar in a separate detached loop (async with `analysisLoop`)
                progressLoop = setInterval(() => {
                    if (stopping) return;
                    
                    // update progress bar
                    progressBar.set(progress);
                }, 50);
                window.loops.push(progressLoop);
            }
        }, false);
    });
}

function saveDataToFile(analysis, {
    sourcePath,
    gzip = false,
    progressBar = {
        start() { },
        set(progress) { },
        error() { },
        complete() { }
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
