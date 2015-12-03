/* global $pointsPerSecond, fileWriter, interfaceStateController */

const path = require('path');

import util from './util';
import loadingStates from './loadingStates';

import analyzeAudioTrack from './core';

function processFiles(files, { beforeEachTrack, onOneTrackDone }) {
    // set configuration variables to the values of the options' corresponding inputs in the interface
    var gzip = $('input#gzip').is(':checked'),
        pointsPerSecond = parseInt($pointsPerSecond.val());

    var filePaths = Object.keys(files),
        tmpFilePath, file;

    var $entry, progressBar, $progressBar;

    for (let i = 0; i < filePaths.length; i++) {
        // if analysis is currently stopping or has been stopped (interface now in idle state),
        if (interfaceStateController.isState('stopping') || interfaceStateController.isState('idle')) {
            return; // then exit
        }

        tmpFilePath = filePaths[i];
        file = files[tmpFilePath];

        $entry = file.entry;

        // skip over unselected tracks and completed tracks
        if (!$entry.hasClass('is-selected') || $entry.hasClass('is-completed')) {
            beforeEachTrack();
            onOneTrackDone(null);
            continue;
        }

        // PROGRESS BAR

        progressBar = loadingStates.createProgressBar( /*"indeterminate"*/),
        $progressBar = $(progressBar.element_);

        $entry.append($progressBar);
        $progressBar = util.withRefs($progressBar); // reattach references

        $progressBar.addClass('analysis-progress');

        //

        let { analysisOpts, saveOpts } = createProgressOpts({ onOneTrackDone, file, $progressBar, progressBar, $entry });

        // exec. numProcessed++ so that when any track completes, the next available audio context will not be used to process this one
        beforeEachTrack();

        analyzeAudioTrack(tmpFilePath, {
            pointsPerSecond,
            trackLength: file.trackLength,
            progressBar: analysisOpts
        })
            .then((results) => {
                fileWriter.saveDataToFile(results.analysis, {
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
                if (err.notify === true) err.args = [tmpFilePath];
                util.handleError(err);
            });
    }
}

function createProgressOpts({ onOneTrackDone, file, $progressBar, progressBar, $entry }) {
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

    return { analysisOpts, saveOpts };
}

export default processFiles;
