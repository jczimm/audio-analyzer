/* global globals */

const path = require('path');

import util from './util';

import AudioAnalyzer from './AudioAnalyzer';

//

const successStyling = 'font-weight: 600; font-size: 1.2em;';

//

function progressOpts({ onOneTrackDone, file, $progressBar, progressBar, $entry }) {
    return {
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
            },
            progressBar,
            $progressBar,
            $entry,
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
                const $icon = $('<i/>').addClass('icon material-icons').text('done');
                this.$entry.find('> td.label > .mdl-checkbox').remove(); // remove checkbox
                this.$entry.find('> td.label').append($icon); // add icon

                this.$entry.addClass('is-completed'); // mark entry as a completed track

                this.$progressBar.removeClass('current');
                this.onOneTrackDone(file);
            },
            progressBar,
            $progressBar,
            $entry,
            onOneTrackDone,
        },
    };
}

// process files in parallel
export default function processFiles(files, { beforeEachTrack, onOneTrackDone }) {
    // set configuration variables to the values of the options' corresponding inputs in the interface
    const audioAnalyzer = new AudioAnalyzer();

    const filePaths = Object.keys(files);
    let mode, gzip, pointsPerSecond,
        tmpFilePath, file,
        $entry, progressBar, $progressBar;

    for (let i = 0; i < filePaths.length; i++) {
        // if analysis is currently stopping or has been stopped (interface now in idle state),
        if (globals.interfaceStateController.isState('stopping') || globals.interfaceStateController.isState('idle')) {
            return; // then exit
        }

        // read options
        mode = $('input#mode').is(':checked') ? 'fast' : 'normal';
        gzip = $('input#gzip').is(':checked');
        pointsPerSecond = parseInt(globals.$pointsPerSecond.val(), 10);

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

        progressBar = util.loadingStates.createProgressBar( /* "indeterminate" */);
        $progressBar = $(progressBar.element_);

        $entry.append($progressBar);
        $progressBar = util.withRefs($progressBar); // reattach references

        $progressBar.addClass('analysis-progress');

        //

        const { analysis: analysisOpts, save: saveOpts } = progressOpts({ onOneTrackDone, file, $progressBar, progressBar, $entry });

        // exec. numProcessed++ so that when any track completes, the next available audio context will not be used to process this one
        beforeEachTrack();

        audioAnalyzer.analyzeAudioTrack(tmpFilePath, {
            fileHash: file.fileHash,
            mode,
            pointsPerSecond,
            trackLength: file.trackLength,
            progressBar: analysisOpts,
        })
            .then((results) => {
                globals.fileWriter.saveDataToFile(results.analysis, {
                    sourcePath: results.sourcePath,
                    gzip,
                    progressBar: saveOpts,
                })
                    .then(() => {
                        console.log('successfully saved .afa file for %c%s', successStyling, path.basename(tmpFilePath));
                    }).catch((err) => {
                        if (!err.loc) err.loc = 'FileWriter#saveDatatoFile';
                        util.handleError(err);
                    });
            })
            .catch((err) => {
                if (err.notify === true) err.args = [tmpFilePath];
                util.handleError(err);
            });
    }
}
